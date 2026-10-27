'use client';

import { ExternalLink, X } from 'lucide-react';
import PassageSentiment from './PassageSentiment';
import { HEALTH_EVENTS, SOURCES, SentimentRecord, formatDate, hasSentiment } from '@/lib/sentiment';

export default function RecordDetail({ record, onClose }: { record: SentimentRecord; onClose: () => void }) {
  const event = HEALTH_EVENTS.find(event => event.id === record.eventId);
  return <div className="record-backdrop" onClick={onClose}>
    <section className="selected-record record-drawer record-lens" role="dialog" aria-modal="true" aria-labelledby="record-title" onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key !== 'Tab') return;
        const focusable = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary, [tabindex="0"]')].filter(element => element.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }}>
      <div className="record-lens-header"><div><span className="eyebrow">BEHIND THE SIGNAL</span><h2 id="record-title">Sentiment in context</h2></div><button autoFocus className="icon-button" aria-label="Close selected record" onClick={onClose}><X size={22} /></button></div>
      <div className="record-lens-meta"><span>{SOURCES.find(source => source.id === record.source)?.label}</span><i /><span>{record.location}</span><i /><span>{formatDate(record.date, true)}</span></div>
      {hasSentiment(record) ? <PassageSentiment text={record.text} timelineScore={record.score} /> : <>
        <div className="drawer-metric"><span className="record-detail-score interest-score">{record.interestIndex}/100</span><div><strong>Search-interest index</strong><small>Weekly index · not sentiment</small></div></div>
        <p className="search-record-text">{record.text}</p><p className="muted-text">Interest is normalized within this query and county. It is not an opinion or sentiment score.</p>
      </>}
      <details className="record-provenance"><summary>Source details & methodology</summary><dl className="record-facts"><div><dt>Record</dt><dd>{record.id}</dd></div><div><dt>Source</dt><dd>{record.sourceName}</dd></div><div><dt>Topic</dt><dd>{record.topic}</dd></div>{record.county && <div><dt>County</dt><dd>{record.county}</dd></div>}</dl><div className="source-context">{record.sourceContext}</div>{hasSentiment(record) && <p className="passage-analysis-note">The full-paragraph view retains this record’s assigned timeline score. Selecting a passage shows a separate local text reading using a sentiment lexicon with negation and intensity handling, adapted from the supplied reference. Passage readings do not modify the timeline score or constitute validated clinical analysis.</p>}</details>
      {event && <div className="drawer-event"><span className="eyebrow">LINKED HEALTH EVENT</span><h3>{event.label}</h3>{event.url && <a href={event.url} target="_blank" rel="noreferrer">Read source report<ExternalLink size={14} /></a>}</div>}
    </section>
  </div>;
}
