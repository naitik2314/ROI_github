import { library } from '../../lib/interventions/catalog.ts';
import { researchIntervention } from '../../lib/interventions/research.ts';
import { storeResearch, closeDatabase } from '../../lib/interventions/store.ts';
const requested = process.argv.slice(2);
const interventions = requested.length ? library.interventions.filter(i => requested.includes(i.id)) : library.interventions;
if (!interventions.length || requested.some(id => !library.interventions.some(i => i.id === id))) throw new Error('Unknown intervention ID.');
try {
  for (const intervention of interventions) {
    const run = await researchIntervention(intervention); storeResearch(run);
    console.log(`${intervention.id}: ${run.status}; ${run.candidates.length} pending publications; ${run.candidates.reduce((n, c) => n + c.extracted.length, 0)} unverified numeric candidates.${run.error ? ' ' + run.error : ''}`);
    if (run.status === 'failed') process.exitCode = 1;
  }
} finally { closeDatabase(); }
