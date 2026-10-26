import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { library, local } from '../lib/interventions/catalog.ts';
import { createScenario } from '../lib/interventions/scenario.ts';
import { modelScenario } from '../lib/interventions/model.ts';
import { database, closeDatabase, saveScenario, getScenario, evidenceForScenario, integrityReport, getMonitor, setProgramState, addObservation } from '../lib/interventions/store.ts';
import { scenarioCsv } from '../lib/interventions/exports.ts';
import { extractCandidates, deduplicateResearch, researchIntervention } from '../lib/interventions/research.ts';
import { evaluateDid } from '../lib/interventions/evaluation.ts';
import { readBody } from '../lib/interventions/http.ts';

test('evidence/library provenance, review grouping, currencies, units and original price years are complete',()=>{
 assert.equal(library.interventions.length,20); assert.equal(library.effects.length,20); assert.equal(library.economics.length,14);
 assert.equal(new Set(library.sources.map(s=>s.id)).size,library.sources.length);
 for(const source of library.sources) { assert.ok(source.url.startsWith('https://')); assert.ok(source.retrievedAt&&source.version&&source.license&&source.publisher); }
 for(const i of library.interventions){ assert.ok(i.sourceIds.length&&i.effectIds.length&&i.population&&i.setting&&i.resources.length); assert.ok(i.sourceIds.every(id=>library.sources.some(s=>s.id===id))); }
 for(const e of library.effects){ assert.ok(library.sources.some(s=>s.id===e.sourceId)); assert.ok(e.comparator&&e.followUpNote&&e.unit&&e.population); if(e.low!==null) assert.ok(e.low<=e.estimate&&e.estimate<=e.high); }
 const nav=library.effects.filter(e=>/effect-(crc|breast|cervical)-navigation/.test(e.id)); assert.equal(new Set(nav.map(e=>e.studyId)).size,1); assert.equal(new Set(library.effects.map(e=>e.studyId)).size,17);
 for(const cost of library.economics){ assert.equal(cost.currency,'USD'); assert.ok(cost.priceYear>=2000&&cost.priceYear<=2026); assert.ok(cost.unit&&cost.geography&&cost.note); }
 assert.equal(library.effects.find(e=>e.id==='effect-crc-navigation').estimate,1.82);
 assert.equal(library.effects.find(e=>e.id==='effect-diabetes-prevention').low,.51);
 assert.equal(library.effects.find(e=>e.id==='effect-collaborative-depression').high,1.43);
 assert.equal(library.economics.find(e=>e.id==='economic-team-bp').priceYear,2020);
});
test('83 Michigan county estimates have FIPS, proper population universes, crude intervals, years and matching geometry',()=>{
 assert.equal(local.counties.length,83); assert.equal(new Set(local.counties.map(c=>c.fips)).size,83);
 for(const county of local.counties){ assert.match(county.fips,/^26\d{3}$/); assert.ok(county.adults>0&&county.total>county.adults); assert.ok(county.populationYear); for(const m of county.metrics){ assert.ok(m.low<=m.value&&m.value<=m.high); assert.ok(m.year<=2026); assert.equal(m.status,'MODELED'); assert.equal(m.sourceId,local.source.id); } }
 const map=JSON.parse(readFileSync(new URL('../public/data/interventions/michigan-map.json',import.meta.url)));
 assert.equal(map.counties.length,83); assert.deepEqual(new Set(map.counties.map(c=>c.fips)),new Set(local.counties.map(c=>c.fips)));
 assert.ok(map.counties.every(c=>c.path.startsWith('M')&&c.centroid.every(Number.isFinite)));
 const wayne=local.counties.find(c=>c.fips==='26163'); assert.equal(wayne.name,'Wayne'); assert.equal(wayne.metrics.find(m=>m.id==='BPHIGH').value,40.3);
});
test('immutable versions pin evidence/data, enforce foreign keys and keep monitoring observations separate',()=>{
 const dir=mkdtempSync(join(tmpdir(),'fieldwork-db-test-')); process.env.FIELDWORK_DB_PATH=join(dir,'workspace.sqlite');
 try {
  const scenario=createScenario(library.interventions[0],library,local),result=modelScenario(scenario,library,local);
  const first=saveScenario(scenario,result,null,library,local), second=saveScenario({...scenario,name:'Revised'},result,null,library,local,first.id);
  assert.equal(first.version,1);assert.equal(second.version,2);assert.equal(first.scenarioId,second.scenarioId);assert.equal(getScenario(first.id).name,scenario.name);
  assert.throws(()=>database().prepare('UPDATE scenario_versions SET name=? WHERE id=?').run('mutated',first.id),/immutable/);
  assert.throws(()=>database().prepare('DELETE FROM scenario_versions WHERE id=?').run(first.id),/immutable/);
  assert.equal(first.evidenceHash,second.evidenceHash);
  const newer={library:{...library,version:'future-version'},local:{...local,version:'future-local'}};
  const pinned=evidenceForScenario(scenario,newer);assert.equal(pinned.library.version,library.version);assert.equal(pinned.local.version,local.version);
  assert.equal(getMonitor(first.id).state,'PLANNED');setProgramState(first.id,'LIVE');
  const o={month:1,contacted:100,enrolled:30,completed:24,spend:8000,outcomes:4,fidelity:.9,sentiment:-.1,note:'Aggregate program counts'};
  addObservation(first.id,o);assert.equal(getMonitor(first.id).observations.length,1);assert.throws(()=>addObservation(first.id,o),/already recorded/);
  assert.throws(()=>addObservation(first.id,{...o,month:2,enrolled:110}),/contacted/);
  assert.equal(getScenario(first.id).scenario.parameters.uptake.value,.3);setProgramState(first.id,'COMPLETED');assert.throws(()=>setProgramState(first.id,'LIVE'));
  const integrity=integrityReport();assert.equal(integrity.foreignKeys.length,0);assert.equal(integrity.quickCheck[0].quick_check,'ok');
  const csv=scenarioCsv({...first,scenario:{...first.scenario,name:'=HYPERLINK("unsafe")'}});assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('USER ASSUMPTION'));assert.ok(csv.includes(scenario.modelVersion));
 }finally{closeDatabase();delete process.env.FIELDWORK_DB_PATH;rmSync(dir,{recursive:true,force:true});}
});
test('discovery deduplicates identifiers, extracts only review candidates, and never promotes a new parameter',async()=>{
 const extraction=extractCandidates('Outcome A risk ratio 0.80 (95% CI 0.65 to 0.99) in eligible adults.');assert.equal(extraction.length,1);assert.equal(extraction[0].estimate,.8);assert.equal(extraction[0].reviewRequired,true);
 assert.equal(extractCandidates('RR 0.5 (0.8 to 0.9)').length,0);
 const original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({resultList:{result:[{id:'123',pmid:'123',title:'A study',pubYear:'2025',doi:'10.1234/abc',abstractText:'Risk ratio 0.8 (95% CI 0.6 to 1.0). NCT12345678',pubTypeList:{pubType:['Randomized Controlled Trial']}},{id:'456',pmid:'456',title:'Duplicate',pubYear:'2025',doi:'10.1234/abc',abstractText:''}]}});
 try{const before=library.effects[0].estimate,run=await researchIntervention(library.interventions[0]);assert.equal(run.status,'completed');assert.equal(run.candidates.length,1);assert.equal(run.excluded.length,1);assert.equal(run.candidates[0].studyGroup,'NCT12345678');assert.equal(run.candidates[0].reviewState,'pending');assert.equal(library.effects[0].estimate,before);assert.equal(deduplicateResearch([...run.candidates,...run.candidates]).included.length,1);}finally{globalThis.fetch=original;}
});
function panel(effect=-5,preSlope=0){const rows=[];for(const group of ['treated','control'])for(let site=0;site<12;site++)for(let period=1;period<=12;period++){const treated=group==='treated';rows.push({site:`${group}-${site}`,group,period,value:50+site*.2+period*.5+(treated?3+preSlope*period:0)+(treated&&period>=7?effect:0)+Math.sin(site+period)*.05});}return rows;}
const review={preTrendTolerance:.1,parallelTrends:true,stableMeasurement:true,noSpillovers:true,noConcurrentShock:true,comparisonRationale:'Comparison sites share the same service definitions and were selected before implementation based on local design review.'};
test('DiD benchmark approximately recovers a known treatment effect with site-cluster uncertainty and visible pretrends',()=>{
 const r=evaluateDid(panel(-5),7,review);assert.equal(r.kind,'DESIGN-DEPENDENT CAUSAL ESTIMATE');assert.ok(Math.abs(r.estimate+5)<.03);assert.ok(r.interval.low< -4.9&&r.interval.high> -5.1);assert.ok(Math.abs(r.preSlopeDifference)<.02);
 assert.deepEqual(evaluateDid(panel(-5),7,review),r);
 const nullEffect=evaluateDid(panel(0),7,review);assert.ok(Math.abs(nullEffect.estimate)<.03);
});
test('causal estimates are withheld when review/data requirements fail; malformed or staggered panels are rejected',()=>{
 assert.equal(evaluateDid(panel(-5,1),7,review).estimate,null);
 const notReviewed=evaluateDid(panel(),7,{...review,parallelTrends:false});assert.equal(notReviewed.estimate,null);assert.equal(notReviewed.kind,'OBSERVED CHANGE');
 const small=evaluateDid(panel().filter(r=>r.site.endsWith('-0')),7,review);assert.equal(small.estimate,null);
 const duplicated=panel();duplicated.push(duplicated[0]);assert.throws(()=>evaluateDid(duplicated,7,review));
 const staggered=panel();staggered[0].group='control';assert.throws(()=>evaluateDid(staggered,7,review),/fixed/);
});
test('HTTP validation bounds payloads, rejects cross-origin writes, malformed imports and non-JSON content',async()=>{
 const request=(body,headers={})=>new Request('http://localhost/api/interventions/test',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});
 assert.deepEqual(await readBody(request('{"value":1}')),{value:1});
 assert.deepEqual(await readBody(new Request('http://localhost:3012/api/test',{method:'POST',headers:{'Content-Type':'application/json',host:'127.0.0.1:3012',origin:'http://127.0.0.1:3012'},body:'{}'})),{});
 await assert.rejects(readBody(request('{}',{origin:'https://untrusted.example'})),/Cross-origin/);
 await assert.rejects(readBody(request('x'.repeat(100)),10),/too large/);
 await assert.rejects(readBody(request('{broken')));
 await assert.rejects(readBody(request('[]')),/object/);
});
