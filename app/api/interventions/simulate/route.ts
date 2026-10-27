import { library, local } from '@/lib/interventions/catalog';
import { modelScenario, validateScenario } from '@/lib/interventions/model';
import { runSimulation } from '@/lib/interventions/simulation';
import { audit, evidenceForScenario, hashObject } from '@/lib/interventions/store';
import { failure, noStore, readBody } from '@/lib/interventions/http';
import type { Scenario } from '@/lib/interventions/types';
export const runtime = 'nodejs';
const cache = new Map<string, { result: ReturnType<typeof modelScenario>; simulation: ReturnType<typeof runSimulation> }>();
export async function POST(request: Request) {
  try {
    const body = await readBody(request), scenario = body.scenario as Scenario;
    if (!scenario) throw new Error('Scenario required.');
    const context = evidenceForScenario(scenario, { library, local });
    const issues = validateScenario(scenario, context.library, context.local);
    if (issues.some(i => i.severity === 'error')) return Response.json({ error: 'Scenario validation failed.', issues }, { status: 400 });
    const key = hashObject(scenario), existing = cache.get(key);
    if (existing) return Response.json({ ...existing, cached: true }, { headers: noStore });
    const result = modelScenario(scenario, context.library, context.local), simulation = runSimulation(scenario, context.library, context.local);
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    cache.set(key, { result, simulation });
    audit('simulation.completed', { hash: key, interventionId: scenario.interventionId, model: scenario.modelVersion, evidence: scenario.libraryVersion, seed: scenario.seed, draws: scenario.draws, durationMs: simulation.durationMs });
    return Response.json({ result, simulation, cached: false }, { headers: noStore });
  } catch (error) { return failure(error); }
}
