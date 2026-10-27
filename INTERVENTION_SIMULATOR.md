# Fieldwork intervention impact & ROI simulator

Research cutoff: **October 26, 2026**. Model: `fieldwork-cohort-1.0.0`. This is an integrated local decision-support module with a reviewed launch library, county calibration, a canonical calculation engine, persistence, and post-launch evaluation. It preserves the existing sentiment explorer, passage reader, workforce ROI calculator and MHU scheduler.

## Use it

Start Fieldwork, choose **Intervention studio**, or filter the sentiment view and click **Model interventions** below Behind the signal.

1. **Discover:** define the county/region, problem, barrier, total budget, horizon and question. Inspect the reviewed intervention population and endpoint before choosing it.
2. **Simulate:** inspect the local eligibility/reach funnel, staffing and follow-up constraints, resource costs and annual cash flow. Change assumptions interactively; run 500, 2,000 or 10,000 seeded draws. Monetary ROI remains unavailable unless an explicit valuation is supplied.
3. **Compare:** compare the current draft with up to five saved versions. Pareto comparisons retain outcome, horizon, perspective and price-year boundaries. Incremental analysis additionally requires a matching eligible cohort/baseline and recorded applicability review. The optional decision threshold is an explicit user valuation in natural outcome units, not an assumed QALY threshold.
4. **Implement:** inspect supported versus assumed links in the logic model, staffing/capacity, dependencies and a configurable pilot/evaluation plan.
5. **Measure:** select a saved version, move PLANNED → LIVE → COMPLETED, record aggregate implementation periods, compare spend/enrollment to plan, and create a new draft with locally learned uptake. Use the advanced design assessment for a supported balanced-panel DiD evaluation.

**Methods** explains the boundaries. **Data health** shows connector status, evidence currency, pending publication candidates, refresh history and persistence integrity. **Generate decision brief** creates a readable planning document. Saved briefs have a stable local route at `/interventions/brief/<snapshot-id>`.

The earlier instruction to disable exports is still enforced. Export controls for the existing views remain unavailable; new PDF-print/CSV paths are gated by `lib/features.ts`. Brief reading and saving work without enabling file export. When exports are restored, the standalone brief has print pagination and source links, and the structured CSV preserves parameters, statuses, versions and community-source provenance.

## Architecture discovered and reused

| Area | Existing implementation | Extension |
|---|---|---|
| Frontend | Next.js App Router; React; TypeScript; Lucide; CSS/Tailwind | Lazy-loaded `components/interventions/ImpactStudio.tsx`, scoped styles and modular views |
| Sentiment | `Dashboard`, `SentimentChart`, record drawer, passage reader; eight topics/counties | Context-only handoff via `lib/interventions/signal.ts`; original records/aggregations untouched |
| Domain calculations | Pure local workforce ROI and scheduling functions | Shared intervention domain under `lib/interventions/`, used by preview and backend |
| Backend | NextAuth route; optional legacy login | Validated Node API routes under `/api/interventions/*` |
| Database/jobs | None for evidence or scenarios | Native Node SQLite, WAL, foreign keys, immutable versions, append-only observations, audit/research logs |
| Geography | County names; unused legacy US map | Five-digit FIPS, 83-county cached Michigan geometry and calibrated county context |
| Evidence | No generic ingestion/provenance system | Versioned curated library, typed effects/economics/citations, pending publication discovery |
| Testing | Node domain tests and Playwright scripts | Economic/simulation/data/persistence/causal tests and complete intervention browser flow |

No runtime LLM or API key is required for modeling. Europe PMC and CDC PLACES refreshes use public APIs. Census ACS is optional and requires a key. No commercial evidence database is scraped.

## Files and API routes

- `content/interventions/library.json`: reviewed archetypes, effect/economic records and citations.
- `content/interventions/local-data.json`: verified Michigan county snapshot, selected measure definitions and connector status.
- `public/data/interventions/michigan-map.json`: locally cached generalized county paths and attribution.
- `lib/interventions/types.ts`: typed entities; `scenario.ts`: visible defaults/register; `model.ts`: canonical deterministic model; `simulation.ts`: distributions/PSA/sensitivity/thresholds; `decisions.ts`: ontology, candidates, applicability, Pareto and portfolio; `evaluation.ts`: balanced-panel DiD.
- `store.ts`: SQLite schema, snapshots, programs, observations, research and audit records. `http.ts`: bounded JSON parsing and same-origin write checks. `research.ts`: fixed-source retrieval, identifier deduplication, trial-group recognition, flagged extraction. `exports.ts`: structured CSV with spreadsheet-formula neutralization.
- `components/interventions/`: explorer, charts, evidence/register drawer, map, comparison, implementation/monitoring, methods/data health and brief.

| Route | Function |
|---|---|
| `GET /api/interventions/catalog` | Cached reviewed evidence, county context, research metadata, data health; full abstracts are deferred |
| `POST /api/interventions/simulate` | Validate a pinned scenario; deterministic result + bounded seeded PSA; cache by scenario hash |
| `GET/POST /api/interventions/scenarios` | List/read/save immutable versions; server recomputes canonical results |
| `GET/POST /api/interventions/research` | Read a stored run; query a canonical intervention; cache unchanged searches for 24 hours |
| `GET/POST /api/interventions/monitor` | Program state and append-only aggregate periods |
| `POST /api/interventions/evaluate` | Validate site panel, assess design requirements and conditionally estimate DiD |
| `POST /api/interventions/portfolio` | Exact constrained subset selection from saved programs |
| `GET /api/interventions/export` | Structured saved-version CSV, currently disabled with HTTP 403 |

## Evidence and source counts

The launch library contains **20 intervention archetypes**, **20 review-level effectiveness records** and **14 economic-review records**. The effectiveness records represent **17 distinct review-group IDs** after grouping the three navigation endpoints and two school-CBT subgroups. Economic records represent **13 distinct economic-review group IDs**. These are not claims that every underlying trial/economic paper was individually ingested. Seventeen archetypes have a selected numerical primary effect; three retain qualitative support while a numerical effect needs extraction/review. A selected number does not make a local model validated.

Sources include CPSTF/The Community Guide and its CDC Stacks rationale documents, plus the Archer collaborative-care Cochrane review indexed by PubMed. The research document contains the methodological source review and manually checked effect examples. Canonical source records preserve search cutoff, retrieval date, version, publisher, license/use notes and URL; unknown publication years remain null rather than being inferred from search cutoffs.

Europe PMC discovery was exercised live for colorectal navigation, diabetes prevention, collaborative depression care and asthma home interventions. The searches preserve queries and results in the local database. Numeric abstract matches remain **pending review**, with surrounding context. DOI/PMID/title deduplication and explicit NCT registry grouping are implemented. An abstract match is not a validated effect, and a same-study relationship without an identifier is not guessed. Reviewed active parameters never change merely because research was refreshed.

## Local calibration

CDC's current release link resolved to **PLACES county 2025**, Socrata ID `swc5-untb`. The committed snapshot contains **83 Michigan counties and 830 selected crude-prevalence measure rows**. Measures include hypertension, colorectal screening, mammography, diagnosed depression, smoking, transportation barriers, insurance, checkups, food insecurity and adult asthma. The model only uses a compatible measure when defined by the intervention; others remain contextual.

Every measure retains its definition, percentage unit, measurement year, published limits, FIPS, source and MODELED status. Population denominators come from the PLACES release; the API does not state their reference year, which is recorded as unknown instead of assigning the measure year. Crude prevalence is used, not age-adjusted prevalence, when constructing counts.

- Adult prevalence is not pediatric prevalence.
- Diagnosed diabetes is not prediabetes, diagnosed-ever depression is not active major depression, and medication use is not BP control. Those substitutions are not performed.
- Demographic eligibility fractions and exact clinical suitability remain visible assumptions unless independently measured.
- ACS 2024 5-year retrieval is implemented behind `CENSUS_API_KEY`; the unauthenticated endpoint returned Missing Key. It is **not represented as connected** without a successful validated retrieval. If retrieved, ACS is retained separately; it does not silently replace a pinned PLACES denominator.
- BLS May 2025 OEWS was researched, but automated retrieval returned 403. Wage assumptions are **not labeled official Michigan wages**. MDHHS/CMS/HRSA/EPA are not claimed as connected.

## Population, reach and impact

For each selected county:

```
population base = adult denominator, or total minus adult for pediatric archetypes
potentially eligible = population base × demographic fraction × compatible need fraction
enrollment demand = eligible × awareness × contactability × uptake
monthly intake capacity = min(FTE × service hours / total service time per person,
                              site capacity, follow-up/referral capacity)
monthly enrollment = min(remaining unique demand, capacity × ramp fraction)
completion = enrollment × retention
adherent completion = completion × adherence
```

The unique cohort is not repeatedly enrolled. Capacity is shared across selected counties in proportion to demand; independent county-map alternatives instead give each county the same whole program and must not be added. Ramp-up is linear to a user-specified mature month; paid staff hours are separate from service hours. This avoids charging only productive hours while ignoring paid administrative time.

The transported effect is an assignment/offer effect. It is applied to enrolled/assigned mature cohorts; it is **not multiplied by retention/adherence again** without a separate per-protocol model. Those implementation outcomes remain visible. This is a deliberate protection against double-adjusting trial attrition, not a claim that fidelity is irrelevant.

For binary RR evidence, `treated risk = clamp(baseline risk × RR, 0, 1)`. Favorable change is treated-minus-comparator for a desirable outcome and the reverse for an adverse outcome. OR uses baseline odds. RD and percentage points retain their scale. Continuous differences retain native units. A summed BP difference is labeled descriptive person·mmHg, not controlled cases. Asthma results aggregate symptom-free days. SMD needs an explicit target SD before conversion. HR, time-to-event and rate effects are stored but withheld from prediction until their required survival/rate models are supplied.

Cohorts enroll at the start of a model month. An outcome accrues once at follow-up plus additional lag. Late cohorts still incur delivery costs but do not receive premature benefits. No unsupported persistence/decay or lifetime disease model is extrapolated. The initial model has **one primary effectiveness endpoint and one non-overlapping monetary valuation stream**, rather than unsupported simultaneous clinical/utilization benefits.

## Costing and economics

Financial cost is setup/equipment/training + paid staffing at loaded wage + operations/travel/evaluation + variable enrollee costs. Economic resource cost additionally includes explicitly valued unpaid/participant time. Societal perspective includes those opportunity costs; other perspectives use their stated borne financial-cost share. Benefit capture is separate from cost ownership.

```
PV cost = setup at time zero + sum(monthly perspective costs / (1 + cost discount)^(month/12))
PV benefit = sum(additional mature outcomes × unit valuation × captured share,
                 discounted at the selected cost rate)
net benefit = PV benefit − PV cost
ROI = net benefit / PV cost, when PV cost > 0 and outcome valuation exists
benefit-cost ratio = PV benefit / PV cost
net cost per additional outcome = (PV cost − PV benefit) / discounted additional outcome
```

Undiscounted annual budget impact is displayed separately, including cash-flow timing and perspective ownership. The original review-level costs stay in their original currency/price year and are contextual evidence, not automatically imported as current Michigan quotes. `normalizeCost` requires explicit source/target price indices and preserves original values; there is no hidden universal CPI-U adjustment.

Incremental cost-effectiveness and NMB use compatible alternatives and an optional explicit decision threshold. QALYs, DALYs, CEACs, life expectancy, ED/hospital utilization savings from intermediate endpoints, and utilities are **not fabricated**. Conditional EVPI is limited to implement-versus-status-quo monetary decisions under supported input settings; EVPPI is not implemented.

## Uncertainty, sensitivity and thresholds

The seeded generator, inverse/transform samplers and canonical model are shared and tested. Supported distributions are fixed, normal, log-normal, beta, gamma and triangular. Beta/gamma moments must agree with the displayed mean; invalid shapes/support/ranges are rejected. The default ratio uncertainty derives log-scale SE from reported CI width; centering on the reported point is an approximation if the interval is asymmetric. Medians and between-study IQIs are not treated as sampling CIs.

User-assumed operational ranges are excluded until explicitly included. Observed local uptake can use a beta posterior with an explicitly stated Beta(1,1) prior. Independent input sampling is an acknowledged limitation; no fitted correlation model is claimed.

Stored output includes means/medians/2.5th–97.5th percentiles, bounded histogram, annual cumulative fan, up to 80 thinned display samples, probabilities of budget feasibility/positive ROI/meeting an optional outcome target, one-way sensitivity ranking, and numerical financial/budget thresholds. Full 10,000-draw arrays are not persisted. The unit-cost break-even solver rounds monetary thresholds to cents. Probability intervals are conditional model uncertainty, not local causal confidence intervals.

Conservative/optimistic copies use explicit declared parameter bounds, not arbitrary ±20% shifts. Thresholds retain capacity and lag constraints; non-identifiable or unreachable break-even conditions are stated as such.

## Comparison, portfolio and equity

The comparison table preserves population, units, costs, evidence version, horizon, perspective, staffing, outcome timing and review status. Pareto membership is assessed only inside compatible endpoint/horizon/perspective/price-year groups. Incremental analysis has stricter population, baseline and discounting comparability gates.

The portfolio solver enumerates up to 16 whole-program binary options with budget/staff pruning. It maximizes one shared outcome, with an explicit minimum reach share in a user-selected priority county. Same-county unknown overlap blocks addition; verified-disjoint cohorts require explicit analyst attestation. Alternative versions of the same program family cannot both be selected. Costs must use the same price year. This is exact 0/1 selection, not a fractional rollout optimizer, routing solver or nonlinear diminishing-returns model.

The map and county table expose eligible population, modeled enrollment, additional outcome, costs, coverage and ROI where estimable. Coverage is an equity-relevant distribution, not full distributional CEA or an individual disadvantage classifier. Sensitive characteristics are never inferred from sentiment text. No unreported equity weights are applied.

## Monitoring and causal evaluation

Programs move forward through PLANNED, LIVE and COMPLETED. Recorded periods are append-only and enforce unique month, finite expenditure, whole counts and contacted ≥ enrolled ≥ completed. Only aggregate data should be recorded. The local shared workspace is not designed for patient identifiers.

Operational alerts use displayed, editable cost/reach/sentiment thresholds. Completion alerts explicitly acknowledge cohort maturity. Learned uptake creates a new draft with source counts/prior; it does not mutate a saved plan or published treatment effectiveness.

The implemented causal method is **balanced two-group, equal-site-weight DiD** with 2,000 site-cluster bootstrap samples. Requirements include stable site treatment assignment, complete panels, at least six sites/group and four pre/post periods (software gates, not a power guarantee), comparison rationale, reviewed identification assumptions and an explicit pretreatment slope-magnitude tolerance. The latter is not a statistical equivalence test and cannot prove parallel trends. Diagnostics show pre/post trajectories and slope differences. Failed requirements withhold the causal estimate while retaining a descriptive contrast. No staggered adoption, ITS, synthetic control, matching or propensity estimator is silently run.

## Persistence, provenance and security

SQLite defaults to `.fieldwork/interventions.sqlite`; use `FIELDWORK_DB_PATH` for another writable persistent volume. Tables cover evidence snapshots, scenario versions/results/PSA summaries, programs, observations, research runs and bounded audit history. Saved versions contain a scenario family/version, actor label, timestamp, content hash, full input register, seed and pinned evidence/data snapshots. Updates/deletion of saved scenarios and evidence updates are rejected by database triggers; foreign keys are enabled.

On **Vercel**, `storageConfig` selects the operating system's temporary directory (`/tmp/.fieldwork/interventions.sqlite`) because `/var/task` is read-only. This fixes catalog initialization, simulation audit writes and temporary server saves without changing local database locations. `FIELDWORK_DB_PATH` still takes precedence; remove any override aimed at the application directory. The catalog reports the storage mode without exposing its filesystem path, and the studio, save confirmation, Data health and saved brief disclose temporary storage. Temporary files are instance-local and may vanish at any time; a warm-instance save/read does not establish cross-instance durability. No external database is automatically provisioned. [Vercel runtime storage](https://vercel.com/docs/functions/runtimes), [SQLite and serverless persistence](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

The existing app has optional login but a public local dashboard. This module follows that local shared-workspace boundary; it does not claim multi-tenant identity, patient-data security, or a production access policy. A hosted service requires authentication/authorization, backups, monitoring and an appropriate database/volume deployment. Serverless ephemeral disks cannot provide durable SQLite persistence. No deployment was performed.

JSON bodies, study text, simulation draws, portfolio size and research concurrency are bounded. Same-origin writes validate the external Host correctly even when Next exposes an internal localhost URL. Research fetches only a fixed trusted API with server-owned canonical queries; there is no arbitrary URL fetcher or executable formula input. External abstracts are treated as data, rendered as text and left pending review. CSV labels cannot execute spreadsheet formulas. Full abstracts load on demand instead of bloating every catalog response.

## Validation and performance

- Node tests cover economic arithmetic, relative/absolute conversion, cohort timing, complete resource-ledger reconciliation, invalid parameters/distributions, reproducibility, distribution moments, Monte Carlo summaries, thresholds, portfolio constraints/overlap/equity, provenance, county geometry, deduplication, immutable SQLite state, HTTP boundaries and known-effect/null-effect causal benchmarks.
- Existing sentiment/passage/ROI/scheduling tests remain included.
- Browser flows cover the full new workflow, 10,000-draw simulation, saved briefs, disabled export routes, 1920/1680/1440/1024/390 widths, and reduced motion. The original browser regression suite also runs.
- Six reproducible planning scenarios span four domains: Wayne/Oakland/Macomb colorectal navigation, Oakland diabetes prevention, Genesee collaborative care and Kent pediatric asthma support. Their operating costs and baseline risk are visible assumptions; no favorable ROI was invented. Machine-readable outputs are in `docs/intervention-model-validation.json`.
- The sentiment production benchmark after integration recorded 270 pointer samples, **60 ms hover scripting**, **0 plotted SVG mutations**, **0 formatter constructions**, **0 long tasks**, **9 ms p95 frame interval**, and **23 ms scroll task time** on this machine. Local benchmarks are not device-independent guarantees.
- The intervention production benchmark recorded **0 long tasks across 32 staffing edits**, **23.8 ms p95 automation-to-two-frames time**, **71 ms server time for 10,000 draws**, **84.7 ms first HTTP response** and **2.4 ms cached response**. Slider edits issued no simulation requests; sentiment startup issued no intervention-catalog requests. The response was 16,556 bytes. See `docs/intervention-performance.json`; the frame metric includes browser automation overhead.

## Exact operating commands

Use Node 24 (the repository requires modern Node TypeScript stripping/native SQLite support).

```sh
npm ci
npm run dev
```

For a production local run:

```sh
npm run build
npm start
```

Refresh pending intervention publications (all 20, or a specific reviewed subset):

```sh
npm run interventions:refresh-research
npm run interventions:refresh-research -- crc-navigation diabetes-prevention collaborative-depression asthma-home
```

Refresh the verified Michigan snapshot and cached map. Set `CENSUS_API_KEY` in the shell if the optional ACS connector is desired; the CLI reads process environment, not Next's `.env.local` automatically.

```sh
npm run interventions:refresh-local
```

Validate/rebuild the six model examples and save new immutable versions when pinned evidence changes:

```sh
npm run interventions:rebuild-models
```

Tests and checks:

```sh
npm test
npm run test:interventions
npm run lint
npm run typecheck
npm run build
```

Start a server on port 3012 before browser checks. Set `PLAYWRIGHT_MODULE` to another installed Playwright module if necessary; the default uses the bundled runtime on this development machine.

```sh
npm run start -- --hostname 127.0.0.1 --port 3012
BASE_URL=http://127.0.0.1:3012 npm run test:ui
BASE_URL=http://127.0.0.1:3012 npm run test:interventions:ui
PROFILE_OUTPUT=/private/tmp/fieldwork-chart-profile.json node scripts/profile-chart.mjs
node scripts/profile-interventions.mjs
```

For isolated test observations, set `FIELDWORK_DB_PATH=/private/tmp/fieldwork-interventions-test.sqlite` on the server command. The database integrity tests already use their own temporary databases.

Evidence refresh does not promote candidates. Review source/outcome/population/comparator/follow-up/precision, edit the curated library deliberately, increment its version, then rebuild model examples. Retain old snapshots and database backups. No recurring background automation was installed.

## Boundaries that remain explicit

Local clinical baseline risks, precise eligible populations, real staffing/service quotes, outcome valuations, contracts and transportability need local input. Three archetypes lack a selected numeric effect. The current primary-endpoint cohort model is not an individual disease-progression microsimulation, a multiple-outcome lifetime model, full distributional CEA, a nonlinear portfolio allocator, or a systematic-review replacement. Those boundaries are enforced or disclosed in the product, rather than filled with invented effects, utilities or savings.
