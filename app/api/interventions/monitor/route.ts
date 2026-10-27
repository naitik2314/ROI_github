import { addObservation, getMonitor, setProgramState } from '@/lib/interventions/store';
import { failure, noStore, readBody } from '@/lib/interventions/http';
import type { ObservedPeriod } from '@/lib/interventions/types';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { const id = new URL(request.url).searchParams.get('id'); if (!id) throw new Error('Saved version required.'); return Response.json(getMonitor(id), { headers: noStore }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try { const body = await readBody(request, 6000); if (typeof body.id !== 'string') throw new Error('Saved version required.');
    return Response.json(typeof body.state === 'string' ? setProgramState(body.id, body.state) : addObservation(body.id, body.observation as Omit<ObservedPeriod, 'id' | 'snapshotId' | 'createdAt'>), { headers: noStore }); }
  catch (error) { return failure(error); }
}
