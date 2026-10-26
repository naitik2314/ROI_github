import type { CommunitySignal, Intervention, Library, LocalData, Parameter, ParamKey, Perspective, Scenario } from './types.ts';

export const MODEL_VERSION = 'fieldwork-cohort-1.0.0';
export const PERSPECTIVES: Perspective[] = ['Program / organization', 'Payer', 'Healthcare sector', 'Public sector', 'Societal'];
export const PARAMETER_META: Record<ParamKey, { label: string; group: string; min: number; max: number; step: number; unit: string }> = {
  demographicShare: { label: 'Demographic eligibility', group: 'Population', min: 0, max: 1, step: .01, unit: 'fraction' },
  needShare: { label: 'Clinical / social eligibility', group: 'Population', min: 0, max: 1, step: .01, unit: 'fraction' },
  awareness: { label: 'Awareness', group: 'Reach', min: 0, max: 1, step: .01, unit: 'fraction' },
  contactability: { label: 'Contactability', group: 'Reach', min: 0, max: 1, step: .01, unit: 'fraction' },
  uptake: { label: 'Uptake among contacted people', group: 'Reach', min: 0, max: 1, step: .01, unit: 'fraction' },
  retention: { label: 'Retention / completion', group: 'Reach', min: 0, max: 1, step: .01, unit: 'fraction' },
  adherence: { label: 'Adherence among completers', group: 'Reach', min: 0, max: 1, step: .01, unit: 'fraction' },
  staffFte: { label: 'Delivery staff', group: 'Capacity', min: 0, max: 1000, step: .25, unit: 'FTE' },
  paidHours: { label: 'Paid hours per FTE / month', group: 'Cost', min: 0, max: 240, step: 1, unit: 'hours' },
  monthlyHours: { label: 'Service hours per FTE / month', group: 'Capacity', min: 0, max: 200, step: 1, unit: 'hours' },
  serviceHours: { label: 'Staff time per enrollee (whole program)', group: 'Capacity', min: .01, max: 2000, step: .25, unit: 'hours/person' },
  siteCapacity: { label: 'Site intake limit / month', group: 'Capacity', min: 0, max: 100000, step: 10, unit: 'people/month' },
  referralCapacity: { label: 'Follow-up / referral slots / month', group: 'Capacity', min: 0, max: 100000, step: 10, unit: 'people/month' },
  rampMonths: { label: 'Time to full intake capacity', group: 'Capacity', min: 1, max: 60, step: 1, unit: 'months' },
  setupCost: { label: 'Setup, training and equipment', group: 'Cost', min: 0, max: 100000000, step: 1000, unit: 'USD, once' },
  annualOperatingCost: { label: 'Administration, travel and evaluation', group: 'Cost', min: 0, max: 100000000, step: 1000, unit: 'USD/year' },
  hourlyWage: { label: 'Blended delivery wage', group: 'Cost', min: 0, max: 1000, step: 1, unit: 'USD/hour' },
  fringeRate: { label: 'Employer benefits / payroll overhead', group: 'Cost', min: 0, max: 2, step: .01, unit: 'fraction of wage' },
  variableCost: { label: 'Materials, tests and participant support', group: 'Cost', min: 0, max: 100000, step: 5, unit: 'USD/enrollee' },
  opportunityCost: { label: 'Unpaid / participant time value', group: 'Cost', min: 0, max: 100000, step: 5, unit: 'USD/enrollee' },
  baselineRisk: { label: 'Comparator outcome probability', group: 'Effect', min: 0, max: 1, step: .01, unit: 'risk over follow-up' },
  effect: { label: 'Transported effect estimate', group: 'Effect', min: -10000, max: 10000, step: .01, unit: 'evidence-specific' },
  followUpMonths: { label: 'Outcome follow-up after enrollment', group: 'Effect', min: 1, max: 120, step: 1, unit: 'months' },
  lagMonths: { label: 'Additional implementation-to-effect lag', group: 'Effect', min: 0, max: 120, step: 1, unit: 'months' },
  nativeSd: { label: 'Native outcome scale standard deviation', group: 'Effect', min: 0, max: 10000, step: .1, unit: 'native scale' },
  benefitPerOutcome: { label: 'Monetary value per additional outcome', group: 'Value', min: 0, max: 1000000, step: 100, unit: 'USD/outcome' },
  costShare: { label: 'Cost borne by selected perspective', group: 'Value', min: 0, max: 1, step: .01, unit: 'fraction' },
  benefitCapture: { label: 'Benefit captured by selected perspective', group: 'Value', min: 0, max: 1, step: .01, unit: 'fraction' },
  discountCost: { label: 'Annual economic cost discount rate', group: 'Value', min: 0, max: .2, step: .005, unit: 'annual fraction' },
  discountOutcome: { label: 'Annual outcome discount rate', group: 'Value', min: 0, max: .2, step: .005, unit: 'annual fraction' },
};
export const PARAMETER_KEYS = Object.keys(PARAMETER_META) as ParamKey[];

export function createScenario(intervention: Intervention, library: Library, local: LocalData, signal: CommunitySignal | null = null): Scenario {
  const d = intervention.defaults, stamp = new Date().toISOString();
  // All operational amounts below initialize a user-assumption scenario. None is a local quote.
  const values: Record<ParamKey, number> = {
    demographicShare: d.demographicShare, needShare: d.needShare, awareness: .5, contactability: .6, uptake: .3,
    retention: .8, adherence: .8, staffFte: d.staffFte, paidHours: 160, monthlyHours: 120, serviceHours: d.serviceHours,
    siteCapacity: 300, referralCapacity: 250, rampMonths: 6, setupCost: d.setupCost,
    annualOperatingCost: d.annualOperatingCost, hourlyWage: 35, fringeRate: .3, variableCost: d.variableCost,
    opportunityCost: 0, baselineRisk: d.baselineRisk, effect: 0, benefitPerOutcome: 0, costShare: 1,
    benefitCapture: 0, discountCost: .03, discountOutcome: .03, followUpMonths: d.followUpMonths, lagMonths: 0, nativeSd: 0,
  };
  const assumptions: Partial<Record<ParamKey, string>> = {
    ...intervention.defaultReasons,
    awareness: 'Planning assumption: half of eligible people become aware over the entire scenario horizon.',
    contactability: 'Planning assumption: 60% of aware people can be contacted over the entire horizon.',
    uptake: 'Planning assumption: 30% of contacted people enroll. Sentiment never sets this value.',
    retention: 'Planning assumption: 80% complete. Reported separately; published assignment effects are not multiplied by attrition again.',
    adherence: 'Planning assumption: 80% of completers adhere. No universal effectiveness penalty is applied.',
    paidHours: 'Planning assumption of 160 paid hours per FTE/month; paid leave, administration and travel are included in financial expenditure.',
    monthlyHours: 'Planning assumption of 120 service hours per FTE/month after leave, administration and travel; verify with time logs.',
    hourlyWage: 'Unverified blended planning wage of $35/hour, not a Michigan BLS estimate or staffing quote.',
    fringeRate: 'Planning payroll-benefit assumption of 30%; obtain the organization’s actual loaded wage.',
    rampMonths: 'Planning assumption: capacity ramps linearly from one-sixth in month 1 to full in month 6. Staff are paid throughout.',
    benefitPerOutcome: 'No credible unit valuation has been selected. ROI is unavailable until valuation is explicitly supplied.',
    benefitCapture: 'Program perspective captures no downstream savings by default. Review contracts and perspective before changing.',
    discountCost: 'Editable planning discount rate of 3% for economic present values; not a universal policy requirement.',
    discountOutcome: 'Editable planning discount rate of 3% for outcomes; annual cash-flow budget impact is undiscounted.',
    nativeSd: 'Required for SMD conversion; zero means no validated target outcome scale SD has been supplied.',
    costShare: 'Selected funder is assumed to pay all financial expenditure. Revise funding split explicitly.',
  };
  const parameters = Object.fromEntries(PARAMETER_KEYS.map(key => [key, {
    value: values[key], unit: PARAMETER_META[key].unit, status: 'USER ASSUMPTION', sourceId: null,
    reason: assumptions[key] || 'Editable local implementation assumption; requires an operational quote or pilot measurement.',
    editable: true, low: null, high: null, distribution: { kind: 'fixed' }, updatedAt: stamp,
  }])) as Record<ParamKey, Parameter>;
  // Explicit planning ranges, only sampled after the analyst opts in. They are not evidence CIs.
  for (const [key, low, high] of [['uptake', .15, .5], ['variableCost', d.variableCost * .75, d.variableCost * 1.5], ['hourlyWage', 28, 50]] as [ParamKey, number, number][]) {
    parameters[key].low = low; parameters[key].high = high;
    parameters[key].distribution = { kind: 'triangular', low, mode: values[key], high };
    parameters[key].reason += ' Low/mode/high define an explicit user-assumed triangular range, inactive in PSA until accepted.';
  }
  const effect = library.effects.find(e => e.id === intervention.effectIds[0])!;
  parameters.effect = { value: effect.estimate ?? 0, unit: effect.measure, status: effect.estimate === null ? 'UNVERIFIED' : 'LITERATURE-DERIVED', sourceId: effect.sourceId, reason: effect.followUpNote, editable: true, low: effect.low, high: effect.high, distribution: { kind: 'fixed' }, updatedAt: stamp };
  if (effect.low !== null && effect.high !== null && effect.estimate !== null) {
    const ratio = ['risk_ratio', 'odds_ratio', 'rate_ratio', 'hazard_ratio'].includes(effect.measure);
    parameters.effect.distribution = { kind: ratio ? 'lognormal' : 'normal', sd: ratio ? (Math.log(effect.high) - Math.log(effect.low)) / (2 * 1.959963984540054) : (effect.high - effect.low) / (2 * 1.959963984540054) };
  }
  const county = local.counties.find(c => c.name === signal?.county) ?? local.counties.find(c => c.name === 'Wayne')!;
  return { schemaVersion: 1, name: `${signal?.county === 'Michigan' ? 'Michigan' : county.name} · ${intervention.name}`, interventionId: intervention.id, counties: signal?.county === 'Michigan' ? local.counties.map(c => c.fips) : [county.fips], horizonYears: 3, budget: 500000, priceYear: 2026,
    perspective: 'Program / organization', funder: 'Program organization', beneficiary: 'Participating community / healthcare payer', goal: effect.outcome, targetOutcome: null,
    parameters, useLocalNeed: intervention.needMeasure !== null, monetization: 'none', includeAssumedUncertainty: false, applicabilityReviewed: false,
    seed: 20261026, draws: 2000, libraryVersion: library.version, localDataVersion: local.version, evidenceCutoff: library.cutoff, modelVersion: MODEL_VERSION, signal };
}

export function editParameter(scenario: Scenario, key: ParamKey, value: number): Scenario {
  const old = scenario.parameters[key];
  return { ...scenario, parameters: { ...scenario.parameters, [key]: { ...old, value, status: 'USER ASSUMPTION', sourceId: null,
    reason: `Analyst override of ${PARAMETER_META[key].label}; original source/default remains in the evidence library.`,
    low: null, high: null, distribution: { kind: 'fixed' }, updatedAt: new Date().toISOString() } } };
}
