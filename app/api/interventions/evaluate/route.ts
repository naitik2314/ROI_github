import { evaluateDid } from '@/lib/interventions/evaluation';
import type { DesignReview, PanelRow } from '@/lib/interventions/evaluation';
import { audit } from '@/lib/interventions/store';
import { failure, noStore, readBody } from '@/lib/interventions/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { const body = await readBody(request, 600000); const result = evaluateDid(body.rows as PanelRow[], body.interventionPeriod as number, body.review as DesignReview);
    audit('evaluation.did', { rows: Array.isArray(body.rows) ? body.rows.length : 0, kind: result.kind, estimate: result.estimate }); return Response.json(result, { headers: noStore }); }
  catch (error) { return failure(error); }
}
