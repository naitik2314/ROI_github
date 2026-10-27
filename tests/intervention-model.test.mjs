import test from 'node:test';
import assert from 'node:assert/strict';
import { library, local } from '../lib/interventions/catalog.ts';
import { createScenario, editParameter, PARAMETER_KEYS } from '../lib/interventions/scenario.ts';
import { discount, economicMetrics, incrementalAnalysis, normalizeCost, effectToAbsolute, modelScenario, validateScenario } from '../lib/interventions/model.ts';
import { seededRandom, sampleDistribution, parameterFromProbability, summarize, runSimulation, bisectThreshold } from '../lib/interventions/simulation.ts';
import { optimizePortfolio, paretoFrontier, discoverInterventions } from '../lib/interventions/decisions.ts';
import { communitySignal } from '../lib/interventions/signal.ts';
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a-b) < tolerance, `${a} != ${b}`);
function scenario(id = 'crc-navigation') { return createScenario(library.interventions.find(i => i.id === id), library, local); }
function set(s, patch) { for (const [key, value] of Object.entries(patch)) s = editParameter(s, key, value); return s; }
function simple() {
 const s = set(scenario(), { demographicShare: 1, needShare: 1, awareness: 1, contactability: 1, uptake: 1, retention: .8, adherence: .75, staffFte: 1, monthlyHours: 100, paidHours: 100, serviceHours: 1, siteCapacity: 100, referralCapacity: 100, rampMonths: 1, setupCost: 1200, annualOperatingCost: 1200, hourlyWage: 10, fringeRate: 0, variableCost: 2, opportunityCost: 3, baselineRisk: .2, effect: 2, followUpMonths: 1, lagMonths: 0, benefitPerOutcome: 100, costShare: 1, benefitCapture: 1, discountCost: 0, discountOutcome: 0 });
 s.horizonYears = 1; s.useLocalNeed = false; s.monetization = 'avoided cost'; s.applicabilityReviewed = true;
 return s;
}
test('economic arithmetic, undefined ratios, discounting, CEA, ICER/NMB and cost normalization', () => {
 assert.deepEqual(economicMetrics(100, 150, 10), { netBenefit: 50, netCost: -50, roi: .5, bcr: 1.5, costPerOutcome: -5 });
 assert.equal(economicMetrics(0, 20, 0).roi, null); assert.equal(economicMetrics(100, null, 10).roi, null);
 near(discount(110, .1, 1), 100); near(discount(121, .1, 2), 100);
 assert.equal(normalizeCost(100, 200, 250), 125); assert.throws(() => normalizeCost(100, 0, 200));
 const a = {cost:100,effect:10,outcomeId:'x'}, b = {cost:140,effect:12,outcomeId:'x'};
 assert.deepEqual(incrementalAnalysis(a,b,50), {deltaCost:40,deltaEffect:2,icer:20,dominance:'Trade-off',nmb:60});
 assert.equal(incrementalAnalysis(a,{cost:90,effect:12,outcomeId:'x'}).dominance,'Dominant');
 assert.throws(() => incrementalAnalysis(a,{...b,outcomeId:'other'}));
});
test('effect conversion uses counterfactual risk and distinguishes OR, RR, RD, SMD and unsupported HR/rate semantics', () => {
 const e = {...library.effects[0],direction:'decrease',measure:'risk_ratio'};
 near(effectToAbsolute(e,.8,.2).delta,.04); near(effectToAbsolute(e,.8,.2).treated,.16);
 near(effectToAbsolute({...e,measure:'odds_ratio'},.5,.2).treated,1/9);
 near(effectToAbsolute({...e,measure:'risk_difference'},.05,.2).delta,.05);
 near(effectToAbsolute({...e,measure:'percentage_points'},5,.2).delta,.05);
 assert.equal(effectToAbsolute({...e,measure:'hazard_ratio'},.8,.2).delta,null);
 assert.equal(effectToAbsolute({...e,measure:'rate_ratio'},.8,.2).delta,null);
 assert.equal(effectToAbsolute({...e,measure:'standardized_mean_difference'},.3,.2).delta,null);
 near(effectToAbsolute({...e,measure:'standardized_mean_difference'},.3,.2,10).delta,3);
 const increased = effectToAbsolute({...e,direction:'increase'},10,.2); near(increased.delta,.8);
});
test('cohort funnel, assignment effect, staff/capacity and complete cost ledger reconcile against a hand calculation', () => {
 const s=simple(), r=modelScenario(s,library,local);
 near(r.reached,1200); near(r.completed,960); near(r.adherent,720); near(r.matured,1200); near(r.outcomes,240);
 near(r.financialCost,16800); near(r.economicCost,20400); near(r.grossBenefit,24000); near(r.netBenefit,7200); near(r.roi,7200/16800);
 assert.equal(r.annual[0].spend,16800); assert.equal(r.annual[0].netSpend,-7200);
 assert.equal(r.ledger.filter(x=>x.kind==='financial').reduce((n,x)=>n+x.amount,0),16800);
 near(r.counties.reduce((n,c)=>n+c.enrolled,0),r.reached);
 const societal=modelScenario({...s,perspective:'Societal'},library,local); near(societal.perspectiveCost,20400); near(societal.annual[0].netSpend,-3600);
});
test('staff are paid during ramp-up and immature cohorts never get year-one benefits', () => {
 const s = set(simple(),{rampMonths:12,followUpMonths:12}); const r=modelScenario(s,library,local);
 near(r.reached,650); near(r.matured,100/12); near(r.outcomes,100/12*.2);
 near(r.ledger.find(e=>e.label==='Staff time & employer costs').amount,12000);
 const late=modelScenario(set(s,{lagMonths:1}),library,local); near(late.outcomes,0); assert.equal(late.paybackMonth,null);
});
test('population, capacity, binary impact and missing valuation invariants hold across all real-evidence archetypes', () => {
 for(const i of library.interventions){ const s=scenario(i.id); const r=modelScenario(s,library,local);
  assert.ok(r.reached<=r.eligible+1e-8); assert.ok(r.reached<=r.demand+1e-8); assert.ok(r.completed<=r.reached); assert.ok(r.matured<=r.reached+1e-8);
  assert.ok(r.reached<=r.capacity*s.horizonYears*12); assert.equal(r.roi,null); assert.equal(r.grossBenefit,null); assert.equal(r.netBenefit,null);
  assert.equal(r.annual.reduce((n,y)=>n+y.spend,0).toFixed(2),r.financialCost.toFixed(2));
 }
 const school=modelScenario(scenario('targeted-school-cbt'),library,local); assert.equal(school.outcomes,null); assert.equal(school.readiness,'KEY INPUTS MISSING');
 const changed=editParameter(scenario(),'effect',1.5); assert.equal(changed.parameters.effect.status,'USER ASSUMPTION'); assert.equal(changed.parameters.effect.sourceId,null);
});
test('invalid parameters, malformed ranges, wrong versions, incomplete cohorts and wrong source labels are rejected', () => {
 for(const [key,value] of [['uptake',1.1],['retention',-1],['variableCost',-2],['effect',NaN],['demographicShare',-1]]) assert.ok(validateScenario(set(simple(),{[key]:value}),library,local).some(i=>i.severity==='error'));
 let s=simple(); s.parameters.uptake.distribution={kind:'beta',alpha:-1,beta:3}; assert.ok(validateScenario(s,library,local).some(i=>i.severity==='error'));
 s=simple(); s.parameters.effect.low=3; assert.ok(validateScenario(s,library,local).some(i=>i.severity==='error'));
 s=simple(); s.modelVersion='unknown'; assert.throws(()=>modelScenario(s,library,local));
 s=simple(); s.counties=['26163','26163']; assert.throws(()=>modelScenario(s,library,local));
 s=simple(); s.parameters.monthlyHours.value=200; assert.throws(()=>modelScenario(s,library,local));
 s=scenario(); s.parameters.effect.value=99; assert.throws(()=>modelScenario(s,library,local));
 s=scenario(); s.parameters.effect.distribution={kind:'lognormal',sd:.0001}; assert.throws(()=>modelScenario(s,library,local));
 const zero=set(simple(),{needShare:0});const rz=modelScenario(zero,library,local); assert.equal(rz.eligible,0); assert.equal(rz.reached,0); assert.equal(rz.counties.reduce((n,c)=>n+c.cost,0),rz.financialCost);
 assert.equal(PARAMETER_KEYS.length,Object.keys(simple().parameters).length);
});
test('seeded samplers recover beta/gamma/normal/lognormal/triangular behavior and CI approximation', () => {
 const random=seededRandom(31); const beta={kind:'beta',alpha:3,beta:7}, gamma={kind:'gamma',shape:4,scale:5};
 const b=Array.from({length:20000},()=>sampleDistribution(.3,beta,random)); near(summarize(b).mean,.3,.004); assert.ok(b.every(x=>x>0&&x<1));
 const g=Array.from({length:20000},()=>sampleDistribution(20,gamma,random)); near(summarize(g).mean,20,.2); assert.ok(g.every(x=>x>0));
 near(summarize(Array.from({length:20000},()=>sampleDistribution(2,{kind:'normal',sd:.4},random))).mean,2,.01);
 const log=Array.from({length:20000},()=>sampleDistribution(.8,{kind:'lognormal',sd:.1},random)); near(summarize(log).median,.8,.003);
 const tri=Array.from({length:20000},()=>sampleDistribution(.4,{kind:'triangular',low:.1,mode:.4,high:.7},random)); near(summarize(tri).mean,.4,.004);
 const d=parameterFromProbability(.3,.05); near(d.alpha/(d.alpha+d.beta),.3); assert.throws(()=>parameterFromProbability(.3,1));
 const s=scenario(); near(s.parameters.effect.distribution.sd,(Math.log(2.21)-Math.log(1.50))/(2*1.959963984540054));
});
test('Monte Carlo summaries reproduce exactly with seed and expose conditional uncertainty', () => {
 const s=scenario(); s.draws=10000; const a=runSimulation(s,library,local), b=runSimulation(s,library,local);
 assert.deepEqual({...a,durationMs:0},{...b,durationMs:0}); assert.equal(a.histogram.reduce((n,x)=>n+x.count,0),10000);
 assert.equal(a.probability.targetImpact,null); assert.equal(runSimulation({...s,targetOutcome:1e8},library,local).probability.targetImpact,0); assert.equal(runSimulation({...s,targetOutcome:0},library,local).probability.targetImpact,1);
 assert.equal(a.varied.length,1); assert.equal(a.metrics.netBenefit,null); assert.equal(a.probability.positiveRoi,null); assert.equal(a.evpi,null);
 assert.ok(a.metrics.impact.low < a.metrics.impact.high); assert.ok(a.scatter.length<=80);
 const assumed=runSimulation({...s,includeAssumedUncertainty:true},library,local); assert.ok(assumed.varied.some(p=>p.key==='uptake'));
 const other=runSimulation({...s,seed:s.seed+1},library,local); assert.notDeepEqual(a.metrics.impact,other.metrics.impact);
 assert.ok(a.sensitivity.every((row,i,all)=>i===0||all[i-1].span>=row.span));
});
test('numeric break-even roots and budget thresholds recover known boundaries', () => {
 near(bisectThreshold(x=>x-2,0,5),2); assert.equal(bisectThreshold(x=>x-10,0,5),null);
 const s=simple(); s.draws=100; s.budget=18000; const summary=runSimulation(s,library,local);
 near(summary.thresholds[0].value,3);
 near(summary.thresholds[2].value,8,1e-6);
 assert.ok(summary.probability.positiveRoi===1); assert.equal(summary.probability.costSaving,1);
 assert.equal(runSimulation({...s,monetization:'user valuation'},library,local).probability.costSaving,null);
 const insufficient=set(s,{benefitPerOutcome:1}); assert.equal(runSimulation(insufficient,library,local).thresholds[2].value,null);
});
test('portfolio optimizer finds the exact feasible subset, handles equity, alternative versions and unknown overlap', () => {
 const option=(id,cost,impact,county='26163')=>({id,name:id,county,cost,impact,staff:1,outcomeId:'screened',months:36,priceYear:2026,overlapGroup:'screened',equityReach:0,reach:100});
 const options=[option('A',6,10),option('B',5,9,'26125'),option('C',4,7,'26099')];
 const constraints={budget:9,staff:2,minimumEquityShare:0,equityCounty:'26163',verifiedDisjoint:false};
 const r=optimizePortfolio(options,constraints); assert.deepEqual(r.ids,['B','C']); assert.equal(r.impact,16);
 const eq=optimizePortfolio(options,{...constraints,budget:11,minimumEquityShare:.5}); assert.ok(eq.ids.includes('A'));
 const overlap=optimizePortfolio([option('A',4,10),option('B',4,9)],constraints); assert.equal(overlap.ids.length,1); assert.ok(overlap.overlapRejected>0);
 const alternatives=optimizePortfolio([{...option('A',4,10),alternativeGroup:'same'},{...option('B',4,9,'26125'),alternativeGroup:'same'}],{...constraints,verifiedDisjoint:true}); assert.equal(alternatives.ids.length,1);
 assert.throws(()=>optimizePortfolio([options[0],{...options[1],outcomeId:'different'}],constraints));
 assert.deepEqual(paretoFrontier([{id:'a',cost:10,impact:4,outcomeId:'x'},{id:'b',cost:9,impact:5,outcomeId:'x'},{id:'c',cost:20,impact:8,outcomeId:'different'}]),['b','c']);
});
test('discovery preserves the existing health taxonomy and sentiment never supplies clinical numbers', () => {
 assert.ok(discoverInterventions(library,'Health policy','','').length>0);
 assert.ok(discoverInterventions(library,'Care access','transportation','').some(c=>c.intervention.id==='crc-navigation'));
 assert.ok(discoverInterventions(library,'all','','asthma').every(c=>c.intervention.id==='asthma-home'));
 const signal=communitySignal([{id:'x',score:-.8,synthetic:true,text:'A barrier',sourceName:'Example'}],{county:'Wayne',topic:'Care access',query:'transportation',from:'2026-01-01',to:'2026-03-01',change:-.1,events:[]});
 assert.equal(signal.use,'problem-discovery-only'); assert.equal(signal.records,1);
 const a=createScenario(library.interventions[0],library,local), b=createScenario(library.interventions[0],library,local,signal);
 for(const key of PARAMETER_KEYS) assert.equal(a.parameters[key].value,b.parameters[key].value);
});
