export async function readBody(request: Request, limit = 180000): Promise<Record<string, unknown>> {
  const origin = request.headers.get('origin');
  // Next may expose an internal localhost URL while retaining the browser-facing Host.
  const requestUrl = new URL(request.url), host = request.headers.get('host') ?? requestUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https:' : requestUrl.protocol;
  if (origin && (new URL(origin).host !== host || new URL(origin).protocol !== protocol)) throw new Error('Cross-origin writes are not allowed.');
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Use application/json.');
  if (Number(request.headers.get('content-length') ?? 0) > limit) throw new Error('Request is too large.');
  if (!request.body) throw new Error('JSON body required.');
  const reader = request.body.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > limit) { await reader.cancel(); throw new Error('Request is too large.'); } chunks.push(value); }
  const content = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { content.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder().decode(content));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('JSON object required.'); return body;
}
export function failure(error: unknown) { return Response.json({ error: error instanceof Error ? error.message.slice(0, 1800) : 'Unable to process request.' }, { status: 400 }); }
export const noStore = { 'Cache-Control': 'no-store' };
