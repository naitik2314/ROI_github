import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { storageConfig } from './storage.ts';
import type { Library, LocalData, ModelResult, ObservedPeriod, ResearchRun, SavedScenario, Scenario, SimulationSummary } from './types.ts';

let opened: { path: string; db: DatabaseSync } | null = null;
export function database() {
  const { path } = storageConfig();
  if (opened?.path === path) return opened.db;
  if (opened) { opened.db.close(); opened = null; }
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS evidence_snapshots(hash TEXT PRIMARY KEY, library_version TEXT NOT NULL, local_version TEXT NOT NULL, created_at TEXT NOT NULL, content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scenario_versions(id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, version INTEGER NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL, hash TEXT NOT NULL, evidence_hash TEXT NOT NULL REFERENCES evidence_snapshots(hash), scenario TEXT NOT NULL, result TEXT NOT NULL, simulation TEXT, UNIQUE(scenario_id,version));
    CREATE TABLE IF NOT EXISTS programs(snapshot_id TEXT PRIMARY KEY REFERENCES scenario_versions(id), state TEXT NOT NULL CHECK(state IN ('PLANNED','LIVE','COMPLETED')));
    CREATE TABLE IF NOT EXISTS observations(id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL REFERENCES programs(snapshot_id), month INTEGER NOT NULL, content TEXT NOT NULL, UNIQUE(snapshot_id,month));
    CREATE TABLE IF NOT EXISTS research_runs(id TEXT PRIMARY KEY, intervention_id TEXT NOT NULL, searched_at TEXT NOT NULL, status TEXT NOT NULL, content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_events(id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, created_at TEXT NOT NULL, content TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS immutable_scenario_update BEFORE UPDATE ON scenario_versions BEGIN SELECT RAISE(ABORT,'Saved versions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_scenario_delete BEFORE DELETE ON scenario_versions BEGIN SELECT RAISE(ABORT,'Saved versions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_evidence_update BEFORE UPDATE ON evidence_snapshots BEGIN SELECT RAISE(ABORT,'Evidence snapshots are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_observation_update BEFORE UPDATE ON observations BEGIN SELECT RAISE(ABORT,'Observed periods are append-only'); END;`);
  opened = { path, db }; return db;
}
export function closeDatabase() { opened?.db.close(); opened = null; }
export const hashObject = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function audit(event: string, content: unknown) {
  const db = database();
  db.prepare('INSERT INTO audit_events(event,created_at,content) VALUES(?,?,?)').run(event, new Date().toISOString(), JSON.stringify(content));
  db.exec('DELETE FROM audit_events WHERE id NOT IN (SELECT id FROM audit_events ORDER BY id DESC LIMIT 1000)');
}
function decodeScenario(row: Record<string, unknown>): SavedScenario {
  return { id: String(row.id), scenarioId: String(row.scenario_id), version: Number(row.version), name: String(row.name), createdAt: String(row.created_at), createdBy: String(row.created_by), hash: String(row.hash), evidenceHash: String(row.evidence_hash), scenario: JSON.parse(String(row.scenario)), result: JSON.parse(String(row.result)), simulation: row.simulation ? JSON.parse(String(row.simulation)) : null };
}
export function listScenarios() { return database().prepare('SELECT * FROM scenario_versions ORDER BY created_at DESC,version DESC LIMIT 200').all().map(decodeScenario); }
export function getScenario(id: string) { const row = database().prepare('SELECT * FROM scenario_versions WHERE id=?').get(id); return row ? decodeScenario(row) : null; }
export function evidenceForScenario(s: Scenario, current: { library: Library; local: LocalData }): { library: Library; local: LocalData } {
  if (s.libraryVersion === current.library.version && s.localDataVersion === current.local.version) return current;
  const row = database().prepare('SELECT content FROM evidence_snapshots WHERE library_version=? AND local_version=? ORDER BY created_at DESC LIMIT 1').get(s.libraryVersion, s.localDataVersion);
  if (!row) throw new Error('Pinned evidence/data version is unavailable. Restore a saved version or explicitly initialize from current evidence.');
  return JSON.parse(String(row.content));
}
export function saveScenario(s: Scenario, result: ModelResult, simulation: SimulationSummary | null, library: Library, local: LocalData, parentId: string | null = null): SavedScenario {
  const db = database(), createdAt = new Date().toISOString(), createdBy = 'Local workspace analyst';
  const evidenceHash = hashObject({ library, local }), hash = hashObject({ scenario: s, result, simulation: simulation ? { ...simulation, durationMs: 0 } : null });
  const parent = parentId ? getScenario(parentId) : null;
  if (parentId && !parent) throw new Error('Parent snapshot does not exist.');
  const scenarioId = parent?.scenarioId ?? randomUUID(), id = randomUUID();
  db.exec('BEGIN IMMEDIATE');
  try {
    const version = Number(db.prepare('SELECT COALESCE(MAX(version),0)+1 AS version FROM scenario_versions WHERE scenario_id=?').get(scenarioId)!.version);
    db.prepare('INSERT OR IGNORE INTO evidence_snapshots VALUES(?,?,?,?,?)').run(evidenceHash, library.version, local.version, createdAt, JSON.stringify({ library, local }));
    db.prepare('INSERT INTO scenario_versions VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id, scenarioId, version, s.name, createdAt, createdBy, hash, evidenceHash, JSON.stringify(s), JSON.stringify(result), simulation ? JSON.stringify(simulation) : null);
    db.prepare('INSERT INTO programs VALUES(?,?)').run(id, 'PLANNED');
    db.exec('COMMIT');
    audit('scenario.saved', { id, scenarioId, version, hash, evidenceHash, modelVersion: s.modelVersion });
    return getScenario(id)!;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function getMonitor(snapshotId: string) {
  const row = database().prepare('SELECT state FROM programs WHERE snapshot_id=?').get(snapshotId);
  if (!row) throw new Error('Save a scenario before monitoring it.');
  const observations = database().prepare('SELECT content FROM observations WHERE snapshot_id=? ORDER BY month').all(snapshotId).map(r => JSON.parse(String(r.content)) as ObservedPeriod);
  return { state: String(row.state), observations };
}
export function setProgramState(snapshotId: string, state: string) {
  const previous = getMonitor(snapshotId).state;
  const order = ['PLANNED', 'LIVE', 'COMPLETED'];
  if (!order.includes(state) || order.indexOf(state) < order.indexOf(previous) || order.indexOf(state) > order.indexOf(previous) + 1) throw new Error('Programs move from PLANNED to LIVE to COMPLETED.');
  database().prepare('UPDATE programs SET state=? WHERE snapshot_id=?').run(state, snapshotId); audit('program.state', { snapshotId, previous, state }); return getMonitor(snapshotId);
}
export function addObservation(snapshotId: string, input: Omit<ObservedPeriod, 'id' | 'snapshotId' | 'createdAt'>) {
  const snapshot = getScenario(snapshotId), monitor = getMonitor(snapshotId);
  if (!snapshot || monitor.state !== 'LIVE') throw new Error('Only LIVE saved programs accept observations.');
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > snapshot.scenario.horizonYears * 12) throw new Error('Observation month must be inside the saved horizon.');
  for (const key of ['contacted', 'enrolled', 'completed'] as const) if (!Number.isInteger(input[key]) || input[key] < 0 || input[key] > 1e8) throw new Error('Contact, enrollment and completion must be nonnegative whole counts.');
  if (!Number.isFinite(input.spend) || input.spend < 0 || input.spend > 1e10 || input.completed > input.enrolled || input.enrolled > input.contacted) throw new Error('Check expenditure and contacted ≥ enrolled ≥ completed.');
  if (input.outcomes !== null && (!Number.isFinite(input.outcomes) || input.outcomes < 0 || input.outcomes > 1e10)) throw new Error('Invalid observed outcome.');
  if (input.fidelity !== null && (!Number.isFinite(input.fidelity) || input.fidelity < 0 || input.fidelity > 1)) throw new Error('Fidelity must be 0–1.');
  if (input.sentiment !== null && (!Number.isFinite(input.sentiment) || input.sentiment < -1 || input.sentiment > 1)) throw new Error('Sentiment must be −1 to +1.');
  if (typeof input.note !== 'string' || input.note.length > 2000) throw new Error('Use a note of at most 2,000 characters without patient identifiers.');
  const priorEnrollment = monitor.observations.reduce((n, row) => n + row.enrolled, 0);
  if (priorEnrollment + input.enrolled > snapshot.result.eligible) throw new Error('Unique cumulative enrollment exceeds the saved eligible cohort.');
  const observation: ObservedPeriod = { ...input, id: randomUUID(), snapshotId, createdAt: new Date().toISOString() };
  try { database().prepare('INSERT INTO observations VALUES(?,?,?,?)').run(observation.id, snapshotId, observation.month, JSON.stringify(observation)); }
  catch { throw new Error('This month is already recorded. Observations are append-only; use a new period.'); }
  audit('observation.added', { snapshotId, month: input.month }); return getMonitor(snapshotId);
}
export function storeResearch(run: ResearchRun) { database().prepare('INSERT INTO research_runs VALUES(?,?,?,?,?)').run(run.id, run.interventionId, run.searchedAt, run.status, JSON.stringify(run)); audit('research.' + run.status, { id: run.id, interventionId: run.interventionId, candidates: run.candidates.length }); }
export function researchRuns() { return database().prepare('SELECT content FROM research_runs ORDER BY searched_at DESC LIMIT 40').all().map(row => JSON.parse(String(row.content)) as ResearchRun); }
export function getResearchRun(id: string) { const row = database().prepare('SELECT content FROM research_runs WHERE id=?').get(id); return row ? JSON.parse(String(row.content)) as ResearchRun : null; }
export function integrityReport() { return { storage: storageConfig().status, quickCheck: database().prepare('PRAGMA quick_check').all(), foreignKeys: database().prepare('PRAGMA foreign_key_check').all(), snapshots: Number(database().prepare('SELECT COUNT(*) AS n FROM scenario_versions').get()!.n), observations: Number(database().prepare('SELECT COUNT(*) AS n FROM observations').get()!.n), audit: database().prepare('SELECT event,created_at,content FROM audit_events ORDER BY id DESC LIMIT 30').all() }; }
