import type { SentimentRecord, HealthEvent } from '../sentiment.ts';
import type { CommunitySignal } from './types.ts';
export function communitySignal(rows: SentimentRecord[], context: { county: string; topic: string; query: string; from: string; to: string; change: number | null; events: HealthEvent[] }): CommunitySignal {
  const scored = rows.filter((r): r is SentimentRecord & { score: number } => typeof r.score === 'number' && Number.isFinite(r.score));
  const narratives = [...scored].sort((a, b) => a.score - b.score).slice(0, 3);
  return { kind: 'community_signal', county: context.county === 'all' ? 'Michigan' : context.county, topic: context.topic === 'all' ? 'All health topics' : context.topic, subtopic: context.query,
    dateFrom: context.from, dateTo: context.to, records: rows.length, scored: scored.length, mean: scored.length ? scored.reduce((n, r) => n + r.score, 0) / scored.length : null, change: context.change,
    narratives: narratives.map(r => ({ id: r.id, text: r.text, source: r.sourceName, synthetic: r.synthetic })), events: context.events.map(e => ({ id: e.id, label: e.label, date: e.date })), synthetic: rows.some(r => r.synthetic), use: 'problem-discovery-only' };
}
