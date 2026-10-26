import type { SavedScenario } from './types.ts';
import { PARAMETER_KEYS } from './scenario.ts';
const cell = (value: unknown) => {
  let text = String(value ?? '');
  // Spreadsheet clients must never interpret analyst-entered labels as formulas.
  if (/^[=+\-@\t\r]/.test(text) && typeof value !== 'number') text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
export function scenarioCsv(snapshot: SavedScenario) {
  const s = snapshot.scenario;
  const rows: unknown[][] = [['section', 'name', 'value', 'unit', 'status', 'source_or_reason', 'model_version', 'evidence_version', 'scenario_version']];
  const add = (section: string, name: string, value: unknown, unit: string, status: string, reason: string) => rows.push([section, name, value, unit, status, reason, s.modelVersion, s.libraryVersion, snapshot.version]);
  add('scenario', 'name', s.name, '', 'USER ASSUMPTION', snapshot.hash);
  for (const key of PARAMETER_KEYS) { const p = s.parameters[key]; add('parameter', key, p.value, p.unit, p.status, `${p.sourceId ?? ''} ${p.reason}`); }
  add('result', 'enrolled', snapshot.result.reached, 'people', 'MODELED', 'Unique capacity-limited cohort');
  add('result', 'additional_outcomes', snapshot.result.outcomes, snapshot.result.outcomeUnit, 'MODELED', 'Conditional projection, not observed or a local causal estimate');
  add('result', 'financial_cost', snapshot.result.financialCost, `${s.priceYear} USD`, 'MODELED', s.perspective);
  add('result', 'net_benefit', snapshot.result.netBenefit, 'USD, present value', 'MODELED', 'Blank means outcome not valued');
  for (const year of snapshot.result.annual) add('budget_impact', `year_${year.year}_spend`, year.spend, `${s.priceYear} USD`, 'MODELED', 'Annual undiscounted program expenditure');
  if (s.signal) add('community_signal', 'provenance', s.signal.synthetic ? 'Synthetic demonstration fixtures' : 'See source records', 'problem-discovery-only', 'PLATFORM-DERIVED', 'Conversation is not incidence, clinical eligibility or intervention effectiveness.');
  return rows.map(row => row.map(cell).join(',')).join('\r\n');
}
