import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aggregateDays, filterRecords, meanScore, labelSentiment, recordsCsv, HEALTH_EVENTS, HEALTH_TOPICS, COUNTIES, visibleEvents } from '../lib/sentiment.ts';
import { calculateRoi, DEFAULT_ROI, OUTREACH_SITES, planOutreach } from '../lib/planning.ts';
const records = JSON.parse(readFileSync(new URL('../public/data/sentiment.json', import.meta.url)));
test('10,000 valid, uniquely identified synthetic records cover all sources and all 90 days', () => {
  assert.equal(records.length, 10000); assert.equal(new Set(records.map(r => r.id)).size, 10000);
  assert.equal(new Set(records.map(r => r.date)).size, 90);
  assert.deepEqual([...new Set(records.map(r => r.source))].sort(), ['hearings', 'news', 'social', 'trends']);
  assert.ok(records.every(r => r.synthetic && r.score >= -1 && r.score <= 1 && r.date >= '2026-07-23' && r.date <= '2026-10-20'));
  assert.deepEqual([...new Set(records.map(r => r.topic))].sort(), [...HEALTH_TOPICS].sort());
  assert.deepEqual([...new Set(records.map(r => r.county))].sort(), [...COUNTIES].sort());
  assert.equal(records.filter(r => r.organization === 'Corewell Health').length, 120);
  assert.equal(records.filter(r => !r.eventId).length, 9400);
  assert.equal(visibleEvents(records).length, 5);
  for (const event of HEALTH_EVENTS) {
    const rows = records.filter(r => r.eventId === event.id);
    assert.equal(rows.length, 120);
    assert.ok(rows.every(r => r.date >= event.date && r.topic === event.topic));
    assert.equal(labelSentiment(meanScore(rows)), event.sentiment);
  }
  assert.ok(records.filter(r => r.organization === 'Corewell Health').every(r => r.eventId === 'corewell-er-staffing'));
});
test('filtering and aggregation preserve volume and weighted sentiment', () => {
  const filtered = filterRecords(records, { days: 30, source: 'social', county: 'Oakland', topic: 'Workforce & staffing', query: 'staffing' });
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every(r => r.date >= '2026-09-21' && r.source === 'social' && r.county === 'Oakland' && r.topic === 'Workforce & staffing' && `${r.text} ${r.topic}`.toLowerCase().includes('staffing')));
  const days = aggregateDays(filtered);
  assert.equal(days.reduce((sum, d) => sum + d.count, 0), filtered.length);
  const weighted = days.reduce((sum, d) => sum + d.count * d.score, 0) / filtered.length;
  assert.ok(Math.abs(weighted - meanScore(filtered)) < 1e-10);
  assert.equal(filterRecords(records, { days: 90, source: 'all', county: 'all', topic: 'all', query: 'unfindablefixtureterm' }).length, 0);
  assert.equal(labelSentiment(.15), 'neutral'); assert.equal(labelSentiment(-.15), 'neutral');
});

test('broad health filters scope event annotations instead of imposing Corewell on every view', () => {
  const filter = (county, topic) => filterRecords(records, { days: 90, source: 'all', county, topic, query: '' });
  assert.deepEqual(visibleEvents(filter('all', 'Prevention')).map(e => e.id), ['community-screening']);
  assert.ok(!visibleEvents(filter('Kent', 'all')).some(e => e.id === 'corewell-er-staffing'));
  assert.equal(visibleEvents(filter('all', 'all')).length, 5);
});

test('CSV preserves quoted text and exports all selected records', () => {
  const csv = recordsCsv([{ ...records[0], text: 'A "quoted", synthetic record' }]);
  assert.ok(csv.includes('"A ""quoted"", synthetic record"'));
  assert.equal(recordsCsv(records).split('\r\n').length, 10001);
});
test('ROI reconciles savings and investment; handles invalid inputs and undefined ratios', () => {
  const result = calculateRoi(DEFAULT_ROI);
  assert.equal(result.baseline, 7000000); assert.equal(result.savings, 910000);
  assert.equal(result.net, 660000); assert.equal(result.roi, 264); assert.equal(result.multiple, 3.64);
  assert.equal(calculateRoi({ ...DEFAULT_ROI, programCost: 0 }).roi, null);
  assert.equal(calculateRoi({ ...DEFAULT_ROI, participation: 0 }).paybackMonths, null);
  assert.equal(calculateRoi({ ...DEFAULT_ROI, participation: 101 }), null);
  assert.equal(calculateRoi({ ...DEFAULT_ROI, employees: NaN }), null);
  assert.equal(calculateRoi({ ...DEFAULT_ROI, annualCost: -1 }), null);
});
test('outreach plan respects daily unit capacity, site demand, unique slots, and unmet demand', () => {
  const demand = OUTREACH_SITES.reduce((sum, s) => sum + s.demand, 0);
  for (const units of [1, 2, 3, 4]) for (const capacity of [15, 30, 50]) {
    const plan = planOutreach(units, capacity);
    assert.equal(plan.total + plan.unmet, demand);
    assert.ok(plan.total <= units * capacity * 5);
    assert.equal(new Set(plan.visits.map(v => `${v.day}-${v.unit}`)).size, plan.visits.length);
    assert.equal(new Set(plan.visits.map(v => `${v.day}-${v.site}`)).size, plan.visits.length);
    for (const site of OUTREACH_SITES) assert.ok(plan.visits.filter(v => v.site === site.name).reduce((sum, v) => sum + v.screenings, 0) <= site.demand);
    assert.ok(plan.visits.every(v => v.screenings > 0 && v.screenings <= capacity && v.unit <= units));
  }
  assert.equal(planOutreach(2, 30).total, 300);
});
