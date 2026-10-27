import type { Distribution, Library, LocalData, MetricSummary, ParamKey, Scenario, SimulationSummary } from './types.ts';
import { modelScenario, validateScenario } from './model.ts';
import { PARAMETER_KEYS, PARAMETER_META } from './scenario.ts';

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function normalRandom(random: () => number) { return Math.sqrt(-2 * Math.log(Math.max(Number.MIN_VALUE, random()))) * Math.cos(2 * Math.PI * random()); }
export function gammaRandom(shape: number, scale: number, random: () => number): number {
  if (shape < 1) return gammaRandom(shape + 1, scale, random) * Math.pow(Math.max(Number.MIN_VALUE, random()), 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (let tries = 0; tries < 10000; tries++) {
    const x = normalRandom(random), v0 = 1 + c * x;
    if (v0 <= 0) continue;
    const v = v0 ** 3, u = random();
    if (u < 1 - .0331 * x ** 4 || Math.log(u) < .5 * x * x + d * (1 - v + Math.log(v))) return scale * d * v;
  }
  throw new Error('Gamma sampler failed to converge.');
}
export function sampleDistribution(point: number, distribution: Distribution, random: () => number) {
  const d = distribution;
  if (d.kind === 'fixed') return point;
  if (d.kind === 'normal') return point + d.sd * normalRandom(random);
  if (d.kind === 'lognormal') return Math.exp(Math.log(point) + d.sd * normalRandom(random));
  if (d.kind === 'gamma') return gammaRandom(d.shape, d.scale, random);
  if (d.kind === 'beta') { const a = gammaRandom(d.alpha, 1, random), b = gammaRandom(d.beta, 1, random); return a / (a + b); }
  const u = random(), split = (d.mode - d.low) / (d.high - d.low);
  return u < split ? d.low + Math.sqrt(u * (d.high - d.low) * (d.mode - d.low)) : d.high - Math.sqrt((1 - u) * (d.high - d.low) * (d.high - d.mode));
}
export function quantile(sorted: number[], p: number) {
  if (!sorted.length) throw new Error('No simulation values.');
  const position = (sorted.length - 1) * p, index = Math.floor(position), weight = position - index;
  return sorted[index] * (1 - weight) + sorted[Math.min(index + 1, sorted.length - 1)] * weight;
}
export function summarize(values: number[]): MetricSummary {
  if (!values.length || values.some(v => !Number.isFinite(v))) throw new Error('Invalid simulation values.');
  const sorted = [...values].sort((a, b) => a - b);
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, median: quantile(sorted, .5), low: quantile(sorted, .025), high: quantile(sorted, .975) };
}
export function parameterFromProbability(mean: number, standardError: number): Distribution {
  const variance = standardError ** 2, common = mean * (1 - mean) / variance - 1;
  if (!(mean > 0 && mean < 1 && variance > 0 && common > 0)) throw new Error('Mean and variance do not define a beta distribution.');
  return { kind: 'beta', alpha: mean * common, beta: (1 - mean) * common };
}
export function bisectThreshold(fn: (value: number) => number, low: number, high: number, increasing = true): number | null {
  const sign = increasing ? 1 : -1;
  if (fn(low) * sign >= 0) return low;
  if (fn(high) * sign < 0) return null;
  for (let i = 0; i < 60; i++) { const middle = (low + high) / 2; if (fn(middle) * sign >= 0) high = middle; else low = middle; }
  return high;
}
function withValue(s: Scenario, key: ParamKey, value: number): Scenario { return { ...s, parameters: { ...s.parameters, [key]: { ...s.parameters[key], value } } }; }
export function runSimulation(s: Scenario, library: Library, local: LocalData): SimulationSummary {
  const issues = validateScenario(s, library, local);
  if (issues.some(i => i.severity === 'error')) throw new Error(issues.filter(i => i.severity === 'error').map(i => i.message).join(' '));
  const started = performance.now(), random = seededRandom(s.seed), base = modelScenario(s, library, local, true);
  const varied = PARAMETER_KEYS.filter(key => s.parameters[key].distribution.kind !== 'fixed' && (s.parameters[key].status === 'LITERATURE-DERIVED' || s.parameters[key].status === 'OBSERVED' || s.includeAssumedUncertainty));
  const values = { cost: [] as number[], impact: [] as number[], netBenefit: [] as number[], roi: [] as number[] };
  const fanValues = Array.from({ length: s.horizonYears }, () => [] as number[]), scatter: SimulationSummary['scatter'] = [];
  let withinBudget = 0, positive = 0, costSaving = 0, positiveImpact = 0, perfectDecision = 0;
  const sampleScenario: Scenario = { ...s, parameters: Object.fromEntries(PARAMETER_KEYS.map(key => [key, { ...s.parameters[key] }])) as Scenario['parameters'] };
  for (let draw = 0; draw < s.draws; draw++) {
    for (const key of varied) {
      const p = s.parameters[key], bounds = PARAMETER_META[key];
      let value = sampleDistribution(p.value, p.distribution, random), attempts = 0;
      // Rejection sampling enforces parameter support, rather than clipping tail values onto a boundary.
      while ((!Number.isFinite(value) || value < bounds.min || value > bounds.max) && attempts++ < 1000) value = sampleDistribution(p.value, p.distribution, random);
      if (!Number.isFinite(value) || value < bounds.min || value > bounds.max) throw new Error(`Distribution for ${bounds.label} has incompatible support.`);
      sampleScenario.parameters[key].value = value;
    }
    const result = modelScenario(sampleScenario, library, local, true);
    values.cost.push(result.financialCost);
    if (result.outcomes !== null) { values.impact.push(result.outcomes); if (s.targetOutcome !== null && s.targetOutcome !== undefined && result.outcomes >= s.targetOutcome) positiveImpact++; }
    if (result.netBenefit !== null) { values.netBenefit.push(result.netBenefit); perfectDecision += Math.max(0, result.netBenefit); if (result.netBenefit > 0) positive++; if (result.netCost < 0) costSaving++; }
    if (result.roi !== null) values.roi.push(result.roi);
    if (result.financialCost <= s.budget) withinBudget++;
    let cumulative = 0;
    result.annual.forEach((year, index) => { cumulative += year.outcomes ?? 0; fanValues[index].push(cumulative); });
    if (draw % Math.max(1, Math.ceil(s.draws / 80)) === 0 && result.outcomes !== null) scatter.push({ cost: result.financialCost, impact: result.outcomes });
  }
  const netBenefit = values.netBenefit.length ? summarize(values.netBenefit) : null;
  const selected = netBenefit ? values.netBenefit : values.impact.length ? values.impact : values.cost;
  const min = Math.min(...selected), max = Math.max(...selected), width = (max - min) / 24 || Math.max(1, Math.abs(min) * .01);
  const histogram = Array.from({ length: 24 }, (_, i) => ({ low: min + i * width, high: min + (i + 1) * width, count: 0 }));
  for (const value of selected) histogram[Math.min(23, Math.max(0, Math.floor((value - min) / width)))].count++;
  const sensitivityMetric = base.netBenefit !== null ? 'Net benefit (USD, present value)' : base.costPerOutcome !== null ? `Net cost per ${base.outcomeUnit}` : 'Program expenditure (USD)';
  const target = (scenario: Scenario) => { const r = modelScenario(scenario, library, local, true); return base.netBenefit !== null ? r.netBenefit ?? 0 : base.costPerOutcome !== null ? r.costPerOutcome ?? 0 : r.financialCost; };
  const sensitivity = PARAMETER_KEYS.flatMap(key => {
    const p = s.parameters[key];
    if (p.low === null || p.high === null || p.low === p.high) return [];
    const lowResult = target(withValue(s, key, p.low)), highResult = target(withValue(s, key, p.high));
    return [{ key, low: p.low, high: p.high, lowResult, highResult, span: Math.abs(highResult - lowResult) }];
  }).sort((a, b) => b.span - a.span);
  const fixedCost = base.financialCost - base.reached * s.parameters.variableCost.value;
  const maxUnitBudget = base.reached > 0 && s.budget >= fixedCost ? (s.budget - fixedCost) / base.reached : null;
  const breakUptake = base.netBenefit !== null ? bisectThreshold(value => modelScenario(withValue(s, 'uptake', value), library, local, true).netBenefit ?? -Infinity, 0, 1) : null;
  const maxVariableRoi = base.netBenefit !== null && (modelScenario(withValue(s, 'variableCost', 0), library, local, true).netBenefit ?? -1) >= 0 ? bisectThreshold(value => -(modelScenario(withValue(s, 'variableCost', value), library, local, true).netBenefit ?? -Infinity), 0, 100000) : null;
  const thresholds = [
    { label: 'Maximum variable cost within budget', value: maxUnitBudget, unit: 'USD/enrollee', reason: maxUnitBudget === null ? 'Fixed costs exceed budget or no people enroll.' : 'Budget minus fixed expenditure, divided by enrollment; staffing remains funded.' },
    { label: 'Minimum uptake for perspective break-even', value: breakUptake, unit: 'fraction', reason: base.netBenefit === null ? 'Requires an explicit monetary valuation and benefit-capture perspective.' : breakUptake === null ? 'No break-even within feasible uptake and capacity under current assumptions.' : 'Numerically solved against discounted net benefit; capacity and outcome lag retained.' },
    { label: 'Maximum variable cost at perspective break-even', value: maxVariableRoi === null ? null : Math.round(maxVariableRoi * 100) / 100, unit: 'USD/enrollee', reason: base.netBenefit === null ? 'Outcome valuation is missing.' : 'Numerically solved using the current benefit timing and perspective.' },
  ];
  return { seed: s.seed, draws: s.draws, durationMs: Math.round(performance.now() - started), varied: varied.map(key => ({ key, kind: s.parameters[key].distribution.kind, status: s.parameters[key].status })),
    metrics: { cost: summarize(values.cost), impact: values.impact.length ? summarize(values.impact) : null, netBenefit, roi: values.roi.length ? summarize(values.roi) : null },
    probability: { positiveRoi: values.roi.length ? positive / s.draws : null, costSaving: netBenefit && s.monetization === 'avoided cost' ? costSaving / s.draws : null, withinBudget: withinBudget / s.draws, targetImpact: values.impact.length && s.targetOutcome !== null && s.targetOutcome !== undefined ? positiveImpact / s.draws : null },
    histogram, histogramMetric: netBenefit ? 'Net benefit (USD)' : values.impact.length ? base.outcomeUnit : 'Program cost (USD)', fan: values.impact.length ? fanValues.map((v, i) => ({ year: i + 1, ...(() => { const q = summarize(v); return { low: q.low, median: q.median, high: q.high }; })() })) : [], scatter,
    sensitivity, sensitivityMetric, thresholds,
    evpi: netBenefit && s.monetization === 'avoided cost' && s.applicabilityReviewed && varied.length && !s.includeAssumedUncertainty ? Math.max(0, perfectDecision / s.draws - Math.max(0, netBenefit.mean)) : null,
    caveat: `Conditional parameter uncertainty: ${varied.length} parameters varied; all others fixed. ${s.includeAssumedUncertainty ? 'Explicit user-assumed distributions included.' : 'User-assumed operational ranges excluded.'} Independence is assumed. Transportability and structural uncertainty are not quantified. Intervals are not local causal confidence intervals.` };
}
