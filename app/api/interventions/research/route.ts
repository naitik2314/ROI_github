import { library } from '@/lib/interventions/catalog';
import { researchIntervention } from '@/lib/interventions/research';
import { getResearchRun, researchRuns, storeResearch } from '@/lib/interventions/store';
import { failure, noStore, readBody } from '@/lib/interventions/http';
export const runtime = 'nodejs';
const pending = new Set<string>();
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id'), run = id ? getResearchRun(id) : null;
  return run ? Response.json({ run }, { headers: noStore }) : Response.json({ error: 'Research run not found.' }, { status: 404 });
}
export async function POST(request: Request) {
  try {
    const body = await readBody(request, 2000);
    const intervention = library.interventions.find(i => i.id === body.interventionId);
    if (!intervention) throw new Error('Choose a reviewed intervention.');
    const recent = researchRuns().find(r => r.interventionId === intervention.id && r.query === intervention.searchQuery && r.status === 'completed' && Date.now() - Date.parse(r.searchedAt) < 24 * 60 * 60 * 1000);
    if (recent) return Response.json({ run: { ...recent, cached: true } }, { headers: noStore });
    if (pending.has(intervention.id) || pending.size >= 2) throw new Error('Research is already running. Please wait for the current request.');
    const recentCount = researchRuns().filter(r => Date.now() - Date.parse(r.searchedAt) < 60000).length;
    if (recentCount >= 4) throw new Error('Research request limit reached. Retry in one minute.');
    pending.add(intervention.id);
    try { const run = await researchIntervention(intervention); storeResearch(run); return Response.json({ run }, { headers: noStore }); }
    finally { pending.delete(intervention.id); }
  } catch (error) { return failure(error); }
}
