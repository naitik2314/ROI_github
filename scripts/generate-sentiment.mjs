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
// Each channel has its own content and sampling rules; source labels are not shuffled.
const newsThemes = {
  'Care access': ['Evening clinic hours widen appointment options', 'Primary care access remains a community priority', 'Appointment backlogs expose gaps in primary care'],
  Affordability: ['Prescription assistance offers relief for household budgets', 'Families compare coverage and out-of-pocket costs', 'Medical bills put pressure on household finances'],
  'Mental health': ['Community counseling expands routes to support', 'Local services map mental health referral pathways', 'Counseling waitlists leave gaps in timely support'],
  'Environmental health': ['Neighborhood initiatives focus on cleaner air and water', 'Communities review environmental health monitoring', 'Air and water concerns raise questions about exposure'],
  Prevention: ['Mobile screenings bring preventive care closer to home', 'Community groups review screening and follow-up access', 'Work schedules and travel complicate preventive visits'],
  'Infectious disease': ['Convenient vaccination clinics support seasonal preparation', 'Clinics outline seasonal testing and vaccination options', 'Seasonal illness strains working households'],
  'Workforce & staffing': ['Stable shift coverage supports continuity of care', 'Care teams examine recruitment and staffing needs', 'Burnout and vacancies challenge local care teams'],
  'Health policy': ['Community services benefit from prevention-focused planning', 'Public health priorities enter local funding discussions', 'Funding uncertainty complicates community service planning'],
};
const policySessions = [
  { date: '2026-07-29', committee: 'Senate HELP committee scenario', topic: 'Workforce & staffing', agenda: 'Health workforce capacity', excerpts: ['A fictional witness identifies rural vacancies and clinician burnout as barriers to timely care.', 'A fictional witness describes training pipelines and recruitment incentives without endorsing a policy.', 'A fictional witness supports stronger workforce training and retention programs to improve access.'] },
  { date: '2026-09-09', committee: 'House Energy and Commerce committee scenario', topic: 'Affordability', agenda: 'Prescription affordability', excerpts: ['A fictional witness raises concerns about cost sharing and patients delaying prescriptions.', 'A fictional witness explains how formularies and out-of-pocket costs affect coverage decisions.', 'A fictional witness supports clearer pricing and assistance programs to reduce affordability barriers.'] },
  { date: '2026-09-16', committee: 'Senate HELP committee scenario', topic: 'Mental health', agenda: 'Behavioral health access', excerpts: ['A fictional witness describes long behavioral health waitlists and gaps in rural access.', 'A fictional witness outlines the role of referral networks and the behavioral health workforce.', 'A fictional witness supports community-based counseling capacity and timely follow-up.'] },
  { date: '2026-09-23', committee: 'House Energy and Commerce committee scenario', topic: 'Environmental health', agenda: 'Environmental exposure and community health', excerpts: ['A fictional witness raises concerns about respiratory exposure and uneven monitoring coverage.', 'A fictional witness describes air and water monitoring methods and their limitations.', 'A fictional witness supports improved monitoring and clearer public communication about exposure.'] },
  { date: '2026-09-30', committee: 'Senate Finance committee scenario', topic: 'Care access', agenda: 'Coverage and primary care access', excerpts: ['A fictional witness describes gaps between insurance coverage and available primary care appointments.', 'A fictional witness reviews payment incentives and referral patterns without endorsing a proposal.', 'A fictional witness supports measures to improve primary care access in underserved communities.'] },
  { date: '2026-10-07', committee: 'Senate HELP committee scenario', topic: 'Health policy', agenda: 'Community health preparedness', excerpts: ['A fictional witness identifies unstable funding as a barrier to sustained preparedness.', 'A fictional witness reviews the respective roles of federal, state, and community health services.', 'A fictional witness supports predictable public health funding and clearer interagency coordination.'] },
];
const searchQueries = {
  'Care access': ['primary care appointments', 'walk in clinic'],
  Affordability: ['prescription discount', 'health insurance cost'],
  'Mental health': ['counseling near me', 'mental health support'],
  'Environmental health': ['air quality today', 'water testing'],
  Prevention: ['blood pressure screening', 'health screening near me'],
  'Infectious disease': ['flu vaccine near me', 'covid testing'],
  'Workforce & staffing': ['nursing jobs', 'healthcare burnout'],
  'Health policy': ['Medicaid eligibility', 'community health funding'],
};
const records = [];
const publishers = ['Community Health Desk (fictional)', 'Michigan Health Brief (fictional)', 'Regional Care Bulletin (fictional)', 'Neighborhood Health Review (fictional)'];
const socialOpenings = ['Trying to fit care around a work shift.', 'This came up in our neighborhood group.', 'Looking at options for my family.', 'I have been comparing local services.', 'Something our community needs to talk about.', 'Sharing a thought from our area.'];
const socialClosings = ['Has anyone found a useful local resource?', 'Would like to hear how others are handling this.', 'Clear information would help people plan.', 'Hoping the next update explains the options.', 'This affects how we plan our week.', 'Interested in what changes next.'];
function add(row) { records.push({ id: `SYN-${String(records.length + 1).padStart(5, '0')}`, synthetic: true, ...row }); }
function generic(source, index) {
  const day = Math.floor(random() * 90), date = new Date(Date.UTC(2026, 6, 23 + day)).toISOString().slice(0, 10);
  const [location, county] = pick(regions), topic = pick(Object.keys(templates));
  const score = Number(Math.max(-1, Math.min(1, .06 + .12 * Math.sin(day / 7) + .08 * Math.cos(day / 3.8) + (random() - .5) * 1.3)).toFixed(3));
  const sentiment = score > .15 ? 'positive' : score < -.15 ? 'negative' : 'neutral';
  const body = pick(templates[topic][sentiment]);
  if (source === 'social') add({ date, source, location, county, topic, score, recordKind: 'social_post', sourceName: `@community_${String(index + 1).padStart(4, '0')} (demo)`, sourceContext: 'Invented community post and contributor; not an actual social-media account.', text: `${pick(socialOpenings)} ${body} ${pick(socialClosings)}` });
  else {
    const headline = newsThemes[topic][sentiment === 'positive' ? 0 : sentiment === 'neutral' ? 1 : 2];
    add({ date, source, location, county, topic, score, recordKind: 'news_summary', sourceName: pick(publishers), sourceContext: 'Fictional regional news brief; no real article, outlet attribution, quotation, or measured reaction is implied.', text: `${headline} — This regional brief examines ${topic.toLowerCase()} in ${county} County. ${body}` });
  }
}
for (let i = 0; i < 5900; i++) generic('social', i);
for (let i = 0; i < 1800; i++) generic('news', i);
// Event examples are news outlines and community reactions, never invented testimony.
for (const event of events) for (let i = 0; i < 120; i++) {
  const offset = i < 60 ? 0 : i < 90 ? 1 : 2;
  const date = new Date(Date.parse(`${event.date}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  const [location, county] = pick(event.organization ? corewellLocations : regions);
  const source = i < 12 ? 'news' : 'social';
  const score = Number(((event.sentiment === 'positive' ? .55 : -.6) + (random() - .5) * .4).toFixed(3));
  const corewellReactions = [
    `Concerned about what the reported Corewell staffing plan could mean for continuity at ${location}. I would like clearer information before the change.`,
    `If the reported TeamHealth arrangement moves ahead at ${location}, who will handle staffing concerns and follow-up questions?`,
    `The reported ER staffing plan at ${location} raises questions about workload and clinician autonomy. Hoping for a clear explanation.`,
    `Reading about the proposed Corewell ER staffing change in ${location}. Care continuity and accountability are what I want explained.`,
  ];
  const text = source === 'news' ? `${event.label}: regional discussion focuses on ${event.topic.toLowerCase()} — ${event.response} The ${county} County context is summarized as a fictional news brief.` : `${event.organization ? pick(corewellReactions) : event.response} ${pick(socialClosings)}`;
  add({ date, source, location, county, topic: event.topic, score, eventId: event.id, ...(event.organization ? { organization: event.organization } : {}), recordKind: source === 'news' ? 'news_summary' : 'social_post', sourceName: source === 'news' ? pick(publishers) : `@community_event_${records.length + 1} (demo)`, sourceContext: event.kind === 'reported' ? 'Invented news outline or community reaction to the linked report; not an actual article, account, quotation, or hearing.' : 'Invented news outline or community reaction to an entirely illustrative event.', text });
}
// Six explicitly fictional policy sessions, six segments each. No local provider allegations.
for (const [sessionIndex, session] of policySessions.entries()) for (let segment = 0; segment < 6; segment++) {
  const stance = Math.floor(segment / 2), score = [-.5, -.35, 0, .05, .35, .5][segment];
  add({ date: session.date, source: 'hearings', recordKind: 'hearing_excerpt', location: 'National policy scenario', county: null, topic: session.topic, score, sessionId: `SIM-POLICY-${sessionIndex + 1}`, sourceName: session.committee, sourceContext: `Fictional session SIM-POLICY-${sessionIndex + 1}, segment ${segment + 1} of 6. Agenda: ${session.agenda}. Not a real hearing, transcript, named witness, or quotation; no county-level attribution.`, text: `${session.excerpts[stance]} ${segment % 2 ? 'The segment discusses implementation considerations and access barriers.' : 'The segment discusses the national policy implications.'}` });
}
// 16 query topics × 8 counties × 13 weekly periods. Normalize within each series.
for (const [topic, queries] of Object.entries(searchQueries)) for (const query of queries) for (const [location, county] of regions) {
  const raw = Array.from({ length: 13 }, (_, week) => 20 + random() * 65 + (topic === 'Infectious disease' ? week * 2 : 0));
  const peak = Math.max(...raw);
  raw.forEach((value, week) => {
    const date = new Date(Date.UTC(2026, 6, 28 + week * 7)).toISOString().slice(0, 10), interestIndex = Math.round(value / peak * 100);
    add({ date, source: 'trends', recordKind: 'search_interest', location, county, topic, query, interestIndex, score: null, sourceName: 'Simulated search-interest series', sourceContext: 'Google Trends-style weekly index, normalized within this query and county over the demo window. Not a real Google metric, raw search count, public opinion, or a sentiment score. Indices across different queries are not directly comparable.', text: `Search query “${query}” — ${county} County weekly interest index: ${interestIndex}/100 (simulated).` });
  });
}
records.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
if (records.length !== 10000) throw new Error(`Expected 10,000 rows, got ${records.length}`);
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/data/sentiment.json', import.meta.url), JSON.stringify(records));
writeFileSync(new URL('../public/data/manifest.json', import.meta.url), JSON.stringify({
  schemaVersion: 2, count: records.length, synthetic: true, seed: 20261020, from: '2026-07-23', to: '2026-10-20',
  scope: 'Overall health-related conversation across Michigan communities; national policy scenarios carry no local county attribution.',
  countsBySource: Object.fromEntries(['social', 'news', 'hearings', 'trends'].map(source => [source, records.filter(r => r.source === source).length])),
  sentimentScoredCount: records.filter(r => r.score !== null).length,
  topics: Object.keys(templates), counties: regions.map(r => r[1]),
  method: 'Source-specific synthetic fixtures: fictional community posts, regional news outlines, six fictional policy hearing sessions, and weekly search-interest series. Source labels are not randomly assigned to the same text. No actual posts, testimony, search metrics, or patient data.',
  sourceRules: { hearings: '36 excerpts from six explicitly fictional national policy sessions; no Corewell, provider-specific events, invented quotations, named public officials, or local county attribution.', trends: '1,664 weekly query/county observations. Each 13-week series peaks at 100. Sentiment is null and these rows are excluded from all sentiment averages and percentages.', events: '120 records per event: 12 fictional news outlines and 108 community reactions. No hearing or search-interest records are linked to these events.' },
  policySessions: policySessions.map((session, index) => ({ ...Object.fromEntries(Object.entries(session).filter(([key]) => key !== 'excerpts')), id: `SIM-POLICY-${index + 1}`, segments: 6, synthetic: true })),
  events: events.map(event => ({ ...event, syntheticResponseRecords: 120, note: event.kind === 'reported' ? 'Reported plan; not independently confirmed here. Publication date, not a verified implementation date. All linked rows are invented news outlines or community reactions.' : 'Entire event and all associated responses are illustrative.' })),
}, null, 2));
console.log(`Generated ${records.length.toLocaleString()} source-specific records; ${records.filter(r => r.score !== null).length.toLocaleString()} sentiment-scored, 36 fictional policy excerpts, 1,664 unscored search-interest observations.`);
