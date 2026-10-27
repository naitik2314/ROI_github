import { EXPORTS_ENABLED } from '@/lib/features';
import { getScenario } from '@/lib/interventions/store';
import { scenarioCsv } from '@/lib/interventions/exports';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (!EXPORTS_ENABLED) return Response.json({ error: 'Exports are temporarily unavailable.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id'), snapshot = id ? getScenario(id) : null;
  if (!snapshot) return Response.json({ error: 'Saved version not found.' }, { status: 404 });
  return new Response(scenarioCsv(snapshot), { headers: { 'Content-Type': 'text/csv;charset=utf-8', 'Content-Disposition': `attachment; filename="fieldwork-decision-v${snapshot.version}.csv"`, 'Cache-Control': 'no-store' } });
}
