import { randomUUID } from 'node:crypto';
import type { Intervention, ResearchCandidate, ResearchRun } from './types.ts';

export function extractCandidates(text: string): ResearchCandidate['extracted'] {
  const pattern = /\b(risk ratio|relative risk|odds ratio|hazard ratio|RR|OR|HR)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*[,;(]?\s*(?:95%?\s*(?:CI|confidence interval)\s*[:=]?\s*)?\(?\s*(\d+(?:\.\d+)?)\s*(?:to|[–−-]|,)\s*(\d+(?:\.\d+)?)/gi;
  return [...text.matchAll(pattern)].slice(0, 12).flatMap(match => {
    const estimate = Number(match[2]), low = Number(match[3]), high = Number(match[4]);
    return low > 0 && low <= estimate && estimate <= high ? [{ measure: match[1], estimate, low, high, context: text.slice(Math.max(0, (match.index ?? 0) - 120), (match.index ?? 0) + match[0].length + 120), reviewRequired: true as const }] : [];
  });
}
export function deduplicateResearch(rows: ResearchCandidate[]) {
  const seen = new Set<string>(), excluded: { id: string; reason: string }[] = [], included: ResearchCandidate[] = [];
  for (const row of rows) {
    const key = row.doi?.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '') || row.pmid || row.title.toLowerCase().replace(/\W/g, '');
    if (seen.has(key)) excluded.push({ id: row.id, reason: 'Duplicate DOI, PMID or normalized publication title.' });
    else { seen.add(key); included.push(row); }
  }
  return { included, excluded };
}
export async function researchIntervention(intervention: Intervention): Promise<ResearchRun> {
  const run: ResearchRun = { id: randomUUID(), interventionId: intervention.id, query: intervention.searchQuery, searchedAt: new Date().toISOString(), source: 'Europe PMC REST; MED-indexed publications', status: 'completed', error: null, candidates: [], excluded: [] };
  try {
    const url = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search');
    url.search = new URLSearchParams({ query: `SRC:MED AND (${intervention.searchQuery})`, format: 'json', resultType: 'core', pageSize: '25', sort_date: 'y' }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Europe PMC returned HTTP ${response.status}.`);
    const body = await response.text();
    if (body.length > 3000000) throw new Error('Research response exceeds the review limit.');
    const data = JSON.parse(body);
    if (!Array.isArray(data.resultList?.result)) throw new Error('Invalid evidence response.');
    const rows: ResearchCandidate[] = data.resultList.result.map((row: Record<string, unknown>) => {
      const abstract = String(row.abstractText ?? '').replace(/<[^>]*>/g, ' ').slice(0, 18000);
      const pmid = /^\d+$/.test(String(row.pmid ?? row.id)) ? String(row.pmid ?? row.id) : null;
      const doi = typeof row.doi === 'string' && /^10\.\d{4,9}\/\S+$/i.test(row.doi) ? row.doi : null;
      const trial = abstract.match(/\bNCT\d{8}\b/i)?.[0].toUpperCase();
      const types = (row.pubTypeList as { pubType?: unknown[] } | undefined)?.pubType ?? [];
      return { id: `MED:${String(row.id).slice(0, 100)}`, title: String(row.title ?? 'Untitled record').slice(0, 700), year: String(row.pubYear ?? ''), doi, pmid, pmcid: typeof row.pmcid === 'string' && /^PMC\d+$/.test(row.pmcid) ? row.pmcid : null,
        studyGroup: trial || (doi ? `DOI:${doi}` : `PMID:${pmid ?? String(row.id)}`), types: types.map(String).slice(0, 10), source: 'Europe PMC', url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : doi ? `https://doi.org/${doi}` : 'https://europepmc.org/', abstract, reviewState: 'pending', extracted: extractCandidates(abstract) };
    });
    const dedup = deduplicateResearch(rows); run.candidates = dedup.included; run.excluded = dedup.excluded;
  } catch (error) { run.status = 'failed'; run.error = error instanceof Error ? error.message : 'Evidence retrieval failed.'; }
  return run;
}
