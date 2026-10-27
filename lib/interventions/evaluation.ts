import { quantile, seededRandom } from './simulation.ts';
export interface PanelRow { site: string; group: 'treated' | 'control'; period: number; value: number }
export interface DesignReview { parallelTrends: boolean; stableMeasurement: boolean; noSpillovers: boolean; noConcurrentShock: boolean; comparisonRationale: string; preTrendTolerance: number }
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
const slope = (rows: { period: number; value: number }[]) => { const x = mean(rows.map(r => r.period)), y = mean(rows.map(r => r.value)); const denominator = rows.reduce((s, r) => s + (r.period - x) ** 2, 0); return denominator ? rows.reduce((s, r) => s + (r.period - x) * (r.value - y), 0) / denominator : 0; };
export function evaluateDid(rows: PanelRow[], interventionPeriod: number, review: DesignReview, seed = 44) {
  if (!Array.isArray(rows) || rows.length > 5000 || !Number.isFinite(interventionPeriod) || !review || typeof review.comparisonRationale !== 'string') throw new Error('A bounded numeric site panel and design review are required.');
  if (rows.some(r => !r || typeof r.site !== 'string' || r.site.length > 100 || !['treated', 'control'].includes(r.group) || !Number.isInteger(r.period) || !Number.isFinite(r.value))) throw new Error('Invalid site/group/period/value panel.');
  if (new Set(rows.map(r => `${r.site}:${r.period}`)).size !== rows.length) throw new Error('Duplicate site/period observations.');
  const sites = [...new Set(rows.map(r => r.site))];
  const pre = [...new Set(rows.filter(r => r.period < interventionPeriod).map(r => r.period))].sort((a, b) => a - b);
  const post = [...new Set(rows.filter(r => r.period >= interventionPeriod).map(r => r.period))].sort((a, b) => a - b);
  const siteRows = sites.map(site => {
    const data = rows.filter(r => r.site === site), before = data.filter(r => r.period < interventionPeriod), after = data.filter(r => r.period >= interventionPeriod);
    if (new Set(data.map(r => r.group)).size !== 1) throw new Error('Treatment group must be fixed within site; staggered adoption is unsupported.');
    if (before.length !== pre.length || after.length !== post.length) throw new Error('Balanced complete pre/post site panel required. Missing values cannot be filled with zero.');
    return { site, group: data[0].group, before: mean(before.map(r => r.value)), after: mean(after.map(r => r.value)), slope: slope(before), change: mean(after.map(r => r.value)) - mean(before.map(r => r.value)) };
  });
  const treated = siteRows.filter(s => s.group === 'treated'), control = siteRows.filter(s => s.group === 'control');
  if (!pre.length || !post.length || !treated.length || !control.length) throw new Error('Both groups and complete pre/post observations are required.');
  if (!Number.isFinite(review.preTrendTolerance) || review.preTrendTolerance < 0) throw new Error('Specify an explicit nonnegative pretreatment slope tolerance.');
  const preSlopeDifference = mean(treated.map(s => s.slope)) - mean(control.map(s => s.slope));
  const requirements = [
    { requirement: 'At least 6 sites per group for this implementation’s cluster bootstrap gate', passed: treated.length >= 6 && control.length >= 6 },
    { requirement: 'At least 4 pre and 4 post periods (software guard, not a power guarantee)', passed: pre.length >= 4 && post.length >= 4 },
    { requirement: 'Parallel-trend plausibility reviewed; nonsignificance is not proof', passed: review.parallelTrends === true },
    { requirement: `Observed pre-slope difference is inside the user-defined tolerance of ${review.preTrendTolerance} units/period (not a statistical equivalence test)`, passed: Math.abs(preSlopeDifference) <= review.preTrendTolerance },
    { requirement: 'Stable measurement and population composition reviewed', passed: review.stableMeasurement === true },
    { requirement: 'No relevant spillovers or anticipation reviewed', passed: review.noSpillovers === true },
    { requirement: 'Concurrent shocks and time-varying confounding reviewed', passed: review.noConcurrentShock === true },
    { requirement: 'A substantive comparison-group rationale is recorded', passed: review.comparisonRationale.trim().length >= 40 },
  ];
  const contrast = treated.length && control.length ? mean(treated.map(s => s.change)) - mean(control.map(s => s.change)) : null;
  const series = [...pre, ...post].map(period => ({ period, treated: mean(rows.filter(r => r.period === period && r.group === 'treated').map(r => r.value)), control: mean(rows.filter(r => r.period === period && r.group === 'control').map(r => r.value)) }));
  if (requirements.some(r => !r.passed)) return { kind: 'OBSERVED CHANGE', estimate: null, observedContrast: contrast, interval: null, preSlopeDifference, requirements, series, note: 'Causal estimate withheld. A pre/post contrast is descriptive until an identified design and adequate data are reviewed.' };
  const random = seededRandom(seed), draws: number[] = [];
  for (let draw = 0; draw < 2000; draw++) {
    const t = Array.from({ length: treated.length }, () => treated[Math.floor(random() * treated.length)].change);
    const c = Array.from({ length: control.length }, () => control[Math.floor(random() * control.length)].change);
    draws.push(mean(t) - mean(c));
  }
  draws.sort((a, b) => a - b);
  return { kind: 'DESIGN-DEPENDENT CAUSAL ESTIMATE', estimate: contrast, observedContrast: contrast, interval: { low: quantile(draws, .025), high: quantile(draws, .975) }, preSlopeDifference, requirements, series,
    note: 'Two-group balanced-panel DiD; equal site weights, site-cluster bootstrap percentile interval (2,000 draws). Validity depends on the recorded identification assumptions. Small cluster counts and unmeasured confounding remain limitations; no staggered adoption, seasonality adjustment, or individual-level inference.' };
}
