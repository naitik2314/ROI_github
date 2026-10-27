# Fieldwork — healthcare intelligence

A local Next.js 16 / React 19 workspace redesigned from the supplied hand-drawn flow and the paper-and-green sentiment UI. The main workspace runs without login, language models, or API keys. Evidence and local-data refreshes use separate public-source connectors.

## Run

Use Node.js 22.18+ (24 recommended).

```sh
npm install
npm run dev
```

Open the printed localhost URL. For production: `npm run build`, then `npm start`.

## Intervention studio

Fieldwork now includes an evidence-informed intervention workflow: Discover → Simulate → Compare → Implement → Measure. Open **Intervention studio** in the sidebar, or click **Model interventions** from a filtered sentiment signal. It includes a reviewed 20-archetype library, 83-county Michigan calibration, capacity/reach and economic models, seeded uncertainty, immutable saved versions, comparison/portfolio tools, and implementation monitoring.

Run `npm run interventions:rebuild-models` to populate six reproducible planning scenarios. See [INTERVENTION_SIMULATOR.md](INTERVENTION_SIMULATOR.md) for architecture, methods, limits, source counts and all refresh/test commands; [INTERVENTION_SIMULATOR_RESEARCH.md](INTERVENTION_SIMULATOR_RESEARCH.md) records the pre-implementation research. Modeling needs no LLM or external key. Optional ACS refresh requires a Census API key.

The requested [40-point delivery report](INTERVENTION_SIMULATOR_REPORT.md) records implemented capabilities, validation results and remaining scientific/data boundaries.

### Vercel deployment

Use the Node.js runtime (Node 24 recommended). On Vercel, the intervention workspace automatically uses writable `/tmp` storage instead of the read-only application directory; no `FIELDWORK_DB_PATH` setting is needed. Remove an existing override pointing into `/var/task` or the project directory, then redeploy the updated code.

Discovery and simulations work with the committed evidence/county snapshots. The UI labels server saves as **temporary**: versions, research history and monitoring records may disappear or be unavailable on another function instance. Permanent shared storage requires an external database; moving a SQLite file to `/tmp` does not provide persistence. See [Vercel's storage explanation](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

## Workspace

Exports are temporarily disabled for sentiment CSV, ROI scenario JSON, and MHU plan CSV. Controls display **Unavailable**. Set `EXPORTS_ENABLED` in `lib/features.ts` to restore the existing export workflows.

- **Sentiment analysis:** 10,000 synthetic records, source, county, and health-topic filters, 30/60/90-day windows, keyword search, daily averages, clickable record dots, keyboard day selection, event context, and CSV export of the current selection. Select a record dot or a row to open its text reader. The reader adapts the supplied sentiment UI: a changing passage score, an emotional-arc graph, and the full paragraph with sentiment-colored passages. Hover to explore; click to pin a passage; arrow keys, Home/End, and the full-paragraph control provide keyboard navigation. The date range is a fixed snapshot ending October 20, 2026, rather than a live feed.
- **ROI calculator:** editable workforce size, annual cost per employee, participation, cost reduction, and annual investment. Results update locally; the retained export format contains assumptions and results as JSON. Net ROI is `(gross savings − investment) / investment`; benefit/cost is `gross savings / investment`. Undefined ratios display N/A. Defaults are illustrative assumptions, not predictions or clinical evidence.
- **MHU scheduler:** adjustable unit count and daily screening capacity; five-day planning heuristic, explicit site demand, remaining demand and utilization, and CSV export. Full-capacity visits are preferred, then sites are ranked by priority. At most one unit visits a site each day. Travel time and clinician availability are not modeled. This is a capacity-planning demonstration, not a globally optimal routing solver.

The original optional NextAuth login route remains at `/login`; its Google and credentials providers require the environment variables in `.env.example`. Only `/account/*` is protected by the existing auth middleware. The demo dashboard and its synthetic fixtures are public to anyone who can reach this local server. No production identity or data-access controls are claimed.

## Data and provenance

The committed dataset is `public/data/sentiment.json`. Regenerate it reproducibly:

```sh
npm run data:generate
```

Exactly **10,000** unique record IDs cover July 23–October 20, 2026. The generator uses distinct rules for each channel rather than randomly attaching a source label to the same text:

| Source | Records | What the fixtures represent |
| --- | ---: | --- |
| Social media | 6,440 | Invented community posts and demo contributors, with conversational context |
| News | 1,860 | Fictional regional news outlines and explicitly fictional publication names |
| Congressional hearings | 36 | Six segments each from six explicitly fictional national policy sessions; no provider-specific event linkage or local county attribution |
| Search interest | 1,664 | Sixteen queries × eight counties × thirteen weekly observations, each query/county series normalized to a peak of 100 |

**Corewell records are limited to 12 fictional news outlines and 108 community reactions. There are no Corewell hearing excerpts.** Hearing examples discuss broad workforce, prescription affordability, behavioral health, environmental exposure, coverage, and preparedness policy. They do not impersonate named witnesses or quote real testimony. Source provenance remains available in the methodology and collapsed record details; the export dialog and every CSV row explicitly disclose the synthetic dataset. No actual posts, articles, testimony, or Google metrics were collected.

Only **8,336 records** carry sentiment scores. Sentiment above +0.15 is positive, below −0.15 is negative, and values between are neutral. Daily and overall sentiment are record-weighted arithmetic means of scored records. Percentages use scored records as their denominator. Search-interest rows have `score: null`, a separate `interestIndex`, and never enter sentiment averages, percentages, or plotted response curves. Their 0–100 indices are comparable within a query/county series, not across different queries. The search-interest view exposes the indices and allows browsing weekly periods.

The curve interpolates daily averages; dots show up to five actual scored synthetic records per day. Templates can repeat; the fixtures are designed to demonstrate source-appropriate behavior, not to constitute a research corpus or measured public opinion. Generation is deterministic and requires no LLM or external service.

The October 11 sentinel annotation links to [Eric Starkman's Deadline Detroit column](https://www.deadlinedetroit.com/articles/35190/starkman_corewell_to_outsource_more_er_care_to_controversial_staffing_firm_backed_by_private_equity), which reports planned ER staffing outsourcing to TeamHealth at Troy, Grosse Pointe, and Lenox, with Livonia described as likely. The date is the report's publication date, not a verified implementation date. This is attributed reporting/commentary, not independent confirmation. All surrounding sentiment, volume changes, and apparent reactions are **synthetic**, including the seeded negative dip. Corewell is only one event example (120 records, or 1.2% of the total), not the scope of the dashboard. The other four events—air quality, coverage disruption, mental health access, and community screening—are entirely illustrative. There are 9,400 general-health records and 600 event-linked records. All providers and health topics are included in the default view; county and topic filters also scope visible event markers. The dashboard opens on the latest daily snapshot rather than on Corewell. Machine-readable provenance is in `public/data/manifest.json`.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

The tests verify dataset integrity, source-specific content rules, policy-session attribution, weekly search-index normalization, exclusion of search interest from sentiment, filters, weighted aggregation, CSV escaping, ROI arithmetic, and scheduling capacity constraints.

Optional browser checks:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright BASE_URL=http://127.0.0.1:3012 npm run test:ui
```

Start the dev server on that port first. The UI checker uses an existing Playwright installation (the default points to the Codex bundled runtime on the development machine). It checks search, filters, record/day selection, disabled export controls, methodology, ROI and scheduler updates, hearing/source isolation, unscored search-interest drawers, hover isolation, and horizontal overflow at 390/768/1024/1512 pixels. Screenshots are written to the OS temporary directory used by the development environment.

## Graph performance

The graph caches geometry, sampled records, titles, and axis labels. Hover updates only a separate lightweight overlay, once per animation frame; it does not re-render the plotted SVG or recompute the dashboard aggregates. Date formatters are shared. Data filters are deferred while typing. Scroll listeners are passive and dismiss hover previews without rebuilding the graph.

Run the **production** build for representative performance (`npm run build`, then `npm start`). `scripts/profile-chart.mjs` repeats 270 pointer samples across the graph and a fixed wheel-scroll sequence; it reports Chromium task/script time, formatter construction, plotted-SVG mutations, and frame timing. See `docs/graph-performance.md` for the measured before/after comparison. This is a local benchmark, not a guarantee for every device.

## Presentation and record reading

The presentation view omits repeated synthetic-data banners and per-record badges. Source-specific fixture rules are preserved; record metadata is available in a collapsed **Source details & methodology** section, and the workspace methodology still explains the data. When exports are enabled, the **Export data** action opens a demonstration-data disclosure before downloading. The CSV preserves `synthetic`, `sourceContext`, and all original record fields, and adds `dataDisclosure` to every row so the exported file remains self-describing.

The per-record reader is loaded only when a record is opened, preserving the main graph's cached hover path. Its sentence/clause scores come from deterministic local text analysis, adapted from the supplied index.html reference. Negation, intensity, and neutral text are handled without an LLM or network call. The full-paragraph view and displayed **Timeline score** retain the clicked record's assigned fixture value. Selecting a passage changes the large score to a separate local reading of the actual text and do not change the aggregate dataset. Search-interest records keep their separate index view and are not assigned passage sentiment.
