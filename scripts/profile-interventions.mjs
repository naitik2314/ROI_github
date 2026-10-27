import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { library, local } from '../lib/interventions/catalog.ts';
import { createScenario } from '../lib/interventions/scenario.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/ho9307/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:3012';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 } });
  let catalogRequests = 0, simulationRequests = 0;
  page.on('request', request => {
    if (request.url().includes('/api/interventions/catalog')) catalogRequests++;
    if (request.url().includes('/api/interventions/simulate')) simulationRequests++;
  });
  await page.goto(base);
  await page.locator('.record-card').first().waitFor();
  assert.equal(catalogRequests, 0, 'Sentiment startup must not load the intervention catalog.');
  await page.getByRole('button', { name: 'Intervention studio', exact: true }).click();
  await page.getByRole('button', { name: 'Model Colorectal screening navigation', exact: true }).click();
  await page.getByTestId('modeled-cost').waitFor();
  const beforeCost = await page.getByTestId('modeled-cost').innerText();
  await page.evaluate(() => {
    window.interventionProfile = { longTasks: [], durations: [] };
    window.interventionObserver = new PerformanceObserver(list => {
      window.interventionProfile.longTasks.push(...list.getEntries().map(entry => entry.duration));
    });
    window.interventionObserver.observe({ type: 'longtask' });
  });
  await page.getByLabel('Staffing preview slider').focus();
  for (let index = 0; index < 32; index++) {
    const start = performance.now();
    await page.keyboard.press(index < 16 ? 'ArrowRight' : 'ArrowLeft');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(duration => window.interventionProfile.durations.push(duration), performance.now() - start);
  }
  assert.equal(await page.getByTestId('modeled-cost').innerText(), beforeCost, 'Returning the slider must restore the same preview.');
  assert.equal(simulationRequests, 0, 'Slider preview must not issue expensive simulation requests.');
  const preview = await page.evaluate(() => {
    window.interventionObserver.disconnect();
    const { durations, longTasks } = window.interventionProfile;
    durations.sort((a, b) => a - b);
    return { edits: durations.length, automationToTwoFramesP95Ms: +durations[Math.floor(durations.length * .95)].toFixed(1), longTaskCount: longTasks.length, longestTaskMs: +Math.max(0, ...longTasks).toFixed(1) };
  });
  const scenario = createScenario(library.interventions.find(item => item.id === 'crc-navigation'), library, local);
  scenario.draws = 10000;
  scenario.seed = 736428;
  const simulate = async () => {
    const start = performance.now();
    const response = await page.request.post(`${base}/api/interventions/simulate`, { data: { scenario }, headers: { Origin: base } });
    const body = await response.json();
    assert.ok(response.ok(), JSON.stringify(body));
    return { elapsedMs: +(performance.now() - start).toFixed(1), body };
  };
  const first = await simulate(), second = await simulate();
  assert.equal(second.body.cached, true);
  assert.deepEqual(first.body.simulation.metrics, second.body.simulation.metrics);
  await page.screenshot({ path: '/private/tmp/fieldwork-impact-final-desktop.png', fullPage: false });
  const report = {
    measuredAt: new Date().toISOString(), environment: 'Local production Next.js, Chromium, 1680×1050; timings are machine-specific.',
    sentimentStartupCatalogRequests: 0, previewSimulationRequests: simulationRequests, preview,
    simulation: { draws: 10000, serverDurationMs: first.body.simulation.durationMs, firstHttpMs: first.elapsedMs, cachedHttpMs: second.elapsedMs, cacheConfirmed: second.body.cached, responseBytes: Buffer.byteLength(JSON.stringify(first.body)) },
  };
  await writeFile(process.env.PROFILE_OUTPUT || 'docs/intervention-performance.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
