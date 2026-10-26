import { library, local } from '@/lib/interventions/catalog';
import { integrityReport, researchRuns } from '@/lib/interventions/store';
import { failure, noStore } from '@/lib/interventions/http';
export const runtime = 'nodejs';
export async function GET() {
  try { return Response.json({ library, local, research: researchRuns().map(run => ({ ...run, candidates: run.candidates.map(candidate => ({ ...candidate, abstract: '', abstractLoaded: false })) })), health: integrityReport() }, { headers: noStore }); }
  catch (error) { return failure(error); }
}
