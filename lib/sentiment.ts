import eventData from '../content/health-events.json' with { type: 'json' };

export type Source = 'social' | 'news' | 'hearings' | 'trends';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export interface SentimentRecord {
  id: string; date: string; source: Source; location: string; county: string; organization?: string;
  topic: string; text: string; score: number; synthetic: true; eventId?: string;
}
export interface DayPoint { date: string; score: number; count: number; records: SentimentRecord[] }
export const SOURCES: { id: Source; label: string; short: string }[] = [
  { id: 'hearings', label: 'Congressional hearings', short: 'Hearings' },
  { id: 'social', label: 'Social media', short: 'Social' },
  { id: 'news', label: 'News articles', short: 'News' },
  { id: 'trends', label: 'Google Trends', short: 'Trends' },
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
  return HEALTH_EVENTS.filter(event => rows.some(row => row.eventId === event.id && row.date === event.date));
}
export const labelSentiment = (score: number): Sentiment => score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral';
export const formatScore = (score: number) => `${score > 0 ? '+' : score < 0 ? '−' : ''}${Math.abs(score).toFixed(2)}`;
export const formatDate = (date: string, long = false) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: long ? 'long' : 'short', day: 'numeric', ...(long ? { year: 'numeric' as const } : {}) }).format(new Date(`${date}T12:00:00Z`));
export const meanScore = (rows: SentimentRecord[]) => rows.length ? rows.reduce((sum, r) => sum + r.score, 0) / rows.length : 0;
export function aggregateDays(rows: SentimentRecord[]): DayPoint[] {
  const days = new Map<string, SentimentRecord[]>();
  for (const row of rows) { const day = days.get(row.date) ?? []; day.push(row); days.set(row.date, day); }
  return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, records]) => ({ date, records, count: records.length, score: meanScore(records) }));
}
export function filterRecords(rows: SentimentRecord[], { days, source, county, topic, query }: { days: number; source: Source | 'all'; county: string; topic: string; query: string }) {
  const start = new Date(`${END_DATE}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - days + 1);
  const first = start.toISOString().slice(0, 10); const search = query.trim().toLowerCase();
  return rows.filter(r => r.date >= first && r.date <= END_DATE && (source === 'all' || r.source === source) && (county === 'all' || r.county === county) && (topic === 'all' || r.topic === topic) && (!search || `${r.text} ${r.topic} ${r.county} ${r.location} ${r.organization ?? ''}`.toLowerCase().includes(search)));
}
export function recordsCsv(rows: SentimentRecord[]) {
  const fields = ['id', 'date', 'source', 'location', 'county', 'organization', 'topic', 'text', 'score', 'synthetic', 'eventId'] as const;
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [fields.join(','), ...rows.map(row => fields.map(key => escape(row[key])).join(','))].join('\r\n');
}
