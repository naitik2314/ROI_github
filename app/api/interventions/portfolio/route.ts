import { getScenario, audit } from '@/lib/interventions/store';
import { optimizePortfolio } from '@/lib/interventions/decisions';
import { failure, noStore, readBody } from '@/lib/interventions/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { const body = await readBody(request, 10000); if (!Array.isArray(body.ids) || body.ids.length > 16 || body.ids.some(id => typeof id !== 'string')) throw new Error('Choose up to 16 saved options.');
    const options = body.ids.map(id => {
      const s = getScenario(id); if (!s || s.scenario.counties.length !== 1 || s.result.outcomes === null) throw new Error('Each option must be a saved, single-county scenario with a compatible impact estimate.');
      return { id: s.id, name: s.name, county: s.scenario.counties[0], cost: s.result.financialCost, impact: s.result.outcomes, staff: s.scenario.parameters.staffFte.value, outcomeId: s.result.outcomeId, months: s.scenario.horizonYears * 12, priceYear: s.scenario.priceYear, overlapGroup: s.result.outcomeId, alternativeGroup: s.scenarioId, equityReach: 0, reach: s.result.reached };
    });
    const result = optimizePortfolio(options, body.constraints as Parameters<typeof optimizePortfolio>[1]); audit('portfolio.optimized', { ids: body.ids, result }); return Response.json(result, { headers: noStore }); }
  catch (error) { return failure(error); }
}
