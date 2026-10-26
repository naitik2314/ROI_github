import { writeFile, mkdir } from 'node:fs/promises';
import { library, local } from '../../lib/interventions/catalog.ts';
import { createScenario } from '../../lib/interventions/scenario.ts';
import { modelScenario, validateScenario } from '../../lib/interventions/model.ts';
import { runSimulation } from '../../lib/interventions/simulation.ts';
import { listScenarios, saveScenario, closeDatabase } from '../../lib/interventions/store.ts';
const examples = [['crc-navigation', 'Wayne', 3], ['diabetes-prevention', 'Oakland', 5], ['collaborative-depression', 'Genesee', 3], ['asthma-home', 'Kent', 3], ['crc-navigation', 'Oakland', 3], ['crc-navigation', 'Macomb', 3]];
const results = [];
try {
  const existing = listScenarios();
  for (const [id, county, horizon] of examples) {
    const intervention = library.interventions.find(i => i.id === id);
    const scenario = createScenario(intervention, library, local);
    scenario.name = `Evidence scenario · ${county} · ${intervention.name}`;
    scenario.counties = [local.counties.find(c => c.name === county).fips]; scenario.horizonYears = horizon; scenario.draws = 10000;
    if (validateScenario(scenario, library, local).some(i => i.severity === 'error')) throw new Error(`Invalid example ${id}`);
    const result = modelScenario(scenario, library, local), simulation = runSimulation(scenario, library, local);
    if (result.reached > result.eligible || result.matured > result.reached || result.financialCost < 0) throw new Error('Model invariant failed.');
    const saved = existing.find(s => s.name === scenario.name && s.scenario.libraryVersion === scenario.libraryVersion && s.scenario.localDataVersion === scenario.localDataVersion);
    if (!saved) saveScenario(scenario, result, simulation, library, local, existing.find(s => s.name === scenario.name)?.id ?? null);
    results.push({ intervention: id, county, horizon, evidenceVersion: library.version, dataVersion: local.version, seed: scenario.seed, reached: result.reached, outcomes: result.outcomes, unit: result.outcomeUnit, financialCost: result.financialCost, roi: result.roi, interval: simulation.metrics.impact, durationMs: simulation.durationMs, readiness: result.readiness });
    console.log(`${id} / ${county}: ${result.reached.toFixed(0)} enrollments, ${result.outcomes?.toFixed(1)} ${result.outcomeUnit}; USD ${result.financialCost}; ROI ${result.roi ?? 'unvalued'}.`);
  }
  await mkdir(new URL('../../docs/', import.meta.url), { recursive: true });
  await writeFile(new URL('../../docs/intervention-model-validation.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), scenarios: results }, null, 2) + '\n');
} finally { closeDatabase(); }
