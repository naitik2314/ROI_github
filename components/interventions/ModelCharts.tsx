'use client';
import { useState } from 'react';
import type { ModelResult, ParamKey, Scenario, SimulationSummary } from '@/lib/interventions/types';
import { PARAMETER_META } from '@/lib/interventions/scenario';
import { number, percent, usd } from './format';

export function ReachFunnel({ result, onParameter }: { result: ModelResult; onParameter: (key: ParamKey) => void }) {
  const stages: { label: string; value: number; key: ParamKey; source: string }[] = [
    { label: 'Population base', value: result.population, key: 'demographicShare', source: 'CDC PLACES denominator' },
    { label: 'Demographically eligible', value: result.demographic, key: 'demographicShare', source: 'Eligibility assumption' },
    { label: 'Clinical / social eligibility', value: result.eligible, key: 'needShare', source: 'County estimate or explicit assumption' },
    { label: 'Enrollment demand', value: result.demand, key: 'uptake', source: 'Awareness × contact × uptake' },
    { label: 'Capacity-limited enrollment', value: result.reached, key: 'staffFte', source: 'Staff, sites and referral slots' },
    { label: 'Expected completion', value: result.completed, key: 'retention', source: 'Retention assumption' },
  ];
  return <div className="impact-funnel" aria-label="Population and implementation funnel">{stages.map((stage, index) => <button key={stage.label} onClick={() => onParameter(stage.key)} title={`Inspect ${stage.source}`}>
    <span className="funnel-index">0{index + 1}</span><span className="funnel-description"><strong>{stage.label}</strong><small>{stage.source}</small></span><span className="funnel-track"><i style={{ width: `${Math.max(2, stage.value / (result.population || 1) * 100)}%` }} /></span><b>{number(stage.value)}</b>
  </button>)}<p className="studio-caption">Unique people across the full horizon. {number(result.capacity)} intake slots/month at full capacity. Completion is reported separately from the published assignment effect.</p></div>;
}

export function BudgetTimeline({ result, scenario, simulation }: { result: ModelResult; scenario: Scenario; simulation: SimulationSummary | null }) {
  const [selectedYear, setSelectedYear] = useState(1);
  const year = Math.min(selectedYear, result.annual.length), selected = result.annual[year - 1];
  const totals = result.annual.reduce((all, row) => [...all, { cost: (all.at(-1)?.cost ?? 0) + row.spend, benefit: row.benefit === null ? null : (all.at(-1)?.benefit ?? 0) + row.benefit }], [] as { cost: number; benefit: number | null }[]);
  const max = Math.max(scenario.budget, ...totals.map(row => Math.max(row.cost, row.benefit ?? 0)), 1);
  const x = (i: number) => 60 + i * 620 / Math.max(1, totals.length), y = (v: number) => 225 - v / max * 180;
  const costPath = `M ${x(0)} ${y(0)} ` + totals.map((row, i) => `L ${x(i + 1)} ${y(row.cost)}`).join(' ');
  const benefitPath = `M ${x(0)} ${y(0)} ` + totals.map((row, i) => `L ${x(i + 1)} ${y(row.benefit ?? 0)}`).join(' ');
  return <div><div className="studio-chart-header"><div><span className="studio-kicker">AFFORDABILITY OVER TIME</span><h3>Spend now. See when value could follow.</h3></div><div className="studio-legend"><span><i className="legend-cost" />Program spend</span>{result.grossBenefit !== null && <span><i />Captured benefit</span>}</div></div>
    <div className="studio-svg-scroll"><svg viewBox="0 0 740 275" role="img" aria-label={`Cumulative program cost ${usd(result.financialCost)} over ${scenario.horizonYears} years. Budget ${usd(scenario.budget)}. ${result.paybackMonth === null ? 'No financial payback inside the horizon.' : `Undiscounted payback in month ${result.paybackMonth}.`}`}>
      {[0, .5, 1].map(r => <g key={r}><line x1="60" x2="700" y1={y(max * r)} y2={y(max * r)} className="studio-grid-line" /><text x="6" y={y(max * r) + 4}>{usd(max * r, true)}</text></g>)}
      <line x1="60" x2="700" y1={y(scenario.budget)} y2={y(scenario.budget)} className="studio-budget-line" /><text x="700" y={y(scenario.budget) - 8} textAnchor="end">Available budget</text>
      <path d={costPath} className="studio-cost-path" />{result.grossBenefit !== null && <path d={benefitPath} className="studio-benefit-path" />}
      {totals.map((row, i) => <g key={i}><circle role="button" tabIndex={0} aria-label={`Inspect year ${i + 1}`} onClick={() => setSelectedYear(i + 1)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedYear(i + 1); } }} cx={x(i + 1)} cy={y(row.cost)} r={year === i + 1 ? 7 : 5} fill="#b36e55" stroke="var(--paper)" strokeWidth="3"><title>Year {i + 1}: cumulative spend {usd(row.cost)}, captured benefit {usd(row.benefit)}</title></circle><text x={x(i + 1)} y="256" textAnchor="middle">Year {i + 1}</text></g>)}
    </svg></div><div className="annual-readout"><strong>Year {year}</strong><span>Spend <b>{usd(selected.spend)}</b></span><span>Captured benefit <b>{usd(selected.benefit)}</b></span><span>Net budget impact <b>{usd(selected.netSpend)}</b></span></div>
    <p className="studio-caption">Undiscounted cash-flow view. Economic results use the selected discount rates. {simulation?.fan.length ? 'The outcome fan below uses conditional simulation percentiles.' : 'Click a year to inspect its annual budget impact.'}</p></div>;
}

export function UncertaintyCharts({ summary, result, onParameter }: { summary: SimulationSummary; result: ModelResult; onParameter: (key: ParamKey) => void }) {
  const [bin, setBin] = useState<number | null>(null);
  const max = Math.max(...summary.histogram.map(b => b.count), 1), span = Math.max(...summary.sensitivity.map(s => s.span), 1);
  const maxImpact = Math.max(...summary.fan.map(y => y.high), 1), xx = (i: number) => 35 + i * 600 / Math.max(1, summary.fan.length - 1), yy = (v: number) => 170 - v / maxImpact * 140;
  const fanPath = summary.fan.map((p, i) => `${i ? 'L' : 'M'} ${xx(i)} ${yy(p.high)}`).join(' ') + ' ' + summary.fan.map((p, i) => `L ${xx(i)} ${yy(p.low)}`).reverse().join(' ') + ' Z';
  const minScatterCost = Math.min(...summary.scatter.map(p => p.cost)), maxScatterCost = Math.max(...summary.scatter.map(p => p.cost));
  const minScatterImpact = Math.min(...summary.scatter.map(p => p.impact)), maxScatterImpact = Math.max(...summary.scatter.map(p => p.impact));
  return <><div className="studio-section-heading"><div><span className="studio-kicker">UNCERTAINTY, MADE VISIBLE</span><h2>A range of possibilities.</h2></div><span className="studio-caption">{number(summary.draws)} draws · seed {summary.seed} · {summary.durationMs} ms</span></div>
    <p className="studio-caption uncertainty-scope">{summary.caveat}</p>
    <div className="uncertainty-grid"><section><h3>{summary.histogramMetric} distribution</h3><div className="distribution-chart" role="group" aria-label={`${summary.histogramMetric} conditional simulation distribution`}>{summary.histogram.map((b, i) => <button key={i} className={bin === i ? 'selected' : ''} onClick={() => setBin(i)} style={{ height: `${Math.max(2, b.count / max * 100)}%` }} aria-label={`${number(b.low, 2)} to ${number(b.high, 2)}: ${b.count} draws`}><span>{b.count}</span></button>)}</div><div className="distribution-axis"><span>{number(summary.histogram[0].low)}</span><span>{number(summary.histogram.at(-1)!.high)}</span></div><p className="studio-caption" aria-live="polite">{bin === null ? 'Select a bar to inspect its range.' : `${number(summary.histogram[bin].low, 2)}–${number(summary.histogram[bin].high, 2)}: ${percent(summary.histogram[bin].count / summary.draws, 1)} of draws.`}</p><div className="uncertainty-probabilities"><div><span>Within budget</span><b>{percent(summary.probability.withinBudget)}</b></div><div><span>Positive perspective ROI</span><b>{percent(summary.probability.positiveRoi)}</b></div>{summary.probability.targetImpact !== null && <div><span>Meeting outcome target</span><b>{percent(summary.probability.targetImpact)}</b></div>}</div></section>
    <section><h3>What changes the decision?</h3><p className="studio-caption">One-way ranges · {summary.sensitivityMetric}. Click a parameter to inspect its basis.</p><div className="tornado-chart">{summary.sensitivity.map(row => <button key={row.key} onClick={() => onParameter(row.key)}><span>{PARAMETER_META[row.key].label}</span><span className="tornado-track"><i style={{ width: `${Math.max(2, row.span / span * 100)}%` }} /></span><small>{number(Math.min(row.lowResult, row.highResult))}–{number(Math.max(row.lowResult, row.highResult))}</small></button>)}</div>{!summary.sensitivity.length && <p className="studio-caption">No supported or explicitly assumed ranges have been supplied.</p>}</section></div>
    {summary.fan.length > 1 && <section className="outcome-fan"><h3>Cumulative modeled outcome · {result.outcomeUnit}</h3><div className="studio-svg-scroll"><svg viewBox="0 0 700 210" role="img" aria-label="Conditional 95 percent uncertainty band over the horizon"><path d={fanPath} fill="#b6c6a7" opacity=".45" /><path d={summary.fan.map((p, i) => `${i ? 'L' : 'M'} ${xx(i)} ${yy(p.median)}`).join(' ')} className="studio-benefit-path" />{summary.fan.map((p, i) => <g key={p.year}><text x={xx(i)} y="200" textAnchor="middle">Year {p.year}</text><circle cx={xx(i)} cy={yy(p.median)} r="4" fill="#3a6543"><title>Year {p.year}: median {number(p.median)}, interval {number(p.low)}–{number(p.high)}</title></circle></g>)}</svg></div></section>}
    {summary.scatter.length > 0 && <section className="simulation-scatter"><h3>Cost versus additional outcome</h3><div className="studio-svg-scroll"><svg viewBox="0 0 700 240" role="img" aria-label="Up to 80 thinned simulation samples by program cost and additional outcome"><line x1="55" x2="660" y1="190" y2="190" className="studio-grid-line" /><text x="55" y="20">Additional outcome ↑</text><text x="430" y="225">Program expenditure →</text>{summary.scatter.map((point, i) => <circle key={i} cx={60 + (maxScatterCost === minScatterCost ? .5 : (point.cost - minScatterCost) / (maxScatterCost - minScatterCost)) * 580} cy={190 - (maxScatterImpact === minScatterImpact ? .5 : (point.impact - minScatterImpact) / (maxScatterImpact - minScatterImpact)) * 150} r="3.5" fill="#5b8050" opacity=".6"><title>{usd(point.cost)} program cost · {number(point.impact, 2)} {result.outcomeUnit}</title></circle>)}</svg></div><p className="studio-caption">Thinned display samples; all draws contribute to the summaries. A vertical line means cost inputs were held fixed.</p></section>}
    <div className="threshold-register">{summary.thresholds.map(t => <div key={t.label}><span>{t.label}</span><strong>{t.value === null ? 'Not estimable' : t.unit === 'fraction' ? percent(t.value, 1) : usd(t.value)}</strong><p>{t.reason}</p></div>)}</div>
    {summary.evpi !== null && <p className="studio-callout">Conditional EVPI for implement versus status quo: <strong>{usd(summary.evpi)}</strong>. This is an upper bound on information value under the specified joint uncertainty, not a research budget recommendation.</p>}
  </>;
}
