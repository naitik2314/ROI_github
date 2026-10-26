import { library, local } from '@/lib/interventions/catalog';
import { modelScenario } from '@/lib/interventions/model';
import { runSimulation } from '@/lib/interventions/simulation';
import { evidenceForScenario, getScenario, listScenarios, saveScenario } from '@/lib/interventions/store';
import { failure, noStore, readBody } from '@/lib/interventions/http';
import type { Scenario } from '@/lib/interventions/types';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) { const snapshot = getScenario(id); if (!snapshot) return Response.json({ error: 'Version not found.' }, { status: 404 }); return Response.json({ snapshot }, { headers: noStore }); }
    const snapshots = listScenarios().map(s => ({ id: s.id, scenarioId: s.scenarioId, version: s.version, name: s.name, createdAt: s.createdAt, interventionId: s.scenario.interventionId, counties: s.scenario.counties, horizonYears: s.scenario.horizonYears, libraryVersion: s.scenario.libraryVersion, modelVersion: s.scenario.modelVersion,
      result: { financialCost: s.result.financialCost, reached: s.result.reached, outcomes: s.result.outcomes, outcomeId: s.result.outcomeId, outcomeUnit: s.result.outcomeUnit, netBenefit: s.result.netBenefit, roi: s.result.roi, readiness: s.result.readiness } }));
    return Response.json({ snapshots }, { headers: noStore });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const body = await readBody(request), scenario = body.scenario as Scenario;
    if (!scenario) throw new Error('Scenario required.');
    const context = evidenceForScenario(scenario, { library, local });
    const result = modelScenario(scenario, context.library, context.local);
    const simulation = body.includeSimulation === true ? runSimulation(scenario, context.library, context.local) : null;
    const snapshot = saveScenario(scenario, result, simulation, context.library, context.local, typeof body.parentId === 'string' ? body.parentId : null);
    return Response.json({ snapshot }, { status: 201, headers: noStore });
  } catch (error) { return failure(error); }
}
