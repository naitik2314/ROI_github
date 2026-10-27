'use client';

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MousePointer2 } from 'lucide-react';
import { DayPoint, HealthEvent, SentimentRecord, formatDate, formatScore, hasSentiment } from '@/lib/sentiment';

type PlotPoint = DayPoint & { score: number; x: number; y: number; dateLabel: string; scoreLabel: string; countLabel: string };
function chartGeometry(points: DayPoint[], width: number, events: HealthEvent[]) {
  const mobile = width < 600;
  const height = mobile ? 300 : 380, left = 48, right = width - 14, top = 38, bottom = height - 52, zero = (top + bottom) / 2;
  const first = points[0]?.date ?? '2026-07-23', last = points.at(-1)?.date ?? '2026-10-20';
  const duration = Math.max(86400000, Date.parse(last) - Date.parse(first));
  const x = (date: string) => left + (Date.parse(date) - Date.parse(first)) / duration * (right - left);
  const y = (score: number) => zero - score * (bottom - top) / 2;
  const plotted: PlotPoint[] = points.flatMap(p => p.score === null ? [] : [{ ...p, score: p.score, x: x(p.date), y: y(p.score), dateLabel: formatDate(p.date), scoreLabel: formatScore(p.score), countLabel: `${p.scoredCount} scored records` }]);
  let path = plotted.length ? `M ${plotted[0].x} ${plotted[0].y}` : '';
  const delta = plotted.slice(1).map((p, i) => (p.y - plotted[i].y) / (p.x - plotted[i].x));
  const slopes = plotted.map((_, i) => i === 0 ? delta[0] ?? 0 : i === plotted.length - 1 ? delta.at(-1) ?? 0 : delta[i - 1] * delta[i] <= 0 ? 0 : 2 / (1 / delta[i - 1] + 1 / delta[i]));
  for (let i = 0; i < plotted.length - 1; i++) {
    const a = plotted[i], b = plotted[i + 1], h = (b.x - a.x) / 3;
    path += ` C ${a.x + h} ${a.y + slopes[i] * h}, ${b.x - h} ${b.y - slopes[i + 1] * h}, ${b.x} ${b.y}`;
  }
  const samples = points.flatMap(p => {
    const scored = p.records.filter(hasSentiment);
    const stride = Math.max(1, Math.ceil(scored.length / 5));
    return scored.filter((_, i) => i % stride === 0).slice(0, 5);
  }).map((record, i) => ({ record, x: Math.max(left, Math.min(right, x(record.date) + ((i % 3) - 1) * 2)), y: y(record.score), title: `${formatDate(record.date)} · ${formatScore(record.score)} · ${record.topic}. Click to explore this record.` }));
  const eventPoints = events.flatMap(event => { const point = plotted.find(p => p.date === event.date); return point ? [{ ...point, event, label: `${formatDate(event.date)}: ${event.label}. ${event.kind === 'reported' ? 'Reported event, simulated response' : 'Illustrative event'}.` }] : []; });
  const ticks = (mobile ? [0, 1 / 3, 2 / 3, 1] : [0, .2, .4, .6, .8, 1]).map(ratio => ({ ratio, x: left + (right - left) * ratio, label: formatDate(new Date(Date.parse(first) + duration * ratio).toISOString().slice(0, 10)) }));
  return { width, height, left, right, top, bottom, zero, mobile, plotted, samples, eventPoints, ticks, path, y };
}
type Geometry = ReturnType<typeof chartGeometry>;
type HoverHandle = { highlight: (date: string) => void; clear: () => void };

// Hover owns only a tiny overlay. It never reconciles the hundreds of plot nodes.
const HoverLayer = forwardRef<HoverHandle, { geometry: Geometry; selectedDate: string }>(function HoverLayer({ geometry: g, selectedDate }, ref) {
  const [hovered, setHovered] = useState<string | null>(null);
  useImperativeHandle(ref, () => ({ highlight: date => setHovered(date), clear: () => setHovered(null) }), []);
  useEffect(() => {
    const clear = () => setHovered(null);
    window.addEventListener('scroll', clear, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', clear, true);
  }, []);
  const active = g.plotted.find(p => p.date === (hovered ?? selectedDate));
  return <>
    <svg className="chart-selection-layer" viewBox={`0 0 ${g.width} ${g.height}`} aria-hidden="true">
      {active && <g><line x1={active.x} x2={active.x} y1={g.top} y2={g.bottom} stroke="#9b9f8f" strokeDasharray="2 5" opacity=".5" /><circle cx={active.x} cy={active.y} r="5" fill={active.score < -.15 ? '#b55d51' : '#4f7a4b'} stroke="#f6f7f2" strokeWidth="2" /></g>}
    </svg>
    {hovered && active && <div className="chart-tooltip" aria-hidden="true" style={{ left: `${Math.min(83, Math.max(9, active.x / g.width * 100))}%`, top: `${Math.max(12, Math.min(67, active.y / g.height * 100 - 17))}%` }}><span>{active.dateLabel}</span><strong>{active.scoreLabel}</strong><small>{active.countLabel}</small></div>}
  </>;
});

const StaticPlot = memo(function StaticPlot({ geometry: g, showRecords, onSelect, onRecord, onHover, onLeave, onKeyStep }: {
  geometry: Geometry; showRecords: boolean; onSelect: (date: string) => void; onRecord: (record: SentimentRecord) => void;
  onHover: (date: string) => void; onLeave: () => void; onKeyStep: (amount: number) => void;
}) {
  const pendingFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(pendingFrame.current), []);
  const leave = () => { cancelAnimationFrame(pendingFrame.current); pendingFrame.current = 0; onLeave(); };
  return <svg viewBox={`0 0 ${g.width} ${g.height}`} className="sentiment-chart" role="group" aria-label="Daily sentiment from minus one to plus one. Use left and right arrow keys to select a day; click a record dot for details." tabIndex={0}
    onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); onKeyStep(e.key === 'ArrowLeft' ? -1 : 1); } }}
    onPointerLeave={leave}
    onPointerMove={e => {
      if (e.pointerType === 'touch' || pendingFrame.current) return;
      const element = e.currentTarget, clientX = e.clientX;
      pendingFrame.current = requestAnimationFrame(() => {
        pendingFrame.current = 0;
        const bounds = element.getBoundingClientRect(), cursor = (clientX - bounds.left) * g.width / bounds.width;
        let closest = g.plotted[0];
        for (const point of g.plotted) if (Math.abs(point.x - cursor) < Math.abs(closest.x - cursor)) closest = point;
        if (closest) onHover(closest.date);
      });
    }}>
    <defs>
      <linearGradient id="sentiment-stroke" x1="0" x2="0" y1={g.top} y2={g.bottom} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#28764b" /><stop offset="46%" stopColor="#618260" /><stop offset="52%" stopColor="#b57966" /><stop offset="100%" stopColor="#b7554d" /></linearGradient>
      <linearGradient id="sentiment-fill" x1="0" x2="0" y1={g.top} y2={g.bottom} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#adc494" stopOpacity=".22" /><stop offset="50%" stopColor="#adc494" stopOpacity="0" /><stop offset="100%" stopColor="#c87969" stopOpacity=".18" /></linearGradient>
    </defs>
    {[1, .5, 0, -.5, -1].map(value => <g key={value}><line x1={g.left} x2={g.right} y1={g.y(value)} y2={g.y(value)} className={value === 0 ? 'zero-line' : 'grid-line'} /><text x="0" y={g.y(value) + 4} className="axis-text">{value > 0 ? '+' : ''}{value.toFixed(1)}</text></g>)}
    {g.plotted.length > 1 && <path d={`${g.path} L ${g.plotted.at(-1)!.x} ${g.zero} L ${g.plotted[0].x} ${g.zero} Z`} fill="url(#sentiment-fill)" />}

    <path d={g.path} fill="none" stroke="url(#sentiment-stroke)" strokeWidth="2.6" strokeLinecap="round" />
    {g.eventPoints.map(({ event, x, y, label }, index) => <g key={event.id} role="button" tabIndex={0} aria-label={label} onClick={() => onSelect(event.date)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(event.date); } }} className="event-marker">
      <rect x={x - 10} y="3" width="20" height={g.bottom - 3} fill="transparent" />
      <line x1={x} x2={x} y1="28" y2={g.bottom} className={event.sentiment === 'negative' ? 'negative-event-line' : 'positive-event-line'} />
      <circle cx={x} cy="15" r="11" fill={event.sentiment === 'negative' ? '#f0e4dd' : '#e5edd9'} />
      <text x={x} y="18" textAnchor="middle" className={event.sentiment === 'negative' ? 'negative-event-label' : 'positive-event-label'}>{index + 1}</text>
      <circle cx={x} cy={y} r="5" fill="#f6f7f2" stroke={event.sentiment === 'negative' ? '#b55d51' : '#4f7a4b'} strokeWidth="2" />
      <title>{event.label} · {event.kind === 'reported' ? 'Reported / simulated response' : 'Illustrative'}</title>
    </g>)}
    {g.plotted.map(p => <circle key={p.date} cx={p.x} cy={p.y} r="8" fill="transparent" className="day-target" onClick={() => onSelect(p.date)}><title>{`${p.dateLabel}: ${p.scoreLabel}, ${p.countLabel}`}</title></circle>)}
    {showRecords && g.samples.map(({ record, x, y, title }) => <circle key={record.id} data-record-id={record.id} cx={x} cy={y} r={g.mobile ? 1.6 : 2.2} fill={record.score > .15 ? '#779d66' : record.score < -.15 ? '#c68f7e' : '#a8ad99'} opacity=".6" stroke="transparent" strokeWidth="7" className="record-dot" onClick={e => { e.stopPropagation(); onRecord(record); }}><title>{title}</title></circle>)}
    {g.ticks.map(tick => <text key={tick.ratio} x={tick.x} y={g.height - 5} textAnchor={tick.ratio === 0 ? 'start' : tick.ratio === 1 ? 'end' : 'middle'} className="axis-text">{tick.label}</text>)}
  </svg>;
});

export default memo(function SentimentChart({ points, selectedDate, onSelect, onRecord, showRecords, events }: {
  points: DayPoint[]; selectedDate: string; onSelect: (date: string) => void;
  onRecord: (record: SentimentRecord) => void; showRecords: boolean; events: HealthEvent[];
}) {
  const chartRef = useRef<HTMLDivElement>(null), hoverRef = useRef<HoverHandle>(null);
  const [width, setWidth] = useState(1120);
  const hasScoredPoints = points.some(p => p.score !== null);
  useEffect(() => {
    const element = chartRef.current; if (!element) return;
    const resize = () => setWidth(Math.max(300, Math.round(element.clientWidth)));
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => observer.disconnect();
  }, [hasScoredPoints]);
  const geometry = useMemo(() => chartGeometry(points, width, events), [points, width, events]);
  const selectedIndex = points.findIndex(p => p.date === selectedDate);
  const selectOffset = useCallback((amount: number) => { const index = points.findIndex(p => p.date === selectedDate); const point = points[Math.max(0, Math.min(points.length - 1, index + amount))]; if (point) onSelect(point.date); }, [points, selectedDate, onSelect]);
  const hover = useCallback((date: string) => hoverRef.current?.highlight(date), []);
  const leave = useCallback(() => hoverRef.current?.clear(), []);
  if (!points.length) return <div className="empty-state">No records match these filters. Try a different source, location, or search.</div>;
  if (!hasScoredPoints) return <>
    <div className="empty-state search-interest-notice" tabIndex={0} onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); selectOffset(e.key === 'ArrowLeft' ? -1 : 1); } }}>Search interest measures attention, not sentiment. These records show a 0–100 interest index in the conversation list below; they are excluded from sentiment scores and event-response curves.</div>
    <div className="chart-foot"><span>Browse weekly search-interest observations.</span><div className="day-navigation"><button className="icon-button" aria-label="Previous day" disabled={selectedIndex <= 0} onClick={() => selectOffset(-1)}><ArrowLeft size={14} /></button><span>{selectedDate ? formatDate(selectedDate) : 'Select a period'}</span><button className="icon-button" aria-label="Next day" disabled={selectedIndex >= points.length - 1} onClick={() => selectOffset(1)}><ArrowRight size={14} /></button></div></div>
  </>;
  return <>
    <div className="chart-toolbar"><div className="chart-legend"><span><i className="line-key" />Daily sentiment average</span>{showRecords && <span><i className="dot-key" />Sample scored records</span>}<span><i className="event-key" />Health events</span></div><span className="chart-hint"><MousePointer2 size={12} /> Click a point to explore</span></div>
    <div className="chart-container" ref={chartRef}>
      <StaticPlot geometry={geometry} showRecords={showRecords} onSelect={onSelect} onRecord={onRecord} onHover={hover} onLeave={leave} onKeyStep={selectOffset} />
      <HoverLayer ref={hoverRef} geometry={geometry} selectedDate={selectedDate} />
    </div>
    <div className="chart-foot"><span>Select a record dot to explore sentiment through its full text.</span><div className="day-navigation"><button className="icon-button" aria-label="Previous day" disabled={selectedIndex <= 0} onClick={() => selectOffset(-1)}><ArrowLeft size={14} /></button><span>{selectedDate ? formatDate(selectedDate) : 'Select a day'}</span><button className="icon-button" aria-label="Next day" disabled={selectedIndex >= points.length - 1} onClick={() => selectOffset(1)}><ArrowRight size={14} /></button></div></div>
  </>;
});
