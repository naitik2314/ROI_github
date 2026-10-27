# Intervention simulator: research and implementation decisions

Research cutoff: **2026-10-26**. This document was written before simulator implementation. It is a methods and source review, not a systematic review or a clinical recommendation. Publication dates, review search cutoffs, dataset releases, and retrieval dates are different fields.

## 0. Repository inspection

Fieldwork uses Next.js 16.1.6 App Router, React 19, TypeScript, plain CSS/Tailwind, Lucide icons, and Node 24. The main page renders `Hero`, an alias for the client `Dashboard`. Navigation and source/county/topic/date/search filters are component state. `lib/sentiment.ts` owns records, topics, event metadata, aggregation and filtering. `SentimentChart` caches geometry and isolates hover updates; `RecordDetail` is loaded on demand and uses the local passage reader. These paths must remain operational and the large record file must not be duplicated into the simulator bundle.

The current 10,000 records are synthetic, explicitly marked in the schema and manifest; there are 8,336 scored records and unscored search observations. The new module must preserve those facts and must never turn record volume into a denominator for clinical need. County geography is currently eight names, not a county geometry database. A legacy unused map fetches US Atlas county topology; reuse the installed d3/topojson packages, cache Michigan geometry locally, and extend geography using five-digit FIPS without changing existing sentiment filters.

Existing ROI and scheduling calculations are local pure functions (`lib/planning.ts`), not evidence-calibrated intervention models. There is no database, job queue, evidence ingestion, generic parameter provenance layer, or active LLM integration. The sole API is NextAuth. Optional authentication protects `/account/*`; the local workspace is public. Introduce an isolated typed domain layer and Node API routes, plus SQLite persistence with immutable snapshots. Do not imply that the local shared workspace is a multi-tenant authenticated deployment. Retain the existing export-disable setting.

## 1. Economic evaluation

- **Cost analysis** estimates resource consumption and expenditure; it does not establish effectiveness. Use quantities × unit prices, preserve financial and opportunity costs separately, and identify the price year.
- **Cost-effectiveness analysis** compares incremental cost and a defined natural health outcome against a comparator. Return net cost per additional outcome; do not compare ratios with incompatible outcome units. [CDC POLARIS CEA](https://www.cdc.gov/polaris/php/economics/cost-effectiveness.html).
- **Cost-benefit / ROI** requires defensible monetary valuation. Report benefits, cost, net benefit, `(benefit − cost)/cost`, and benefit/cost separately. An unvalued outcome is missing, not zero savings. Reimbursement revenue and averted resource costs are distinct, especially across perspectives. [CDC economic evaluation](https://www.cdc.gov/polaris/php/economics/index.html).
- **Cost-utility** requires a proper survival/quality-of-life model. Do not convert an additional screening, controlled BP reading, or depression response into QALYs using an invented constant. Generic ICER/NMB functions can be supported, while QALY displays remain unavailable for the initial archetypes.
- **Budget impact** answers affordability for a budget holder, using annual undiscounted cash flows; economic present values are a separate view. Include start-up, recurring operations and participant costs, timing of benefits, and who actually captures those benefits. [ISPOR BIA task force, Sullivan et al.](https://pubmed.ncbi.nlm.nih.gov/24438712/).
- **Discounting** is an explicit modeling choice. Use separate editable cost and outcome rates and show the rate in every audit. NICE's UK reference rate is not a universal US rule. [NICE methods](https://www.nice.org.uk/process/pmg36/chapter/economic-evaluation-2/).
- **Reporting**: disclose perspective, comparator, horizon, populations, assumptions, methods, heterogeneity and uncertainty. CHEERS guides transparency; the software is not itself a CHEERS-certified evaluation. [CHEERS 2022](https://www.ispor.org/heor-resources/good-practices/cheers).

## 2. Implementation and program evaluation

Use the CDC 2024 sequence: assess context, describe the program, focus questions/design, gather evidence, generate/support conclusions, act on findings. Engage communities and advance equity throughout. Implementation metrics and health outcomes remain separate. [CDC 2024 framework](https://www.cdc.gov/mmwr/volumes/73/rr/rr7306a1.htm).

Capture reach, adoption, delivery, fidelity, retention, cost and sustainability. A low uptake observation updates an implementation assumption; it does not refute or rewrite an external trial's effect estimate. [Proctor et al., implementation outcomes](https://pubmed.ncbi.nlm.nih.gov/20957426/). A pilot should collect invitations, eligibility checks, unique enrollment, completed services, follow-up, time logs and paid expenditure, alongside acceptability and barriers.

## 3. Causal evaluation

Maintain distinct result types: **modeled projection**, **observed change**, **causal estimate conditional on an identified design**. A before/after difference is descriptive. Sentiment changes are affected by source composition and external events.

Difference-in-differences needs a credible comparator, no anticipation/spillovers, stable measurement/composition, and defensible counterfactual parallel trends. A nonsignificant pre-trend test cannot prove parallel trends. Do not issue automatic causal labels from a few aggregate rows. [Roth et al., DiD synthesis](https://arxiv.org/abs/2201.01194).

Interrupted time series requires repeated pre/post measurements, a prespecified intervention and lag, and assessment of seasonality, autocorrelation, coding changes and concurrent events. There is no universal adequate number of points. Synthetic control needs a credible unaffected donor pool and pretreatment fit. Matching cannot resolve unmeasured confounding. [Lopez Bernal et al., ITS tutorial](https://pmc.ncbi.nlm.nih.gov/articles/PMC5407170/).

Initial implementation should provide design diagnostics and observed monitoring, with causal estimates withheld unless the supported method's requirements are satisfied. Do not ship an unvalidated causal estimator just to populate a tab.

## 4. Evidence hierarchy and discovery

Prefer current CPSTF findings and systematic reviews; retain individual RCT/quasi-experimental context where extracted. Evidence strength is multidimensional: design, precision, consistency, directness, recency and implementation relevance. A recommendation based on strong evidence can still have old search dates and uncertain local applicability.

The initial library uses 20 distinct CPSTF archetypes: colorectal, breast and cervical navigation; diabetes prevention; team-based BP care; supported home BP monitoring; CHW cardiovascular care; digital BP support; pharmacy adherence; medication cost support; collaborative depression care; home depression care for older adults; targeted and universal school CBT; asthma home remediation; vaccination reminders, standing orders and home visits; quitlines; and cessation text messaging.

Numerical checks performed against source text:

| Archetype | Extracted finding | Important qualification |
|---|---|---|
| Colorectal navigation | RR 1.82 (95% CI 1.50–2.21), any recommended screening | 26 studies; screening uptake, not cancer mortality or ED utilization. [CPSTF](https://www.thecommunityguide.org/findings/cancer-screening-patient-navigation-services-to-increase-colorectal-cancer-screening.html) |
| Breast navigation | RR 1.32 (1.08–1.62) | 10 studies in meta-analysis; no automatic lifetime treatment-savings model. [CPSTF](https://www.thecommunityguide.org/findings/cancer-screening-patient-navigation-services-to-increase-breast-cancer-screening.html) |
| Cervical navigation | Median +22.5 percentage points | Three studies; median is not a pooled CI. [CPSTF](https://www.thecommunityguide.org/findings/cancer-screening-patient-navigation-services-to-increase-cervical-cancer-screening.html) |
| Diabetes prevention | RR 0.59 (0.51–0.66) for new diabetes | Increased-risk populations; follow-up heterogeneous, not universal annual risk. [CPSTF rationale](https://stacks.cdc.gov/view/cdc/164198/cdc_164198_DS1.pdf) |
| Collaborative care | Short-term depression improvement RR 1.32 (1.22–1.43) | Review of 79 RCTs, 24,308 participants; effect must match response definition and horizon. [Archer et al.](https://pubmed.ncbi.nlm.nih.gov/23076925/) |
| Team-based BP | Median +8.5 percentage points controlled | Review through June 2020; do not derive admissions prevented without a further validated model. [CPSTF](https://www.thecommunityguide.org/findings/heart-disease-stroke-prevention-team-based-care-improve-blood-pressure-control.html) |
| Asthma home environment | Median +21 symptom-free days/year | Pediatric populations; adult PLACES asthma is not pediatric prevalence. [CPSTF](https://www.thecommunityguide.org/findings/asthma-home-based-multi-trigger-multicomponent-environmental-interventions-children-adolescents-asthma.html) |

Economic evidence is stored as contextual review-level records, not falsely counted as individually ingested underlying trials. Examples include CRC navigation $150/person (2022 USD), team BP $299/patient/year (2020 USD), supported SMBP $174/person (2014 USD), and group diabetes prevention $417/person (2013 USD). Do not combine medians from different study subsets into one claimed observed ROI. Local resource budgets are separately labeled assumptions.

Use Europe PMC REST and PubMed identifiers for automatic discovery. Keep query, retrieval date, publication type, DOI/PMID/PMCID, study group, abstract-derived extraction candidates, source offsets/text and review state. Deduplicate by DOI then PMID; retain potential same-trial publications for review. Machine extraction is **pending review**, never automatically promoted to an active parameter. Cache results; avoid external calls during slider interaction. [Europe PMC documentation](https://europepmc.org/RestfulWebService).

## 5. Michigan calibration and data provenance

The CDC current-release link resolved to **PLACES county 2025 release**, dataset `swc5-untb`, during this review. Michigan records were retrieved through Socrata. Preserve measurement year and crude-prevalence limits for each measure; release year is not measurement year. Use crude, not age-adjusted prevalence, for population counts. County population fields are supplied with the release. Retain all 83 county FIPS and selected relevant measures only. PLACES health estimates are small-area modeled estimates, not direct enumerated patients. [Data portal](https://www.cdc.gov/places/tools/data-portal.html), [definitions](https://www.cdc.gov/places/measure-definitions/index.html), [dataset](https://data.cdc.gov/d/swc5-untb).

Use adult population for adult measures; clinical eligibility, age range, disease severity and unmet need require separate filters/assumptions. Diagnosed depression is not the same as current major depression; diagnosed diabetes is not prediabetes; medication use is not BP control; a recent routine checkup is not proof of primary care access. Do not silently substitute those variables. Do not infer intersections by multiplying marginal prevalence as if independence were observed.

Census ACS 2024 5-year is an appropriate all-county demographic source. Its API now returned a **Missing Key** page for an unauthenticated query. Implement an optional key-backed connector and record this limitation. Do not claim ACS is connected until a validated retrieval succeeds. [API examples and key requirement](https://api.census.gov/data/2024/acs/acs5/examples.html).

MDHHS MiBRFSS, HRSA shortage data, CMS utilization and EPA data are useful possible extensions, but none should be called connected solely because a link exists. Add a variable only when its denominator, time period and model use are known. Michigan county geometry can use the existing US Atlas/Census-derived generalized boundary asset with attribution; cache it locally and identify its vintage. The map is contextual, not a service-radius or travel-time model.

Every local value needs source, dataset ID/version, measurement year, FIPS/geography, definition, unit, retrieval timestamp, use constraints, and citation. Missing values stay missing. Never replace a failed refresh with invented values; retain the previous verified snapshot with a stale indicator.

## 6. Cost data and normalization

Use a resource ledger for fixed setup, staffing quantities, operating expenses, variable participant expenses and opportunity costs. Actual quotes are user supplied. BLS May 2025 OEWS is the currently listed release; automated BLS retrieval returned 403 in this environment. Michigan publishes official OEWS files, but no unverified wage should be initialized as a local quote. [BLS tables](https://www.bls.gov/oes/tables.htm), [Michigan OEWS](https://www.michigan.gov/mcda/labor-market-information/oews).

Preserve original economic-study currency, year, quantity basis and geography. Normalization uses an explicit index ratio and index identity; CPI-U is not automatically appropriate for medical utilization, wages or pharmaceuticals. A user-entered normalization factor is an assumption, not a connected official index. Charge-versus-cost and payer reimbursement are not interchangeable.

## 7. Impact and reach modeling

Use a closed, unique eligible cohort for each scenario. Demographic eligibility × clinical/social relevance forms the potential target; awareness/contact/uptake determine demand. Monthly staffing hours, service duration, site throughput and referral slots cap intake. Ramp-up reduces available capacity. Retention/adherence describe service completion; applying them to an ITT effect can double-adjust attrition, so the default transported effect applies to enrolled/assigned participants and completion is reported separately. Any per-protocol scaling needs an explicit reviewed choice.

For a beneficial binary outcome: treated risk = min(1, baseline risk × RR). For an adverse binary outcome: avoided risk = baseline risk − treated risk. OR converts through baseline odds; a hazard ratio requires a survival model and is not casually treated as RR. Continuous mean differences and rates retain their units. SMD requires a validated target standard deviation before returning native units. Percentage points divide by 100 before probability arithmetic.

A cohort accrues an outcome only once for a binary episode. A repeated symptom-day model can accrue by supported follow-up duration. Effects accrue at their specified lag/follow-up and stop at evidence support unless an explicitly reviewed extrapolation is enabled. No automatic year-one medical savings for a later benefit.

## 8. Uncertainty and decision analysis

Deterministic previews are immediate; seeded PSA runs asynchronously with cancellation/stale-result handling and bounded draw counts. Store summaries, parameters and seed, not every draw. Log-normal ratio uncertainty uses log-scale CI width; normal continuous effects use reported SE/CI. Median/IQI/range is not a sampling CI. Beta/Gamma parameters require supported mean/variance or explicit user choices. User-assumed triangular ranges must be labeled as such and excluded unless accepted.

PSA intervals are conditional model uncertainty, not a guarantee or a local causal CI. Report which inputs vary and which are fixed. Unknown structural/transportability uncertainty cannot be made to disappear with 10,000 draws. Independence is an explicit simplification; support common ranks for linked implementation assumptions and avoid claiming a fitted correlation matrix.

Report mean/median, percentiles, probability of budget feasibility, outcome targets and positive net benefit where valuation exists; one-way tornado; defined conservative/base/optimistic assumptions; and numerical thresholds. Use NMB rather than unstable ICER distributions when legitimate willingness-to-pay exists. [EUnetHTA economic evaluation methods](https://tools.eunethta.be/files/Methods%20for%20health%20economic%20evaluations.pdf).

EVPI is only meaningful for a defined decision set and defensible joint uncertainty; do not show it for an unvalued outcome or unsupported distributions. EVPPI requires additional computation/validation and should not be represented by a sensitivity rank.

## 9. Applicability, equity and optimization

Show population, setting, baseline risk, intervention intensity, system context, geography, era and capacity independently. A matching county name is not transportability. Defaults remain unreviewed until an analyst checks them; expose evidence gaps and concrete pilot data requirements.

Geographic distribution uses legitimate aggregate county data. Do not infer race, income or disease from sentiment text. Report reach/eligible coverage and unmet coverage by county. County-level poverty/insurance context is ecological, not individual disadvantage. Equity thresholds and weights are explicit normative user inputs. Full distributional CEA requires more than a choropleth. [Asaria et al. DCEA tutorial](https://pubmed.ncbi.nlm.nih.gov/25908564/).

Portfolio optimization must compare a common outcome and time horizon. Use exact bounded subset selection for a small candidate set, with budget, staffing and equity constraints. Reject or explicitly adjust overlapping same-outcome cohorts; unknown overlap is a reason to withhold an additive benefit total. Do not add screenings, depression responses and symptom-days into a single opaque impact score.

## 10. Assumptions requiring visible review

Clinical eligibility, demographic fractions without verified age data, counterfactual risk over the exact follow-up, uptake, staffing availability, ramp-up, referral capacity, benefit ownership, unit valuation, price year, monetary threshold, effect extrapolation, causal assumptions, portfolio overlap and equity weights must never be silently automated. Defaults may initialize a clearly labeled user-assumption scenario; accepting those assumptions does not make them published evidence.

## 11. Persistence, refresh and validation

Use a versioned evidence snapshot and immutable scenario versions containing evidence/data/model versions, parameters, seed, timestamp and actor. Observations are append-only and separate from model parameters. Evidence refresh produces pending candidates; saved versions continue using their pinned evidence snapshot. Validate finite ranges, units, CIs, horizons, cohort counts, valuation coverage, overlap, nonnegative costs and denomination before simulation. Bound API bodies, research requests, simulation draws and stored text; no executable formulas or arbitrary URL fetching.

Test arithmetic against known hand calculations; simulation distributions/reproducibility and threshold recovery; local-data integrity; source/identifier deduplication; persistence immutability; API validation; and end-to-end sentiment-to-model workflows. Keep the existing browser regression suite and performance benchmark. A successful build alone does not validate an economic model.

## 12. Major limits

Public data do not establish the exact service-eligible population, local clinical baseline risk, current implementation quotes, contracts, counterfactual utilization, QALYs or causal effects for a proposed program. The initial system must expose those gaps while providing usable planning and sensitivity tools. The evidence library is a curated launch set with a repeatable discovery workflow, not an exhaustive living systematic review. Production deployment still requires organization identity, access policy, backups and operational hosting decisions; a local SQLite workspace is not a substitute for those controls.
