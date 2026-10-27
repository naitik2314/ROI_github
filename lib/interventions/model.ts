import type { EffectEvidence, Library, LocalData, ModelIssue, ModelResult, ParamKey, Scenario } from './types.ts';
import { MODEL_VERSION, PARAMETER_KEYS, PARAMETER_META, PERSPECTIVES } from './scenario.ts';

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const discount = (amount: number, annualRate: number, years: number) => amount / Math.pow(1 + annualRate, years);
export function economicMetrics(cost: number, benefit: number | null, outcome: number | null) {
  const netBenefit = benefit === null ? null : benefit - cost;
  return { netBenefit, netCost: cost - (benefit ?? 0), roi: cost > 0 && netBenefit !== null ? netBenefit / cost : null,
    bcr: cost > 0 && benefit !== null ? benefit / cost : null, costPerOutcome: outcome !== null && outcome > 0 ? (cost - (benefit ?? 0)) / outcome : null };
}
export function incrementalAnalysis(a: { cost: number; effect: number; outcomeId: string }, b: { cost: number; effect: number; outcomeId: string }, willingnessToPay?: number) {
  if (![a.cost, a.effect, b.cost, b.effect].every(Number.isFinite) || (willingnessToPay !== undefined && (!Number.isFinite(willingnessToPay) || willingnessToPay < 0))) throw new Error('Incremental analysis requires finite costs/effects and a nonnegative decision threshold.');
  if (a.outcomeId !== b.outcomeId) throw new Error('Incremental analysis requires the same outcome and comparator.');
  const deltaCost = b.cost - a.cost, deltaEffect = b.effect - a.effect;
  return { deltaCost, deltaEffect, icer: deltaEffect <= 0 ? null : deltaCost / deltaEffect,
    dominance: deltaCost === 0 && deltaEffect === 0 ? 'Equivalent' : deltaCost >= 0 && deltaEffect <= 0 && (deltaCost > 0 || deltaEffect < 0) ? 'Dominated' : deltaCost <= 0 && deltaEffect >= 0 && (deltaCost < 0 || deltaEffect > 0) ? 'Dominant' : 'Trade-off',
    nmb: willingnessToPay === undefined ? null : willingnessToPay * deltaEffect - deltaCost };
}
export function normalizeCost(value: number, fromIndex: number, toIndex: number) {
  if (![value, fromIndex, toIndex].every(Number.isFinite) || value < 0 || fromIndex <= 0 || toIndex <= 0) throw new Error('Valid positive price indices and nonnegative cost required.');
  return money(value * toIndex / fromIndex);
}
export function effectToAbsolute(effect: EffectEvidence, estimate: number, baseline: number, nativeSd = 0): { delta: number | null; treated: number | null } {
  const sign = effect.direction === 'increase' ? 1 : -1;
  let treated: number | null = null;
  if (effect.measure === 'risk_ratio') treated = Math.max(0, Math.min(1, baseline * estimate));
  if (effect.measure === 'odds_ratio') treated = baseline === 1 ? 1 : estimate * baseline / (1 - baseline + estimate * baseline);
  if (effect.measure === 'risk_difference' || effect.measure === 'percentage_points') treated = Math.max(0, Math.min(1, baseline + sign * estimate / (effect.measure === 'percentage_points' ? 100 : 1)));
  if (treated !== null) return { delta: sign * (treated - baseline), treated };
  // Rate ratios need event rates, HR needs a survival model, and SMD needs the target scale SD.
  if (effect.measure === 'hazard_ratio' || effect.measure === 'time_to_event' || effect.measure === 'rate_ratio' || effect.measure === 'rate_difference') return { delta: null, treated: null };
  if (effect.measure === 'standardized_mean_difference') return { delta: nativeSd > 0 ? estimate * nativeSd : null, treated: null };
  return { delta: estimate, treated: null };
}

export function validateScenario(input: unknown, library: Library, local: LocalData): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const error = (field: string, message: string) => issues.push({ field, message, severity: 'error' });
  if (!input || typeof input !== 'object') return [{ field: 'scenario', message: 'A scenario object is required.', severity: 'error' }];
  const s = input as Scenario;
  const intervention = library.interventions.find(i => i.id === s.interventionId);
  if (!intervention) error('interventionId', 'Unknown reviewed intervention.');
  if (s.schemaVersion !== 1 || s.modelVersion !== MODEL_VERSION) error('modelVersion', 'Unsupported model/schema version.');
  if (s.libraryVersion !== library.version || s.localDataVersion !== local.version || s.evidenceCutoff !== library.cutoff) error('versions', 'Scenario inputs must use their pinned evidence and local-data versions.');
  for (const key of ['name', 'funder', 'beneficiary', 'goal'] as const) if (typeof s[key] !== 'string' || !s[key].trim() || s[key].length > 240) error(key, 'Use 1–240 characters.');
  if (!Array.isArray(s.counties) || s.counties.length < 1 || s.counties.length > 83 || new Set(s.counties).size !== s.counties.length || s.counties.some(fips => !local.counties.some(c => c.fips === fips))) error('counties', 'Choose unique Michigan county FIPS.');
  if (!Number.isInteger(s.horizonYears) || s.horizonYears < 1 || s.horizonYears > 10) error('horizonYears', 'Use a whole horizon of 1–10 years.');
  if (!finite(s.budget) || s.budget < 0 || s.budget > 1e10) error('budget', 'Budget must be between $0 and $10 billion.');
  if (s.targetOutcome !== null && s.targetOutcome !== undefined && (!finite(s.targetOutcome) || s.targetOutcome < 0 || s.targetOutcome > 1e9)) error('targetOutcome', 'Outcome target must be nonnegative and in the model’s natural units.');
  if (!Number.isInteger(s.priceYear) || s.priceYear < 2000 || s.priceYear > 2100) error('priceYear', 'Specify the USD price year (2000–2100).');
  if (!PERSPECTIVES.includes(s.perspective)) error('perspective', 'Choose a supported economic perspective.');
  if (!['none', 'avoided cost', 'user valuation'].includes(s.monetization)) error('monetization', 'Choose an explicit valuation basis.');
  for (const key of ['useLocalNeed', 'includeAssumedUncertainty', 'applicabilityReviewed'] as const) if (typeof s[key] !== 'boolean') error(key, 'Expected true or false.');
  if (!Number.isInteger(s.seed) || s.seed < 1 || s.seed > 4294967295) error('seed', 'Use a positive 32-bit integer seed.');
  if (!Number.isInteger(s.draws) || s.draws < 100 || s.draws > 10000) error('draws', 'Use 100–10,000 draws.');
  if (!s.parameters || typeof s.parameters !== 'object') { error('parameters', 'Complete parameter register required.'); return issues; }
  const sourceIds = new Set([...library.sources.map(src => src.id), local.source.id]);
  for (const key of PARAMETER_KEYS) {
    const p = s.parameters[key], bounds = PARAMETER_META[key];
    if (!p || !finite(p.value) || p.value < bounds.min || p.value > bounds.max) { error(key, `${bounds.label} must be ${bounds.min}–${bounds.max}.`); continue; }
    if (!['OFFICIAL DATA', 'LITERATURE-DERIVED', 'USER ASSUMPTION', 'MODELED', 'OBSERVED', 'UNVERIFIED'].includes(p.status) || typeof p.reason !== 'string' || !p.reason || p.reason.length > 2000 || typeof p.unit !== 'string' || p.unit.length > 80) error(key, 'Parameter needs a valid unit, status and rationale.');
    if (p.sourceId !== null && !sourceIds.has(p.sourceId)) error(key, 'Unknown parameter source.');
    if (p.status === 'LITERATURE-DERIVED' && key !== 'effect') error(key, 'Initial library only supplies reviewed effect parameters; operational values require their own evidence.');
    if (p.status === 'LITERATURE-DERIVED' && intervention) {
      const e = library.effects.find(e => e.id === intervention.effectIds[0]);
      if (!e || e.estimate !== p.value || e.sourceId !== p.sourceId || e.low !== p.low || e.high !== p.high) error(key, 'Modified literature values must be labeled user assumptions.');
      if (e && p.distribution && e.low !== null && e.high !== null) {
        const ratio = ['risk_ratio', 'odds_ratio', 'rate_ratio', 'hazard_ratio'].includes(e.measure);
        const expectedSd = ratio ? (Math.log(e.high) - Math.log(e.low)) / (2 * 1.959963984540054) : (e.high - e.low) / (2 * 1.959963984540054);
        if (p.distribution.kind !== (ratio ? 'lognormal' : 'normal') || !('sd' in p.distribution) || Math.abs(p.distribution.sd - expectedSd) > 1e-8) error(key, 'Modified uncertainty must be relabeled as an analyst assumption; it cannot retain published-precision status.');
      } else if (e && p.distribution?.kind !== 'fixed') error(key, 'A median without precision cannot supply an automatic probability distribution.');
    }
    if ((p.low !== null && !finite(p.low)) || (p.high !== null && !finite(p.high)) || (p.low !== null && p.low > p.value) || (p.high !== null && p.high < p.value) || (p.low !== null && p.high !== null && p.low > p.high)) error(key, 'Range must contain the point estimate.');
    if ((p.low !== null && (p.low < bounds.min || p.low > bounds.max)) || (p.high !== null && (p.high < bounds.min || p.high > bounds.max))) error(key, 'Sensitivity range must lie inside the parameter’s valid support.');
    const d = p.distribution;
    if (!d || typeof d !== 'object' || !['fixed', 'normal', 'lognormal', 'beta', 'gamma', 'triangular'].includes(d.kind)) { error(key, 'Unsupported distribution.'); continue; }
    if ((d.kind === 'normal' || d.kind === 'lognormal') && (!finite(d.sd) || d.sd <= 0 || (d.kind === 'lognormal' && p.value <= 0))) error(key, 'Distribution requires a positive SD and valid support.');
    if (d.kind === 'beta' && (!finite(d.alpha) || !finite(d.beta) || d.alpha <= 0 || d.beta <= 0)) error(key, 'Beta shape parameters must be positive.');
    if (d.kind === 'gamma' && (!finite(d.shape) || !finite(d.scale) || d.shape <= 0 || d.scale <= 0)) error(key, 'Gamma shape/scale must be positive.');
    if (d.kind === 'beta' && (d.alpha < .01 || d.beta < .01 || d.alpha > 1e9 || d.beta > 1e9 || Math.abs(d.alpha / (d.alpha + d.beta) - p.value) > .00001)) error(key, 'Beta shapes must be numerically supported and imply the displayed mean.');
    if (d.kind === 'gamma' && (d.shape < .01 || d.shape > 1e9 || Math.abs(d.shape * d.scale - p.value) > Math.max(.01, Math.abs(p.value) * .00001))) error(key, 'Gamma shape/scale must imply the displayed mean.');
    if (d.kind === 'lognormal' && d.sd > 5) error(key, 'Log-scale SD exceeds the numerically supported range.');
    if (d.kind === 'triangular' && (![d.low, d.mode, d.high].every(finite) || d.low < bounds.min || d.high > bounds.max || d.low > d.mode || d.mode > d.high || d.low === d.high || d.mode !== p.value)) error(key, 'Triangular low/mode/high must be ordered and match the point.');
  }
  if (Object.keys(s.parameters).some(key => !PARAMETER_KEYS.includes(key as ParamKey))) error('parameters', 'Unexpected parameter.');
  if (s.parameters.monthlyHours && s.parameters.paidHours && s.parameters.monthlyHours.value > s.parameters.paidHours.value) error('monthlyHours', 'Service hours cannot exceed paid staff hours.');
  if (intervention && s.parameters.effect && s.parameters.followUpMonths) {
    const e = library.effects.find(e => e.id === intervention.effectIds[0])!;
    if (s.parameters.effect.status !== 'UNVERIFIED' && ['risk_ratio', 'odds_ratio', 'rate_ratio', 'hazard_ratio'].includes(e.measure) && s.parameters.effect.value <= 0) error('effect', 'Ratio estimates must be positive.');
    if (['risk_ratio', 'odds_ratio', 'rate_ratio', 'hazard_ratio'].includes(e.measure) && s.parameters.effect.distribution?.kind === 'normal') error('effect', 'Ratio uncertainty needs positive support, not an unbounded normal distribution.');
    if (e.followUpMonths !== null && s.parameters.followUpMonths.value !== e.followUpMonths) issues.push({ field: 'followUpMonths', message: 'Outcome timing differs from the selected evidence; requires explicit local applicability review.', severity: 'warning' });
    if (e.unit === 'days per child' && Math.abs(s.parameters.effect.value) > 365.25 * s.parameters.followUpMonths.value / 12) error('effect', 'Symptom-day change cannot exceed the number of days in the follow-up period.');
  }
  if (s.signal !== null && s.signal !== undefined && (s.signal.kind !== 'community_signal' || s.signal.use !== 'problem-discovery-only' || !Array.isArray(s.signal.narratives) || s.signal.narratives.length > 6 || s.signal.narratives.some(n => typeof n.text !== 'string' || n.text.length > 6000))) error('signal', 'Community signals must remain bounded problem-discovery context.');
  return issues;
}

export function modelScenario(s: Scenario, library: Library, local: LocalData, trusted = false): ModelResult {
  const issues = trusted ? [] : validateScenario(s, library, local);
  if (issues.some(i => i.severity === 'error')) throw new Error(issues.filter(i => i.severity === 'error').map(i => `${i.field}: ${i.message}`).join(' '));
  const intervention = library.interventions.find(i => i.id === s.interventionId)!;
  const evidence = library.effects.find(e => e.id === intervention.effectIds[0])!;
  const p = (key: ParamKey) => s.parameters[key].value;
  const warn = (field: string, message: string) => issues.push({ field, message, severity: 'warning' });
  const countyRows = local.counties.filter(c => s.counties.includes(c.fips)).map(c => {
    const population = intervention.populationBase === 'adult' ? c.adults : c.total - c.adults;
    const metric = s.useLocalNeed && intervention.needMeasure ? c.metrics.find(m => m.id === intervention.needMeasure) : undefined;
    const need = metric ? (intervention.needComplement ? 1 - metric.value / 100 : metric.value / 100) : p('needShare');
    const demographic = population * p('demographicShare'), eligible = demographic * need;
    return { fips: c.fips, name: c.name, population, demographic, eligible, demand: eligible * p('awareness') * p('contactability') * p('uptake'), enrolled: 0, completed: 0, covered: 0, outcomes: null as number | null, cost: 0, coverage: 0,
      needSource: metric ? `${local.source.id}:${metric.id}` : 'User assumption', needYear: metric?.year ?? null };
  });
  const sum = (key: 'population' | 'demographic' | 'eligible' | 'demand') => countyRows.reduce((n, row) => n + row[key], 0);
  const population = sum('population'), demographic = sum('demographic'), eligible = sum('eligible'), demand = sum('demand');
  const capacity = Math.min(p('staffFte') * p('monthlyHours') / p('serviceHours'), p('siteCapacity'), p('referralCapacity'));
  const absolute = s.parameters.effect.status === 'UNVERIFIED' ? { delta: null, treated: null } : effectToAbsolute(evidence, p('effect'), p('baselineRisk'), p('nativeSd'));
  const valued = s.monetization !== 'none';
  const horizon = s.horizonYears * 12;
  const followUp = Math.ceil(p('followUpMonths') + p('lagMonths'));
  let reached = 0, matured = 0, outcomes: number | null = absolute.delta === null ? null : 0;
  let financialCost = p('setupCost'), discountedCost = p('setupCost') * p('costShare'), discountedOutcomes: number | null = absolute.delta === null ? null : 0;
  let grossBenefit: number | null = valued && absolute.delta !== null ? 0 : null;
  let cumulativeCost = 0, cumulativeBenefit: number | null = grossBenefit === null ? null : 0, paybackMonth: number | null = null;
  const monthlyStaff = money(p('staffFte') * p('paidHours') * p('hourlyWage') * (1 + p('fringeRate')));
  const periods: ModelResult['periods'] = [];
  let staffCost = 0, operatingCost = 0, variableCost = 0, opportunityCost = 0;
  for (let month = 1; month <= horizon; month++) {
    const enrolled = Math.max(0, Math.min(capacity * Math.min(1, month / p('rampMonths')), demand - reached));
    reached += enrolled;
    const matureCohort = month - followUp + 1;
    const matureCount = matureCohort === month ? enrolled : matureCohort >= 1 ? periods[matureCohort - 1].enrolled : 0;
    matured += matureCount;
    const outcome = absolute.delta === null ? null : matureCount * absolute.delta;
    if (outcomes !== null) outcomes += outcome ?? 0;
    if (discountedOutcomes !== null) discountedOutcomes += discount(outcome ?? 0, p('discountOutcome'), month / 12);
    const variable = money(enrolled * p('variableCost')), operations = money(p('annualOperatingCost') / 12), opportunity = money(enrolled * p('opportunityCost'));
    staffCost += monthlyStaff; operatingCost += operations; variableCost += variable; opportunityCost += opportunity;
    const spend = money(monthlyStaff + operations + variable + (month === 1 ? p('setupCost') : 0));
    financialCost += monthlyStaff + operations + variable;
    const perspectiveSpend = spend * p('costShare') + (s.perspective === 'Societal' ? opportunity : 0);
    // Setup occurs at time zero; all other expenditure occurs at month end.
    discountedCost += discount((spend - (month === 1 ? p('setupCost') : 0)) * p('costShare') + (s.perspective === 'Societal' ? opportunity : 0), p('discountCost'), month / 12);
    const benefit = grossBenefit === null || outcome === null ? null : outcome * p('benefitPerOutcome') * p('benefitCapture');
    if (grossBenefit !== null) grossBenefit += discount(benefit ?? 0, p('discountCost'), month / 12);
    cumulativeCost += perspectiveSpend;
    if (cumulativeBenefit !== null) cumulativeBenefit += benefit ?? 0;
    if (paybackMonth === null && cumulativeCost > 0 && cumulativeBenefit !== null && cumulativeBenefit >= cumulativeCost) paybackMonth = month;
    periods.push({ month, enrolled, completed: enrolled * p('retention'), matured: matureCount, outcomes: outcome, spend, benefits: benefit, cumulativeCost: money(cumulativeCost), cumulativeBenefit: cumulativeBenefit === null ? null : money(cumulativeBenefit) });
  }
  // A binary event is counted once per mature cohort. No unsupported post-follow-up benefit tail is added.
  const completed = reached * p('retention'), adherent = completed * p('adherence');
  for (const row of countyRows) {
    const share = demand > 0 ? row.demand / demand : 0;
    row.enrolled = reached * share; row.completed = completed * share; row.covered = row.enrolled; row.outcomes = outcomes === null ? null : outcomes * share;
    row.cost = money(financialCost * (demand > 0 ? share : eligible > 0 ? row.eligible / eligible : row.population / (population || 1))); row.coverage = row.eligible > 0 ? row.enrolled / row.eligible : 0;
  }
  const economicCost = financialCost + opportunityCost;
  const perspectiveCost = financialCost * p('costShare') + (s.perspective === 'Societal' ? opportunityCost : 0);
  const metrics = economicMetrics(discountedCost, grossBenefit, discountedOutcomes);
  const annual = Array.from({ length: s.horizonYears }, (_, i) => {
    const year = periods.slice(i * 12, (i + 1) * 12);
    const spend = money(year.reduce((n, row) => n + row.spend, 0));
    const benefit = valued && outcomes !== null ? money(year.reduce((n, row) => n + (row.benefits ?? 0), 0)) : null;
    return { year: i + 1, spend, benefit, netSpend: money(spend * p('costShare') + (s.perspective === 'Societal' ? year.reduce((n, row) => n + money(row.enrolled * p('opportunityCost')), 0) : 0) - (benefit ?? 0)), outcomes: outcomes === null ? null : year.reduce((n, row) => n + (row.outcomes ?? 0), 0) };
  });
  if (!s.applicabilityReviewed) warn('applicability', 'Local population, setting, baseline risk and delivery intensity have not been reviewed.');
  if (absolute.delta === null) warn('effect', 'A compatible numerical effect is missing; reach and cost are available, health impact and ROI are withheld.');
  if (s.useLocalNeed && intervention.needMeasure) warn('needShare', 'County prevalence is modeled contextual eligibility. Severity, exact age and clinical suitability still need local verification.');
  if (reached + 1e-6 < demand) warn('capacity', 'Staff, site or referral capacity limits intake. Demand beyond capacity receives no modeled benefit.');
  if (eligible === 0) warn('eligibility', 'No eligible cohort is defined. Fixed program costs still accrue; geographic cost allocation uses population only for accounting.');
  if (financialCost > s.budget) warn('budget', 'Program expenditure exceeds the available budget.');
  if (valued && p('benefitPerOutcome') === 0) warn('valuation', 'Monetization is enabled with a zero unit value; check whether the outcome is actually valued.');
  if (followUp > horizon) warn('followUpMonths', 'No enrolled cohort matures inside the selected horizon. Outcome benefits occur later.');
  if (evidence.measure === 'mean_difference' && evidence.unit.includes('mmHg')) warn('unit', 'Aggregate person·mmHg is a descriptive sum, not a count of controlled patients or an admission reduction.');
  const gaps = [
    ...(!s.applicabilityReviewed ? ['Review population, baseline risk, setting and delivery intensity against the source study.'] : []),
    'Obtain a local staffing quote and record actual service time, travel and referral bottlenecks.',
    'Validate demographic and clinical eligibility with a local service denominator.',
    ...(valued ? ['Validate monetary outcome values and the party that captures them.'] : ['No outcome valuation supplied: perspective ROI is not estimable. Use natural-unit results.']),
    ...(s.parameters.effect.low === null ? ['A median or summary effect has no sampling distribution; obtain study-level precision before widening PSA.'] : []),
  ];
  const annualStaffShare = financialCost > 0 ? staffCost / financialCost : 0;
  const insights = [`Staffing accounts for ${(annualStaffShare * 100).toFixed(0)}% of program expenditure.`, `${(reached / (eligible || 1) * 100).toFixed(1)}% of the eligible cohort could enroll under current demand and capacity assumptions.`, `${Math.max(0, reached - matured).toFixed(0)} enrolled people have not reached the outcome follow-up by the end of the horizon.`, 'Completion and adherence are operational outcomes; the transported assignment effect is not reduced a second time for dropout.'];
  return { modelVersion: MODEL_VERSION, readiness: absolute.delta === null ? 'KEY INPUTS MISSING' : !s.applicabilityReviewed ? 'NEEDS LOCAL PILOT' : issues.length || PARAMETER_KEYS.some(key => s.parameters[key].status === 'USER ASSUMPTION') ? 'MODEL WITH CAUTION' : 'READY TO MODEL',
    issues, population, demographic, eligible, demand, capacity, reached, completed, adherent, matured, outcomes, discountedOutcomes,
    effectPerPerson: absolute.delta, treatedRisk: absolute.treated, outcomeUnit: evidence.unit.includes('mmHg') ? 'person·mmHg (descriptive)' : evidence.unit === 'days per child' ? 'symptom-free days' : evidence.unit,
    outcomeId: evidence.outcomeId, financialCost: money(financialCost), economicCost: money(economicCost), perspectiveCost: money(perspectiveCost), discountedCost: money(discountedCost), grossBenefit: grossBenefit === null ? null : money(grossBenefit),
    netBenefit: metrics.netBenefit === null ? null : money(metrics.netBenefit), netCost: money(metrics.netCost), roi: metrics.roi, bcr: metrics.bcr,
    costPerPerson: reached > 0 ? financialCost / reached : null, costPerOutcome: metrics.costPerOutcome, paybackMonth,
    ledger: [{ label: 'Setup, equipment & training', amount: money(p('setupCost')), kind: 'financial' }, { label: 'Staff time & employer costs', amount: money(staffCost), kind: 'financial' }, { label: 'Operations, travel & evaluation', amount: money(operatingCost), kind: 'financial' }, { label: 'Materials & participant support', amount: money(variableCost), kind: 'financial' }, { label: 'Opportunity / participant time', amount: money(opportunityCost), kind: 'economic' }], periods, counties: countyRows, annual, insights, gaps };
}
