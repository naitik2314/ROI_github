# Graph performance — local production comparison

Measured with the same `scripts/profile-chart.mjs` sequence in headless Chromium at a 1512 × 1000 viewport, against `next start`. Each run traversed all 90 plotted days three times (270 pointer samples), then performed the same 16 wheel-scroll steps. The fixtures were also corrected between runs, but the number of daily points and interaction sequence stayed the same.

| Measurement | Before | After |
| --- | ---: | ---: |
| Hover scripting CPU time | 3,405 ms | 60 ms |
| Hover total browser task time | 3,896 ms | 429 ms |
| Hover layout time | 27 ms | 27 ms |
| Scroll total browser task time | 580 ms | 11 ms |
| Scroll scripting CPU time | 27 ms | 2 ms |
| Date formatter constructions during interaction | 148,203 | 0 |
| Mutations to the plotted SVG during interaction | 1,092 | 0 |
| Frame interval, 95th percentile | 16.8 ms | 9.3 ms |
| Long tasks over 50 ms | 0 | 0 |

Hover scripting work decreased by approximately **98%** in this run. Frame timing depends on the host/display and synthetic input delivery; it is not a universal FPS or latency guarantee. The CPU and mutation counters are the primary evidence that the expensive hover work was removed.

The original hover state lived in the full chart component, reconstructing the curve, hundreds of record nodes, titles, and fresh `Intl.DateTimeFormat` objects on each point change. The optimized chart:

- Computes geometry and text once for a data/width change.
- Memoizes the static plotted SVG and stabilizes its callbacks.
- Renders hover/selection in a separate small overlay.
- Coalesces pointer movement with `requestAnimationFrame` and ignores touch hover.
- Uses shared date formatters and passive scroll cleanup.
- Memoizes dashboard aggregates and defers keyword filtering.

The production server serves the JSON dataset with gzip for clients that advertise support. The expanded 5.24 MB source-specific fixture compresses to approximately 333 KB with gzip; it is loaded once, not re-read during hover or scroll.

Reproduce with an existing Playwright installation:

```sh
npm run build
npm start -- --hostname 127.0.0.1 --port 3012
# In another terminal:
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/profile-chart.mjs
```

`PROFILE_OUTPUT=/absolute/path/result.json` optionally saves the measured counters. UI regression checks also assert that moving the pointer across plotted days does not mutate the plotted SVG, and verify that point selection, event markers, keyboard/period navigation, and record drill-down continue to work.
