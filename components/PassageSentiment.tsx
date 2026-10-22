'use client';

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { analyzePassages, textFeeling } from '@/lib/passageSentiment';
import { formatScore, labelSentiment } from '@/lib/sentiment';

export default memo(function PassageSentiment({ text, timelineScore }: { text: string; timelineScore: number }) {
  const { passages, overall } = useMemo(() => analyzePassages(text), [text]);
  const [pinned, setPinned] = useState<number | null>(null), [hovered, setHovered] = useState<number | null>(null);
  const [width, setWidth] = useState(760);
  const graphRef = useRef<HTMLDivElement>(null), frame = useRef(0);
  const gradientId = useId().replaceAll(':', '');
  useEffect(() => {
    const element = graphRef.current; if (!element) return;
    const resize = () => setWidth(Math.max(280, Math.round(element.clientWidth)));
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); };
  }, []);
  const height = width < 500 ? 245 : 245, left = 44, right = width - 18, top = 20, bottom = height - 28, zero = (top + bottom) / 2;
  const geometry = useMemo(() => {
    const points = passages.map((p, index) => ({ x: passages.length === 1 ? (left + right) / 2 : left + index / (passages.length - 1) * (right - left), y: zero - p.score * (bottom - top) / 2 }));
    if (!points.length) return { points, path: '' };
    if (points.length === 1) return { points, path: `M ${left} ${points[0].y} L ${right} ${points[0].y}` };
    const delta = points.slice(1).map((p, index) => (p.y - points[index].y) / (p.x - points[index].x));
    const slopes = points.map((_, index) => index === 0 ? delta[0] : index === points.length - 1 ? delta.at(-1)! : delta[index - 1] * delta[index] <= 0 ? 0 : 2 / (1 / delta[index - 1] + 1 / delta[index]));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index++) { const a = points[index], b = points[index + 1], step = (b.x - a.x) / 3; path += ` C ${a.x + step} ${a.y + slopes[index] * step}, ${b.x - step} ${b.y - slopes[index + 1] * step}, ${b.x} ${b.y}`; }
    return { points, path };
  }, [passages, left, right, zero, bottom, top]);
  const active = hovered ?? pinned, score = active === null ? overall : passages[active].score;
  const reset = () => { cancelAnimationFrame(frame.current); frame.current = 0; setHovered(null); setPinned(null); };
  const select = (index: number) => { if (!passages.length) return; setPinned(index); setHovered(null); };
  const step = (amount: number) => select(Math.max(0, Math.min(passages.length - 1, (active ?? (amount > 0 ? -1 : passages.length)) + amount)));
  const nearest = (clientX: number, element: SVGSVGElement) => {
    const bounds = element.getBoundingClientRect(), x = (clientX - bounds.left) * width / bounds.width;
    return passages.length <= 1 ? 0 : Math.max(0, Math.min(passages.length - 1, Math.round((x - left) / (right - left) * (passages.length - 1))));
  };
  const paragraphIds = [...new Set(passages.map(p => p.paragraph))];
  return <section className="passage-reader" aria-label="Sentiment in the selected text">
    <div className="passage-hero"><div className={`passage-score ${labelSentiment(score)}`} aria-live="off">{formatScore(score)}</div><div className="passage-score-caption"><span className={`sentiment-pill ${labelSentiment(score)}`}><i />{textFeeling(score)}</span><span>{active === null ? 'Full paragraph' : `Passage ${active + 1} of ${passages.length}`}</span></div><p>Hover to explore. Click a passage to keep it selected.</p></div>
    <div className="passage-heading"><h3>The emotional arc</h3><span>Explore the line or select a passage below</span></div>
    <div className="passage-graph" ref={graphRef}>
      <svg viewBox={`0 0 ${width} ${height}`} role="slider" tabIndex={0} aria-label="Passage sentiment journey" aria-valuemin={1} aria-valuemax={Math.max(1, passages.length)} aria-valuenow={(active ?? 0) + 1} aria-valuetext={active === null ? `Full paragraph: ${formatScore(overall)}. Use arrow keys to explore passages.` : `Passage ${active + 1}: ${formatScore(score)}. ${passages[active].text}`} onFocus={() => { if (active === null && passages.length) setHovered(0); }}
        onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); if (e.key === 'Escape') reset(); else if (e.key === 'Home') select(0); else if (e.key === 'End') select(passages.length - 1); else if (e.key === 'Enter' || e.key === ' ') select(active ?? 0); else step(e.key === 'ArrowRight' ? 1 : -1); } }}
        onPointerMove={e => { if (e.pointerType === 'touch' || frame.current || !passages.length) return; const clientX = e.clientX, element = e.currentTarget; frame.current = requestAnimationFrame(() => { frame.current = 0; setHovered(nearest(clientX, element)); }); }}
        onPointerLeave={() => { cancelAnimationFrame(frame.current); frame.current = 0; setHovered(null); }} onClick={e => { if (passages.length) select(nearest(e.clientX, e.currentTarget)); }}>
        <defs><linearGradient id={`line-${gradientId}`} x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#28764b" /><stop offset=".47" stopColor="#a1b27f" /><stop offset=".53" stopColor="#c7a690" /><stop offset="1" stopColor="#b85d52" /></linearGradient><linearGradient id={`area-${gradientId}`} x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#9bbb74" stopOpacity=".25" /><stop offset=".5" stopColor="#d9dec9" stopOpacity=".02" /><stop offset="1" stopColor="#c67d67" stopOpacity=".22" /></linearGradient></defs>
        {[1, .5, 0, -.5, -1].map(value => { const y = zero - value * (bottom - top) / 2; return <g key={value}><line x1={left} x2={right} y1={y} y2={y} className={value === 0 ? 'zero-line' : 'grid-line'} /><text x="0" y={y + 5} className="axis-text">{value > 0 ? '+' : ''}{value.toFixed(1)}</text></g>; })}
        {geometry.points.length > 0 && <path d={`${geometry.path} L ${geometry.points.at(-1)!.x} ${zero} L ${geometry.points[0].x} ${zero} Z`} fill={`url(#area-${gradientId})`} />}
        <path d={geometry.path} fill="none" stroke={`url(#line-${gradientId})`} strokeWidth="3" strokeLinecap="round" />
        {geometry.points.map((point, index) => <g key={index} className="passage-plot-point"><circle cx={point.x} cy={point.y} r="12" fill="transparent" /><circle cx={point.x} cy={point.y} r={active === index ? 7 : 4} fill={passages[index].score < -.15 ? '#b85d52' : passages[index].score > .15 ? '#36714d' : '#7c8865'} stroke="#f6f7f2" strokeWidth="2" /></g>)}
        {active !== null && geometry.points[active] && <line x1={geometry.points[active].x} x2={geometry.points[active].x} y1={top} y2={bottom} stroke="#8d9e7d" strokeDasharray="3 5" pointerEvents="none" />}
      </svg>
      <div className="passage-chart-labels"><span>Beginning</span><span>Your words, in sequence</span><span>End</span></div>
    </div>
    <div className="passage-legend"><span>Negative</span><i /><span>Positive</span></div>
    <div className="passage-reading" aria-label="Paragraph with passage-level sentiment">{paragraphIds.map(paragraph => <p key={paragraph}>{passages.map((passage, index) => passage.paragraph === paragraph ? <span key={index}><span role="button" tabIndex={0} className={`passage-text ${labelSentiment(passage.score)} ${active === index ? 'active' : ''}`} data-passage-index={index} aria-label={`Passage ${index + 1}: ${passage.text} Sentiment ${formatScore(passage.score)}`} aria-pressed={pinned === index} onPointerEnter={e => { if (e.pointerType !== 'touch') setHovered(index); }} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onClick={() => select(index)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(index); } }}>{passage.text}</span>{' '}</span> : null)}</p>)}</div>
    <div className="passage-controls"><button className="text-button" onClick={reset}><RotateCcw size={16} />Read full paragraph</button><div><button className="icon-button" aria-label="Previous passage" disabled={!passages.length || active === 0} onClick={() => step(-1)}><ArrowLeft size={18} /></button><span>{active === null ? 'Paragraph' : `${active + 1} / ${passages.length}`}</span><button className="icon-button" aria-label="Next passage" disabled={!passages.length || active === passages.length - 1} onClick={() => step(1)}><ArrowRight size={18} /></button></div></div>
    <div className="passage-method"><span>Timeline score <strong>{formatScore(timelineScore)}</strong></span><span>Passage readings use local text analysis.</span></div>
  </section>;
});
