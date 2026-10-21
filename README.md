# Fieldwork — healthcare intelligence

A local Next.js 16 / React 19 workspace redesigned from the supplied hand-drawn flow and the paper-and-green sentiment UI. The main workspace runs without login, external data services, language models, or API keys.

## Run

Use Node.js 22.18+ (24 recommended).

```sh
npm install
npm run dev
```

Open the printed localhost URL. For production: `npm run build`, then `npm start`.

## Workspace

- **Sentiment analysis:** 10,000 synthetic records, source, county, and health-topic filters, 30/60/90-day windows, keyword search, daily averages, clickable record dots, keyboard day selection, event context, and CSV export of the current selection. Select a record to open its context drawer. The date range is a fixed snapshot ending October 20, 2026, rather than a live feed.
- **ROI calculator:** editable workforce size, annual cost per employee, participation, cost reduction, and annual investment. Results update locally; export the assumptions and results as JSON. Net ROI is `(gross savings − investment) / investment`; benefit/cost is `gross savings / investment`. Undefined ratios display N/A. Defaults are illustrative assumptions, not predictions or clinical evidence.
- **MHU scheduler:** adjustable unit count and daily screening capacity; five-day planning heuristic, explicit site demand, remaining demand and utilization, and CSV export. Full-capacity visits are preferred, then sites are ranked by priority. At most one unit visits a site each day. Travel time and clinician availability are not modeled. This is a capacity-planning demonstration, not a globally optimal routing solver.

The original optional NextAuth login route remains at `/login`; its Google and credentials providers require the environment variables in `.env.example`. Only `/account/*` is protected by the existing auth middleware. The demo dashboard and its synthetic fixtures are public to anyone who can reach this local server. No production identity or data-access controls are claimed.

## Data and provenance

The committed dataset is `public/data/sentiment.json`. Regenerate it reproducibly:

```sh
npm run data:generate
```

Exactly **10,000** unique record IDs cover July 23–October 20, 2026, across eight Michigan counties, eight health topics, and four **simulated source categories**: social media, news, congressional hearings, and Google Trends. These are not actual posts, articles, testimony, or search measurements. Template text can repeat. Record scores are assigned by a seeded fixture generator with a baseline curve, noise, and several event responses; there is no inference service or LLM. Google Trends rows are illustrative search-interest proxies; actual search volumes would not themselves establish sentiment.

Sentiment above +0.15 is positive, below −0.15 is negative, and values between are neutral. Daily and overall scores are record-weighted arithmetic means. The curve interpolates daily averages. Dots show up to five actual synthetic records per day. All 10,000 records contribute to the unfiltered aggregate, even though the chart displays a sample of dots.

The October 11 sentinel annotation links to [Eric Starkman's Deadline Detroit column](https://www.deadlinedetroit.com/articles/35190/starkman_corewell_to_outsource_more_er_care_to_controversial_staffing_firm_backed_by_private_equity), which reports planned ER staffing outsourcing to TeamHealth at Troy, Grosse Pointe, and Lenox, with Livonia described as likely. The date is the report's publication date, not a verified implementation date. This is attributed reporting/commentary, not independent confirmation. All surrounding sentiment, volume changes, and apparent reactions are **synthetic**, including the seeded negative dip. Corewell is only one event example (120 records, or 1.2% of the total), not the scope of the dashboard. The other four events—air quality, coverage disruption, mental health access, and community screening—are entirely illustrative. There are 9,400 general-health records and 600 event-linked records. All providers and health topics are included in the default view; county and topic filters also scope visible event markers. The dashboard opens on the latest daily snapshot rather than on Corewell. Machine-readable provenance is in `public/data/manifest.json`.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

The tests verify dataset integrity, filters, volume and weighted aggregation, CSV escaping, ROI arithmetic and undefined cases, and scheduling demand/capacity constraints.

Optional browser checks:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright BASE_URL=http://127.0.0.1:3012 npm run test:ui
```

Start the dev server on that port first. The UI checker uses an existing Playwright installation (the default points to the Codex bundled runtime on the development machine). It checks search, filters, record/day selection, exports, methodology, ROI and scheduler updates, and horizontal overflow at 390/768/1024/1512 pixels. Screenshots are written to the OS temporary directory used by the development environment.
