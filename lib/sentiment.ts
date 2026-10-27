import eventData from '../content/health-events.json' with { type: 'json' };

export type Source = 'social' | 'news' | 'hearings' | 'trends';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export interface SentimentRecord {
  id: string; date: string; source: Source; location: string; county: string | null; organization?: string;
  topic: string; text: string; score: number | null; synthetic: true; eventId?: string;
  recordKind: 'social_post' | 'news_summary' | 'hearing_excerpt' | 'search_interest';
  sourceName: string; sourceContext: string; sessionId?: string; query?: string; interestIndex?: number;
}
export interface DayPoint { date: string; score: number | null; count: number; scoredCount: number; records: SentimentRecord[] }
export const SOURCES: { id: Source; label: string; short: string }[] = [
  { id: 'hearings', label: 'Congressional hearings', short: 'Hearings' },
  { id: 'social', label: 'Social media', short: 'Social' },
  { id: 'news', label: 'News articles', short: 'News' },
  { id: 'trends', label: 'Search interest', short: 'Search' },
];
export const END_DATE = '2026-10-20';
export interface HealthEvent {
  id: string; date: string; label: string; title: string; topic: string;
  sentiment: 'positive' | 'negative'; kind: 'illustrative' | 'reported';
  description: string; response: string; organization?: string; publisher?: string; url?: string;
}
export const HEALTH_EVENTS = eventData as HealthEvent[];
export const COUNTIES = ['Wayne', 'Oakland', 'Macomb', 'Kent', 'Washtenaw', 'Genesee', 'Ingham', 'Kalamazoo'];
export const HEALTH_TOPICS = ['Care access', 'Affordability', 'Mental health', 'Environmental health', 'Prevention', 'Infectious disease', 'Workforce & staffing', 'Health policy'];
export function visibleEvents(rows: SentimentRecord[]) {
  const present = new Set(rows.filter(row => row.eventId).map(row => `${row.eventId}:${row.date}`));
  return HEALTH_EVENTS.filter(event => present.has(`${event.id}:${event.date}`));
}
export const labelSentiment = (score: number): Sentiment => score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral';
export const formatScore = (score: number) => `${score > 0 ? '+' : score < 0 ? '−' : ''}${Math.abs(score).toFixed(2)}`;
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const longDateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
export const formatDate = (date: string, long = false) => (long ? longDateFormatter : shortDateFormatter).format(new Date(`${date}T12:00:00Z`));
export function hasSentiment(record: SentimentRecord): record is SentimentRecord & { score: number } {
  return typeof record.score === 'number' && Number.isFinite(record.score);
}
export function meanScore(rows: SentimentRecord[]) {
  let sum = 0, count = 0;
  for (const row of rows) if (hasSentiment(row)) { sum += row.score; count++; }
  return count ? sum / count : 0;
}
export function aggregateDays(rows: SentimentRecord[]): DayPoint[] {
  const days = new Map<string, SentimentRecord[]>();
  for (const row of rows) { const day = days.get(row.date) ?? []; day.push(row); days.set(row.date, day); }
  return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, records]) => { const scoredCount = records.filter(hasSentiment).length; return { date, records, count: records.length, scoredCount, score: scoredCount ? meanScore(records) : null }; });
}
export function filterRecords(rows: SentimentRecord[], { days, source, county, topic, query }: { days: number; source: Source | 'all'; county: string; topic: string; query: string }) {
  const start = new Date(`${END_DATE}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - days + 1);
  const first = start.toISOString().slice(0, 10); const search = query.trim().toLowerCase();
  return rows.filter(r => r.date >= first && r.date <= END_DATE && (source === 'all' || r.source === source) && (county === 'all' || r.county === county) && (topic === 'all' || r.topic === topic) && (!search || `${r.text} ${r.topic} ${r.county ?? ''} ${r.location} ${r.organization ?? ''}`.toLowerCase().includes(search)));
}
export const EXPORT_DISCLOSURE = 'Synthetic demonstration data. Posts, news outlines, hearing excerpts, search indices and sentiment scores are generated examples, not observed public reaction.';
export function recordsCsv(rows: SentimentRecord[]) {
  const fields = ['id', 'date', 'source', 'location', 'county', 'organization', 'topic', 'text', 'score', 'synthetic', 'eventId', 'recordKind', 'sourceName', 'sourceContext', 'sessionId', 'query', 'interestIndex'] as const;
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [[...fields, 'dataDisclosure'].join(','), ...rows.map(row => [...fields.map(key => escape(row[key])), escape(EXPORT_DISCLOSURE)].join(','))].join('\r\n');
}
