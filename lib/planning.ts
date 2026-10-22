export interface RoiInputs { employees: number; annualCost: number; reduction: number; participation: number; programCost: number }
export const DEFAULT_ROI: RoiInputs = { employees: 5000, annualCost: 1400, reduction: 20, participation: 65, programCost: 250000 };
export function calculateRoi(input: RoiInputs) {
  if (Object.values(input).some(v => !Number.isFinite(v) || v < 0) || input.participation > 100 || input.reduction > 100 || !Number.isInteger(input.employees) || input.employees > 10000000 || input.annualCost > 1000000 || input.programCost > 1000000000) return null;
  const baseline = input.employees * input.annualCost;
  const savings = baseline * input.participation / 100 * input.reduction / 100;
  const net = savings - input.programCost;
  return { baseline, savings, net, roi: input.programCost > 0 ? net / input.programCost * 100 : null, multiple: input.programCost > 0 ? savings / input.programCost : null, paybackMonths: savings > 0 && input.programCost > 0 ? input.programCost / savings * 12 : null };
}
export const OUTREACH_SITES = [
  { name: 'Troy community hub', county: 'Oakland', demand: 180, priority: 94 },
  { name: 'Grosse Pointe outreach', county: 'Wayne', demand: 140, priority: 89 },
  { name: 'Lenox community center', county: 'Macomb', demand: 120, priority: 85 },
  { name: 'Livonia workplace clinic', county: 'Wayne', demand: 150, priority: 78 },
  { name: 'Royal Oak screening hub', county: 'Oakland', demand: 100, priority: 65 },
];
export function planOutreach(units: number, capacity: number) {
  if (!Number.isInteger(units) || units < 1 || units > 4 || !Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw new RangeError('Use 1–4 units and a daily capacity of 1–100 screenings.');
  const remaining = OUTREACH_SITES.map(site => ({ ...site, remaining: site.demand }));
  const visits: { day: number; unit: number; site: string; county: string; screenings: number }[] = [];
  for (let day = 0; day < 5; day++) {
    const used = new Set<string>();
    for (let unit = 1; unit <= units; unit++) {
      const site = remaining.filter(s => s.remaining > 0 && !used.has(s.name)).sort((a, b) => Number(b.remaining >= capacity) - Number(a.remaining >= capacity) || b.priority - a.priority)[0];
      if (!site) continue;
      const screenings = Math.min(capacity, site.remaining);
      site.remaining -= screenings; used.add(site.name);
      visits.push({ day, unit, site: site.name, county: site.county, screenings });
    }
  }
  return { visits, unmet: remaining.reduce((sum, site) => sum + site.remaining, 0), total: visits.reduce((sum, v) => sum + v.screenings, 0) };
}
