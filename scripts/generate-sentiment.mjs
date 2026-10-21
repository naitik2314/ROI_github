import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
// General health fixtures, not provider reviews. Only a small subset references Corewell.
let seed = 20261020;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const pick = items => items[Math.floor(random() * items.length)];
const events = JSON.parse(readFileSync(new URL('../content/health-events.json', import.meta.url)));
const regions = [
  ['Detroit', 'Wayne'], ['Pontiac', 'Oakland'], ['Warren', 'Macomb'], ['Grand Rapids', 'Kent'],
  ['Ann Arbor', 'Washtenaw'], ['Flint', 'Genesee'], ['Lansing', 'Ingham'], ['Kalamazoo', 'Kalamazoo'],
];
const corewellLocations = [['Troy', 'Oakland'], ['Grosse Pointe', 'Wayne'], ['Lenox', 'Macomb'], ['Livonia', 'Wayne']];
const templates = {
  'Care access': {
    positive: ['Evening clinic hours make it easier to get care without missing work.', 'A new transportation option makes routine appointments easier to reach.'],
    neutral: ['Residents are comparing nearby clinics and appointment availability.', 'The discussion covers travel time and access to primary care.'],
    negative: ['Long waits for appointments leave residents worried about getting timely care.', 'Transportation barriers make it difficult to reach routine care.'],
  },
  Affordability: {
    positive: ['Lower prescription costs would make ongoing treatment more manageable.', 'Clearer cost information helps families plan for routine care.'],
    neutral: ['Families are reviewing coverage options and out-of-pocket costs.', 'The conversation includes medication prices and medical billing.'],
    negative: ['Medical bills and prescription costs are putting pressure on household budgets.', 'Worry about unexpected costs is leading some residents to delay care.'],
  },
  'Mental health': {
    positive: ['More community counseling appointments make support easier to reach.', 'Workplace support and peer groups are a welcome source of reassurance.'],
    neutral: ['Residents are looking for local counseling and support resources.', 'The discussion covers mental health appointments and follow-up support.'],
    negative: ['Long waits for counseling leave people feeling unsupported.', 'Burnout and isolation are recurring concerns in the community conversation.'],
  },
  'Environmental health': {
    positive: ['Cleaner neighborhood air and safe walking spaces support everyday wellbeing.', 'Local water testing information offers reassurance to the community.'],
    neutral: ['Residents are checking air quality and local water reports.', 'The discussion includes heat, outdoor work, and respiratory health.'],
    negative: ['Air quality concerns make outdoor activity stressful for people with asthma.', 'Uncertainty about water quality is worrying families in the community.'],
  },
  Prevention: {
    positive: ['A neighborhood screening visit makes preventive care easier to fit into the week.', 'Convenient blood pressure checks and clear follow-up are welcome improvements.'],
    neutral: ['Residents are reviewing community screening schedules and eligibility.', 'The discussion includes preventive appointments and routine follow-up.'],
    negative: ['Work schedules and travel barriers make preventive screening difficult.', 'Limited screening availability makes early follow-up harder to arrange.'],
  },
  'Infectious disease': {
    positive: ['Convenient vaccination appointments help families prepare for the season.', 'Clear prevention information helps the community feel more prepared.'],
    neutral: ['Residents are checking vaccination schedules and seasonal symptoms.', 'The discussion covers testing availability and infection prevention.'],
    negative: ['Seasonal illness and missed work are creating stress for families.', 'Confusing prevention information is leaving residents uncertain about next steps.'],
  },
  'Workforce & staffing': {
    positive: ['Better shift coverage and protected breaks support care-team wellbeing.', 'Stable staffing and supportive teams are reassuring for the community.'],
    neutral: ['Community members are asking how local care teams organize staffing.', 'The discussion includes clinician workload and continuity of care.'],
    negative: ['Staffing shortages and burnout are raising concerns about care continuity.', 'Heavy workloads leave care teams and patients worried about timely support.'],
  },
  'Health policy': {
    positive: ['Investment in community services is a welcome step toward accessible care.', 'Clear public health guidance helps residents navigate available support.'],
    neutral: ['Residents are discussing public health funding and service eligibility.', 'The discussion includes community health priorities and local policy.'],
    negative: ['Uncertainty about public health funding is causing concern about service access.', 'Complex eligibility rules make it difficult to understand available support.'],
  },
};
const prefixes = { social: 'Synthetic community post', news: 'Synthetic news summary', hearings: 'Synthetic policy discussion', trends: 'Synthetic search-interest proxy' };
const records = Array.from({ length: 10000 }, (_, i) => {
  // 120 records per event = 6% of the dataset; Corewell is only 1.2% overall.
  const event = i < events.length * 120 ? events[Math.floor(i / 120)] : null;
  const offset = i % 120 < 60 ? 0 : i % 120 < 90 ? 1 : 2;
  const day = Math.floor(random() * 90);
  const date = event ? new Date(Date.parse(`${event.date}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10) : new Date(Date.UTC(2026, 6, 23 + day)).toISOString().slice(0, 10);
  const [location, county] = pick(event?.organization ? corewellLocations : regions);
  const draw = random(), source = draw < .47 ? 'social' : draw < .73 ? 'news' : draw < .89 ? 'trends' : 'hearings';
  const topic = event?.topic ?? pick(Object.keys(templates));
  const trend = .06 + .12 * Math.sin(day / 7) + .08 * Math.cos(day / 3.8);
  const assigned = event ? (event.sentiment === 'positive' ? .55 : -.6) + (random() - .5) * .4 : trend + (random() - .5) * 1.3;
  const score = Number(Math.max(-1, Math.min(1, assigned)).toFixed(3));
  const sentiment = score > .15 ? 'positive' : score < -.15 ? 'negative' : 'neutral';
  const text = event?.response ?? pick(templates[topic][sentiment]);
  return { id: `SYN-${String(i + 1).padStart(5, '0')}`, date, source, location, county, topic,
    text: `${prefixes[source]} · ${location}: ${text}`, score, synthetic: true,
    ...(event ? { eventId: event.id } : {}), ...(event?.organization ? { organization: event.organization } : {}),
  };
}).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/data/sentiment.json', import.meta.url), JSON.stringify(records));
writeFileSync(new URL('../public/data/manifest.json', import.meta.url), JSON.stringify({
  count: records.length, synthetic: true, seed: 20261020, from: '2026-07-23', to: '2026-10-20',
  scope: 'Overall health-related sentiment across Michigan communities, eight health topics, and four simulated source categories. Not a Corewell or hospital review dashboard.',
  topics: Object.keys(templates), counties: regions.map(r => r[1]),
  method: 'Seeded fixture generator with assigned sentiment scores. 9,400 general-health records and 120 records per event. No actual posts, testimony, search metrics, or patient data.',
  events: events.map(event => ({ ...event, syntheticResponseRecords: 120, note: event.kind === 'reported' ? 'Reported planned outsourcing; not independently confirmed here. Publication date, not a verified implementation date. All responses are simulated.' : 'Entire event and all associated responses are illustrative, not actual reported events.' })),
}, null, 2));
console.log(`Generated ${records.length.toLocaleString()} broad health sentiment records across ${Object.keys(templates).length} topics and ${events.length} events.`);
