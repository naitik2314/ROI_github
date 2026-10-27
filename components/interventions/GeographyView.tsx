'use client';
import { useEffect, useMemo, useState } from 'react';
import { modelScenario } from '@/lib/interventions/model';
import type { Library, LocalData, ModelResult, Scenario } from '@/lib/interventions/types';
import { number, percent, usd } from './format';
type Geometry = { viewBox: string; source: string; vintage: string; url: string; counties: { fips: string; name: string; path: string; centroid: number[] }[] };
type Metric = 'eligible' | 'reached' | 'outcomes' | 'cost' | 'coverage' | 'roi';
export default function GeographyView({ scenario, library, local, result, onCounty }: { scenario: Scenario; library: Library; local: LocalData; result: ModelResult; onCounty: (fips: string) => void }) {
  const [geometry, setGeometry] = useState<Geometry | null>(null), [mapError, setMapError] = useState('');
  const [metric, setMetric] = useState<Metric>('coverage'), [hover, setHover] = useState<string | null>(null), [scope, setScope] = useState<'independent' | 'footprint'>('independent');
  useEffect(() => { const abort = new AbortController(); fetch('/data/interventions/michigan-map.json', { signal: abort.signal }).then(r => { if (!r.ok) throw new Error('Map unavailable'); return r.json(); }).then(setGeometry).catch(e => { if (e.name !== 'AbortError') setMapError('The cached county map could not be loaded. County comparisons remain available below.'); }); return () => abort.abort(); }, []);
  const rows = useMemo(() => scope === 'footprint' ? result.counties.map(c => ({ ...c, reached: c.enrolled, roi: null as number | null })) : local.counties.map(county => {
    const r = modelScenario({ ...scenario, counties: [county.fips] }, library, local, true);
    return { ...r.counties[0], reached: r.reached, roi: r.roi };
  }), [scenario, library, local, result, scope]);
  const value = (row: typeof rows[number]) => metric === 'cost' ? row.cost : row[metric];
  const max = Math.max(...rows.map(row => Math.abs(value(row) ?? 0)), .00001);
  const format = (v: number | null) => metric === 'cost' ? usd(v, true) : metric === 'coverage' || metric === 'roi' ? percent(v, 1) : number(v);
  const active = rows.find(r => r.fips === (hover ?? scenario.counties[0]));
  const compare = [...rows].sort((a, b) => Number(scenario.counties.includes(b.fips)) - Number(scenario.counties.includes(a.fips)) || b.eligible - a.eligible).slice(0, 8);
  return <section className="geography-section"><div className="studio-section-heading"><div><span className="studio-kicker">PLACE MATTERS</span><h2>One program. Different communities.</h2></div><label className="compact-control">Map measure<select aria-label="Map measure" value={metric} onChange={e => setMetric(e.target.value as Metric)}><option value="coverage">Eligible population coverage</option><option value="eligible">Eligible population</option><option value="reached">Modeled enrollment</option><option value="outcomes">Modeled additional outcomes</option><option value="cost">Program cost</option><option value="roi">Perspective ROI</option></select></label></div>
    <div className="geography-layout"><div className="michigan-map"><div className="studio-segmented" aria-label="Geographic scenario basis"><button aria-pressed={scope === 'independent'} onClick={() => setScope('independent')}>Same program in each county</button><button aria-pressed={scope === 'footprint'} onClick={() => setScope('footprint')}>Current shared footprint</button></div>
      {mapError ? <p role="status">{mapError}</p> : !geometry ? <p role="status">Loading county boundaries…</p> : <svg viewBox={geometry.viewBox} role="group" aria-label="Michigan county map; keyboard focus or select a county to inspect its model.">{geometry.counties.map(county => {
        const row = rows.find(r => r.fips === county.fips), amount = row ? value(row) : null, selected = scenario.counties.includes(county.fips);
        const light = amount === null ? 92 : 90 - Math.min(1, Math.abs(amount) / max) * 48;
        return <path key={county.fips} d={county.path} tabIndex={0} role="button" aria-label={`${county.name} County: ${row ? format(amount) : 'outside current footprint'}`} aria-pressed={selected} fill={amount === null ? '#e4e6de' : `hsl(${amount < 0 ? 18 : 116} 19% ${light}%)`} className={selected ? 'selected-county' : ''} onMouseEnter={() => setHover(county.fips)} onFocus={() => setHover(county.fips)} onMouseLeave={() => setHover(null)} onClick={() => onCounty(county.fips)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCounty(county.fips); } }}><title>{county.name}: {row ? format(amount) : 'No allocation'}</title></path>;
      })}</svg>}
      <p className="studio-caption">{scope === 'independent' ? 'Each county receives the same whole program and capacity in an independent scenario. Results are alternatives and must not be added.' : 'Capacity is shared across selected counties in proportion to enrollment demand. No within-county targeting is inferred.'}</p><div className="map-scale"><span>Lower</span><i /><span>Higher</span><small>Gray = unavailable · rust = negative</small></div>
      {geometry && <a className="studio-source-link" href={geometry.url} target="_blank" rel="noreferrer">{geometry.vintage}</a>}
    </div><div><div className="map-focus" aria-live="polite"><span className="studio-kicker">{active?.name ?? 'County'} COUNTY</span><strong>{active ? format(value(active)) : 'Outside footprint'}</strong><p>{active ? `${number(active.eligible)} potentially eligible · ${percent(active.coverage, 1)} enrollment coverage` : 'Choose a county to model its population and capacity.'}</p><small>{active?.needSource} {active?.needYear ? `· ${active.needYear}` : ''}</small></div><div className="county-comparison" role="table" aria-label="County scenario comparison"><div role="row"><span role="columnheader">County</span><span role="columnheader">Eligible</span><span role="columnheader">Coverage</span></div>{compare.map(row => <button role="row" key={row.fips} onClick={() => onCounty(row.fips)}><span role="cell">{row.name}</span><span role="cell">{number(row.eligible)}</span><span role="cell">{percent(row.coverage, 1)}</span></button>)}</div><p className="studio-caption">Geographic coverage is an equity-relevant planning measure. It does not identify individual disadvantage or replace community engagement.</p></div></div>
  </section>;
}
