import Link from 'next/link';
import { notFound } from 'next/navigation';
import { storageConfig } from '@/lib/interventions/storage';
import { getScenario, evidenceForScenario } from '@/lib/interventions/store';
import { library, local } from '@/lib/interventions/catalog';
import { DecisionBrief } from '@/components/interventions/ReferenceViews';
import PrintBrief from '@/components/interventions/PrintBrief';
import '@/components/interventions/studio.css';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, snapshot = getScenario(id);
  if (!snapshot) notFound();
  const { status: storage } = storageConfig();
  const context = evidenceForScenario(snapshot.scenario, { library, local });
  return <main className="standalone-brief"><Link className="brief-back" href="/">← Back to Fieldwork</Link><PrintBrief /><div className="impact-studio">{storage.notice && <p className="studio-storage-notice"><strong>{storage.label}.</strong> {storage.notice}</p>}<p className="studio-caption">Immutable version {snapshot.version} · saved {snapshot.createdAt} · {snapshot.createdBy}</p><DecisionBrief scenario={snapshot.scenario} result={snapshot.result} summary={snapshot.simulation} library={context.library} local={context.local} /><p className="studio-caption">Snapshot hash: {snapshot.hash}<br />Evidence snapshot: {snapshot.evidenceHash}</p></div></main>;
}
