import type { Library, PortfolioOption, Scenario } from './types.ts';

export const PROBLEM_ONTOLOGY: Record<string, { id: string; label: string }[]> = {
  'Care access': [{ id: 'primary-care', label: 'Primary care access' }, { id: 'transportation', label: 'Transportation / distance' }, { id: 'navigation', label: 'Appointment navigation' }, { id: 'screening', label: 'Screening access' }],
  Affordability: [{ id: 'medication-cost', label: 'Medication cost' }, { id: 'insurance', label: 'Insurance / out-of-pocket barriers' }, { id: 'adherence', label: 'Medication adherence' }],
  'Workforce & staffing': [{ id: 'capacity', label: 'Service capacity' }, { id: 'navigation', label: 'Task sharing / navigation' }, { id: 'risk-management', label: 'Chronic care support' }],
  Prevention: [{ id: 'screening', label: 'Preventive screening' }, { id: 'risk-management', label: 'Risk-factor management' }],
  'Mental health': [{ id: 'behavioral-access', label: 'Behavioral health access' }, { id: 'depression', label: 'Depression care' }],
  'Environmental health': [{ id: 'air', label: 'Air / respiratory exposure' }, { id: 'housing', label: 'Home environment' }, { id: 'asthma', label: 'Asthma triggers' }],
  'Infectious disease': [{ id: 'vaccination', label: 'Vaccination access' }, { id: 'outreach', label: 'Outreach / recall' }],
  'Health policy': [{ id: 'insurance', label: 'Coverage policy' }, { id: 'medication-cost', label: 'Affordability policy' }, { id: 'capacity', label: 'Delivery policy' }],
};
export function discoverInterventions(library: Library, topic: string, concept: string, query: string) {
  const text = query.trim().toLowerCase();
  return library.interventions.filter(i => (topic === 'all' || i.domain === topic || i.concepts.includes(concept) || (topic === 'Health policy' && PROBLEM_ONTOLOGY[topic].some(c => i.concepts.includes(c.id)))) && (!concept || i.concepts.includes(concept)) && (!text || `${i.name} ${i.description} ${i.population} ${i.concepts.join(' ')}`.toLowerCase().includes(text)))
    .sort((a, b) => Number(b.domain === topic) - Number(a.domain === topic) || a.name.localeCompare(b.name))
    .map(i => ({ intervention: i, reason: i.domain === topic ? `Addresses ${topic.toLowerCase()} through ${i.channel.toLowerCase()}.` : `The reviewed intervention includes ${(concept || PROBLEM_ONTOLOGY[topic]?.find(c => i.concepts.includes(c.id))?.label || topic).replaceAll('-', ' ')} support; check whether its target population matches the local problem.` }));
}
export function applicabilityDimensions(s: Scenario, library: Library) {
  const i = library.interventions.find(i => i.id === s.interventionId)!;
  const e = library.effects.find(e => e.id === i.effectIds[0])!;
  return [
    { name: 'Population', label: s.applicabilityReviewed ? 'Partially applicable' : 'Uncertain', detail: `${e.population}. Exact local severity and eligibility require review.` },
    { name: 'Care setting', label: s.applicabilityReviewed ? 'Partially applicable' : 'Uncertain', detail: `${e.setting}; the local delivery plan must match the reviewed components.` },
    { name: 'Baseline risk', label: 'Uncertain', detail: 'A user-assumed comparator probability, separate from prevalence and sentiment.' },
    { name: 'Intervention intensity', label: 'Uncertain', detail: e.intensity },
    { name: 'Geography / system', label: 'Partially applicable', detail: e.geography },
    { name: 'Evidence era', label: 'Review needed', detail: e.quality.recency },
    { name: 'Delivery capacity', label: 'Modeled', detail: 'Limited by staffing, service hours, site and follow-up slots; quote/pilot validation required.' },
  ];
}
export function paretoFrontier(options: { id: string; cost: number; impact: number; outcomeId: string }[]) {
  return options.filter(a => !options.some(b => b.id !== a.id && b.outcomeId === a.outcomeId && b.cost <= a.cost && b.impact >= a.impact && (b.cost < a.cost || b.impact > a.impact))).map(o => o.id);
}
export function optimizePortfolio(options: PortfolioOption[], constraints: { budget: number; staff: number; minimumEquityShare: number; equityCounty: string; verifiedDisjoint: boolean }) {
  if (!Array.isArray(options) || !options.length || options.length > 16 || new Set(options.map(o => o.id)).size !== options.length) throw new Error('Choose 1–16 unique complete program options.');
  if (![constraints.budget, constraints.staff, constraints.minimumEquityShare].every(Number.isFinite) || constraints.budget < 0 || constraints.staff < 0 || constraints.minimumEquityShare < 0 || constraints.minimumEquityShare > 1 || typeof constraints.verifiedDisjoint !== 'boolean') throw new Error('Invalid budget, staffing or equity constraint.');
  if (options.some(o => ![o.cost, o.impact, o.staff, o.reach, o.equityReach, o.months].every(Number.isFinite) || o.cost < 0 || o.impact < 0 || o.staff < 0 || o.reach < 0 || o.equityReach < 0 || o.equityReach > o.reach || o.outcomeId !== options[0].outcomeId || o.months !== options[0].months || !Number.isInteger(o.priceYear) || o.priceYear !== options[0].priceYear)) throw new Error('Portfolio options require the same outcome and horizon, valid resource quantities, and nonnegative benefit.');
  let best = { ids: [] as string[], cost: 0, impact: 0, staff: 0, reach: 0, equityShare: 0 }, examined = 0, overlapRejected = 0;
  const visit = (index: number, ids: string[], cost: number, impact: number, staff: number, reach: number, equityReach: number, groups: Set<string>) => {
    if (cost > constraints.budget || staff > constraints.staff) return;
    if (index === options.length) {
      examined++; const equityShare = reach > 0 ? equityReach / reach : 0;
      if (ids.length && equityShare >= constraints.minimumEquityShare && (impact > best.impact || impact === best.impact && cost < best.cost)) best = { ids: [...ids], cost, impact, staff, reach, equityShare };
      return;
    }
    visit(index + 1, ids, cost, impact, staff, reach, equityReach, groups);
    const option = options[index], group = `${option.county}:${option.overlapGroup || option.outcomeId}`;
    if ((groups.has(group) && !constraints.verifiedDisjoint) || (option.alternativeGroup && groups.has('alternative:' + option.alternativeGroup))) { overlapRejected++; return; }
    const next = new Set(groups); next.add(group); if (option.alternativeGroup) next.add('alternative:' + option.alternativeGroup);
    visit(index + 1, [...ids, option.id], cost + option.cost, impact + option.impact, staff + option.staff, reach + option.reach, equityReach + (option.county === constraints.equityCounty ? option.reach : 0), next);
  };
  visit(0, [], 0, 0, 0, 0, 0, new Set());
  return { ...best, examined, overlapRejected, algorithm: 'Exact bounded 0/1 subset enumeration with budget/staff pruning', note: 'Whole programs only; not a continuous allocation or nonlinear scaling model. Unknown same-county cohort overlap prevents additive selection. Cross-county spillovers are not modeled.' };
}
