import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/ho9307/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1512, height: 1000 } });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:3012');
  await page.locator('.record-card').first().waitFor();
  await page.locator('.sentiment-chart').scrollIntoViewIfNeeded();
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  await page.evaluate(() => {
    window.chartProfile = { longTasks: [], frames: [], mutations: 0, formatterCalls: 0, last: 0, running: true };
    const NativeFormatter = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(...args) { window.chartProfile.formatterCalls++; return new NativeFormatter(...args); };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.chartProfile.longTasks.push(entry.duration); }).observe({ type: 'longtask' });
    new MutationObserver(entries => { window.chartProfile.mutations += entries.length; }).observe(document.querySelector('.sentiment-chart'), { subtree: true, childList: true, attributes: true, characterData: true });
    const frame = now => { const p = window.chartProfile; if (!p.running) return; if (p.last) p.frames.push(now - p.last); p.last = now; requestAnimationFrame(frame); }; requestAnimationFrame(frame);
  });
  const readMetrics = async () => Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const before = await readMetrics();
  const points = await page.locator('.day-target').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  for (let round = 0; round < 3; round++) for (const point of (round % 2 ? [...points].reverse() : points)) await page.mouse.move(point.x, point.y);
  const middle = await readMetrics();
  const svg = await page.locator('.sentiment-chart').boundingBox();
  await page.mouse.move(svg.x + svg.width / 2, svg.y + svg.height / 2);
  for (let i = 0; i < 16; i++) {
    await page.mouse.wheel(0, i < 8 ? 45 : -45);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  const after = await readMetrics();
  const profile = await page.evaluate(() => { const p = window.chartProfile; p.running = false; const frames = p.frames.sort((a, b) => a - b); return { formatterCalls: p.formatterCalls, svgMutations: p.mutations, longTaskCount: p.longTasks.length, longestTaskMs: Math.round(Math.max(0, ...p.longTasks)), frameP95Ms: Number((frames[Math.floor(frames.length * .95)] ?? 0).toFixed(1)), frameCount: frames.length }; });
  const deltaMs = (a, b, field) => Math.round((a[field] - b[field]) * 1000);
  const result = { mode: process.env.PROFILE_LABEL || 'production', hoverSamples: points.length * 3, hoverTaskMs: deltaMs(middle, before, 'TaskDuration'), hoverScriptMs: deltaMs(middle, before, 'ScriptDuration'), hoverLayoutMs: deltaMs(middle, before, 'LayoutDuration'), scrollTaskMs: deltaMs(after, middle, 'TaskDuration'), scrollScriptMs: deltaMs(after, middle, 'ScriptDuration'), ...profile };
  console.log(JSON.stringify(result, null, 2));
  if (process.env.PROFILE_OUTPUT) writeFileSync(process.env.PROFILE_OUTPUT, JSON.stringify(result, null, 2));
} finally { await browser.close(); }
