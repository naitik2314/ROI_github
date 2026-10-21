'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MousePointer2 } from 'lucide-react';
import { DayPoint, HealthEvent, SentimentRecord, formatDate, formatScore } from '@/lib/sentiment';

export default function SentimentChart({ points, selectedDate, onSelect, onRecord, showRecords, events }: {
  points: DayPoint[]; selectedDate: string; onSelect: (date: string) => void;
  onRecord: (record: SentimentRecord) => void; showRecords: boolean; events: HealthEvent[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1120);
  const hasPoints = points.length > 0;
  useEffect(() => {
    const element = chartRef.current; if (!element) return;
    const resize = () => setWidth(Math.max(300, Math.round(element.clientWidth)));
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => observer.disconnect();
  }, [hasPoints]);
  const mobile = width < 600;
  const height = mobile ? 300 : 380, left = 48, right = width - 14, top = 38, bottom = height - 52, zero = (top + bottom) / 2;
  const first = points[0]?.date ?? '2026-07-23', last = points.at(-1)?.date ?? '2026-10-20';
  const duration = Math.max(86400000, Date.parse(last) - Date.parse(first));
  const x = (date: string) => left + (Date.parse(date) - Date.parse(first)) / duration * (right - left);
  const y = (score: number) => zero - score * (bottom - top) / 2;
  const plotted = points.map(p => ({ ...p, x: x(p.date), y: y(p.score) }));
  // Monotone cubic interpolation adapted from the supplied sentiment UI.
  let path = plotted.length ? `M ${plotted[0].x} ${plotted[0].y}` : '';
  const delta = plotted.slice(1).map((p, i) => (p.y - plotted[i].y) / (p.x - plotted[i].x));
  const slopes = plotted.map((_, i) => i === 0 ? delta[0] ?? 0 : i === plotted.length - 1 ? delta.at(-1) ?? 0 : delta[i - 1] * delta[i] <= 0 ? 0 : 2 / (1 / delta[i - 1] + 1 / delta[i]));
  for (let i = 0; i < plotted.length - 1; i++) {
    const a = plotted[i], b = plotted[i + 1], h = (b.x - a.x) / 3;
    path += ` C ${a.x + h} ${a.y + slopes[i] * h}, ${b.x - h} ${b.y - slopes[i + 1] * h}, ${b.x} ${b.y}`;
  }
  const samples = useMemo(() => points.flatMap(p => p.records.filter((_, i) => i % Math.max(1, Math.ceil(p.count / 5)) === 0).slice(0, 5)), [points]);
  const active = plotted.find(p => p.date === (hovered ?? selectedDate));
  const eventPoints = events.flatMap(event => { const point = plotted.find(p => p.date === event.date); return point ? [{ ...point, event }] : []; });
  const selectedIndex = points.findIndex(p => p.date === selectedDate);
  const selectOffset = (amount: number) => { const point = points[Math.max(0, Math.min(points.length - 1, selectedIndex + amount))]; if (point) onSelect(point.date); };
  if (!points.length) return <div className="empty-state">No records match these filters. Try a different source, location, or search.</div>;
  return <>
    <div className="chart-toolbar"><div className="chart-legend"><span><i className="line-key" />Daily average</span>{showRecords && <span><i className="dot-key" />Sample records</span>}<span><i className="event-key" />Health events</span></div><span className="chart-hint"><MousePointer2 size={12} /> Click a point to explore</span></div>
    <div className="chart-container" ref={chartRef}>
      <svg viewBox={`0 0 ${width} ${height}`} className="sentiment-chart" role="group" aria-label="Daily sentiment from minus one to plus one. Use left and right arrow keys to select a day; click a record dot for details." tabIndex={0}
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); selectOffset(e.key === 'ArrowLeft' ? -1 : 1); } }} onPointerLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="sentiment-stroke" x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#28764b" /><stop offset="46%" stopColor="#618260" /><stop offset="52%" stopColor="#b57966" /><stop offset="100%" stopColor="#b7554d" /></linearGradient>
          <linearGradient id="sentiment-fill" x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#adc494" stopOpacity=".22" /><stop offset="50%" stopColor="#adc494" stopOpacity="0" /><stop offset="100%" stopColor="#c87969" stopOpacity=".18" /></linearGradient>
        </defs>
        {[1, .5, 0, -.5, -1].map(value => <g key={value}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className={value === 0 ? 'zero-line' : 'grid-line'} /><text x="0" y={y(value) + 4} className="axis-text">{value > 0 ? '+' : ''}{value.toFixed(1)}</text></g>)}
        <text x={right} y={top - 15} textAnchor="end" className="axis-description">POSITIVE</text><text x={right} y={bottom + 17} textAnchor="end" className="axis-description">NEGATIVE</text>
        {plotted.length > 1 && <path d={`${path} L ${plotted.at(-1)!.x} ${zero} L ${plotted[0].x} ${zero} Z`} fill="url(#sentiment-fill)" />}
        {showRecords && samples.map((record, i) => <circle key={record.id} cx={Math.max(left, Math.min(right, x(record.date) + ((i % 3) - 1) * 2))} cy={y(record.score)} r={mobile ? 1.6 : 2.2} fill={record.score > .15 ? '#779d66' : record.score < -.15 ? '#c68f7e' : '#a8ad99'} opacity=".43" className="record-dot" onClick={e => { e.stopPropagation(); onRecord(record); }}><title>{`${formatDate(record.date)} · ${formatScore(record.score)} · ${record.topic}. Click to read this synthetic record.`}</title></circle>)}
        <path d={path} fill="none" stroke="url(#sentiment-stroke)" strokeWidth="2.6" strokeLinecap="round" />
        {eventPoints.map(({ event, x: eventX, y: eventY }, index) => <g key={event.id} role="button" tabIndex={0} aria-label={`${formatDate(event.date)}: ${event.label}. ${event.kind === 'reported' ? 'Reported event, simulated response' : 'Illustrative event'}.`} onClick={() => onSelect(event.date)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(event.date); } }} className="event-marker">
          <rect x={eventX - 10} y="3" width="20" height={bottom - 3} fill="transparent" />
          <line x1={eventX} x2={eventX} y1="28" y2={bottom} className={event.sentiment === 'negative' ? 'negative-event-line' : 'positive-event-line'} />
          <circle cx={eventX} cy="15" r="11" fill={event.sentiment === 'negative' ? '#f0e4dd' : '#e5edd9'} />
          <text x={eventX} y="18" textAnchor="middle" className={event.sentiment === 'negative' ? 'negative-event-label' : 'positive-event-label'}>{index + 1}</text>
          <circle cx={eventX} cy={eventY} r="5" fill="#f6f7f2" stroke={event.sentiment === 'negative' ? '#b55d51' : '#4f7a4b'} strokeWidth="2" />
          <title>{event.label} · {event.kind === 'reported' ? 'Reported / simulated response' : 'Illustrative'}</title>
        </g>)}
        {plotted.map(p => <circle key={p.date} cx={p.x} cy={p.y} r="8" fill="transparent" className="day-target" onPointerEnter={() => setHovered(p.date)} onClick={() => onSelect(p.date)}><title>{`${formatDate(p.date)}: ${formatScore(p.score)}, ${p.count} records`}</title></circle>)}
        {active && <g pointerEvents="none"><line x1={active.x} x2={active.x} y1={top} y2={bottom} stroke="#9b9f8f" strokeDasharray="2 5" opacity=".5" /><circle cx={active.x} cy={active.y} r="5" fill={active.score < -.15 ? '#b55d51' : '#4f7a4b'} stroke="#f6f7f2" strokeWidth="2" /></g>}
        {(mobile ? [0, 1 / 3, 2 / 3, 1] : [0, .2, .4, .6, .8, 1]).map(ratio => { const stamp = new Date(Date.parse(first) + duration * ratio).toISOString().slice(0, 10); return <text key={ratio} x={left + (right - left) * ratio} y={height - 5} textAnchor={ratio === 0 ? 'start' : ratio === 1 ? 'end' : 'middle'} className="axis-text">{formatDate(stamp)}</text>; })}
      </svg>
      {hovered && active && <div className="chart-tooltip" style={{ left: `${Math.min(83, Math.max(9, active.x / width * 100))}%`, top: `${Math.max(12, Math.min(67, active.y / height * 100 - 17))}%` }}><span>{formatDate(active.date)}</span><strong>{formatScore(active.score)}</strong><small>{active.count} synthetic records</small></div>}
    </div>
    <div className="chart-foot"><span>Events are examples within overall health sentiment · all scores and volumes are synthetic</span><div className="day-navigation"><button className="icon-button" aria-label="Previous day" disabled={selectedIndex <= 0} onClick={() => selectOffset(-1)}><ArrowLeft size={14} /></button><span>{selectedDate ? formatDate(selectedDate) : 'Select a day'}</span><button className="icon-button" aria-label="Next day" disabled={selectedIndex >= points.length - 1} onClick={() => selectOffset(1)}><ArrowRight size={14} /></button></div></div>
  </>;
}
