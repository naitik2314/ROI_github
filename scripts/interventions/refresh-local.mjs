import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { feature } from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';
const root = new URL('../../', import.meta.url);
const output = new URL('content/interventions/local-data.json', root);
const checkedAt = process.env.FIELDWORK_RETRIEVED_AT || new Date().toISOString();
const dataset = 'swc5-untb';
const selected = new Set(['BPHIGH', 'COLON_SCREEN', 'MAMMOUSE', 'DEPRESSION', 'CSMOKING', 'LACKTRPT', 'ACCESS2', 'CHECKUP', 'FOODINSECU', 'CASTHMA']);
async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Data retrieval failed (${response.status}); previous verified snapshot retained.`);
  const data = await response.json();
  if (!Array.isArray(data) && typeof data !== 'object') throw new Error('Invalid response');
  return data;
}
const raw = process.env.FIELDWORK_PLACES_FILE ? JSON.parse(await readFile(process.env.FIELDWORK_PLACES_FILE, 'utf8')) : await getJson(`https://data.cdc.gov/resource/${dataset}.json?${new URLSearchParams({ '$where': "stateabbr='MI' AND data_value_type='Crude prevalence'", '$limit': '5000', '$order': 'locationid,measureid' })}`);
if (!Array.isArray(raw)) throw new Error('Expected PLACES records.');
const sourceId = 'cdc-places-2025';
const counties = new Map();
for (const row of raw) {
  if (!selected.has(row.measureid)) continue;
  if (row.stateabbr !== 'MI' || row.data_value_type !== 'Crude prevalence' || !/^26\d{3}$/.test(row.locationid)) throw new Error('Wrong population/geography');
  const value = Number(row.data_value), low = Number(row.low_confidence_limit), high = Number(row.high_confidence_limit);
  if (![value, low, high].every(Number.isFinite) || low < 0 || high > 100 || low > value || value > high) throw new Error('Invalid prevalence/interval');
  if (!counties.has(row.locationid)) counties.set(row.locationid, { fips: row.locationid, name: row.locationname, total: Number(row.totalpopulation), adults: Number(row.totalpop18plus), populationYear: 'Denominator supplied with PLACES 2025; reference year not specified in API row', longitude: row.geolocation.coordinates[0], latitude: row.geolocation.coordinates[1], metrics: [] });
  counties.get(row.locationid).metrics.push({ id: row.measureid, value, low, high, year: Number(row.year), definition: row.measure, unit: '%', status: 'MODELED', sourceId });
}
if (counties.size !== 83 || [...counties.values()].some(c => c.total <= c.adults || c.adults <= 0 || c.metrics.length !== selected.size)) throw new Error('Incomplete Michigan snapshot; previous snapshot retained.');
const connectors = [{ id: 'places', name: 'CDC PLACES county 2025', status: 'Connected', reason: '83 Michigan counties; crude modeled prevalence and published intervals.', url: `https://data.cdc.gov/d/${dataset}` }, { id: 'acs', name: 'Census ACS 2024 5-year', status: 'API key required', reason: 'Unauthenticated endpoint returned Missing Key. Set CENSUS_API_KEY before refreshing.', url: 'https://api.census.gov/data/2024/acs/acs5/examples.html' }, { id: 'bls', name: 'BLS / Michigan OEWS May 2025', status: 'Manual source review', reason: 'BLS automated retrieval returned 403; no local wage quote substituted.', url: 'https://www.michigan.gov/mcda/labor-market-information/oews' }];
let acs = null;
if (process.env.CENSUS_API_KEY) {
  try {
    const variables = ['NAME', 'B01001_001E', 'B01001_001M', 'B17001_001E', 'B17001_002E'];
    for (const n of [3, 4, 5, 6, 27, 28, 29, 30]) variables.push(`B01001_${String(n).padStart(3, '0')}E`);
    const url = new URL('https://api.census.gov/data/2024/acs/acs5');
    url.search = new URLSearchParams({ get: variables.join(','), for: 'county:*', in: 'state:26', key: process.env.CENSUS_API_KEY });
    const data = await getJson(url);
    if (!Array.isArray(data) || data.length !== 84) throw new Error('Invalid ACS response');
    const headers = data[0];
    acs = data.slice(1).map(row => Object.fromEntries(headers.map((key, i) => [key, row[i]])));
    connectors[1].status = 'Connected'; connectors[1].reason = '83 county demographic/poverty rows retrieved. Retained separately; PLACES denominator remains pinned.';
  } catch { connectors[1].status = 'Refresh failed'; connectors[1].reason = 'ACS retrieval failed validation; check credentials/source availability. Existing county model retained.'; }
}
const sorted = [...counties.values()].sort((a, b) => a.name.localeCompare(b.name));
const checksum = createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 12);
const local = { version: `places-2025-mi-${checksum}`, retrievedAt: checkedAt, source: { id: sourceId, title: 'PLACES: Local Data for Better Health, County Data, 2025 release', url: `https://data.cdc.gov/d/${dataset}`, publisher: 'Centers for Disease Control and Prevention', retrievedAt: checkedAt, year: 2025, version: dataset, license: 'Public federal data; cite CDC PLACES. Small-area modeled estimates, not patient records.', cutoff: 'Measurement years vary by measure (2022–2023 in this subset).' }, counties: sorted, connectors, acs };
const topology = process.env.FIELDWORK_TOPOLOGY_FILE ? JSON.parse(await readFile(process.env.FIELDWORK_TOPOLOGY_FILE, 'utf8')) : await getJson('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
const michigan = feature(topology, topology.objects.counties).features.filter(f => String(f.id).startsWith('26'));
if (michigan.length !== 83) throw new Error('Expected 83 Michigan county shapes');
const collection = { type: 'FeatureCollection', features: michigan };
const projection = geoMercator().fitExtent([[12, 12], [608, 508]], collection);
const path = geoPath(projection).digits(2);
const geometry = { viewBox: '0 0 620 520', source: 'US Atlas 3 counties-10m; Census-derived generalized county boundaries', url: 'https://github.com/topojson/us-atlas', vintage: '2017 generalized Census boundaries via US Atlas 3', license: 'ISC; original geography public-domain Census. For thematic display, not routing.', retrievedAt: checkedAt, counties: michigan.map(f => ({ fips: String(f.id), name: counties.get(String(f.id)).name, path: path(f), centroid: path.centroid(f).map(n => Math.round(n * 100) / 100) })) };
await mkdir(new URL('public/data/interventions/', root), { recursive: true });
await writeFile(output, JSON.stringify(local, null, 2) + '\n');
await writeFile(new URL('public/data/interventions/michigan-map.json', root), JSON.stringify(geometry));
console.log(`Verified ${sorted.length} counties, ${sorted.reduce((n, c) => n + c.metrics.length, 0)} measures. Version ${local.version}.`);
