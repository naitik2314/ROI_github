# Fieldwork intervention studio — delivery report

Delivered October 26, 2026. Open **Intervention studio** in Fieldwork, or choose **Model interventions** from the sentiment explorer. The connected workflow is Discover → Simulate → Compare → Implement → Measure. This report distinguishes functioning methods from scientific/data boundaries; it does not claim a validated Michigan economic evaluation or a hosted production deployment.

1. **Repository architecture discovered.** Next.js App Router, React 19, TypeScript, CSS/Tailwind and Lucide; client-side dashboard navigation/filter state; pure workforce-ROI and scheduling functions; local sentiment/passage analysis; optional NextAuth login. There was no evidence database or ingestion system. The existing views, records, topic vocabulary and graph behavior were preserved. The new module loads separately and shares a canonical domain layer between preview and server.

2. **Research performed.** Reviewed current official economic/program-evaluation guidance, implementation and causal methods, CPSTF intervention findings, primary review/rationale documents, Michigan calibration options, public discovery APIs and local cost-source availability. The research document was written before implementation. Cutoff, publication date, search endpoint, measurement year and retrieval date remain separate. See [the research record](INTERVENTION_SIMULATOR_RESEARCH.md).

3. **Official methodological frameworks used.** CDC POLARIS; CDC Program Evaluation Framework 2024; CPSTF/The Community Guide; CHEERS 2022 reporting principles; ISPOR budget-impact principles; NICE economic-evaluation concepts. Peer-reviewed Proctor implementation outcomes, DiD/ITS literature and distributional economic-evaluation methods inform the boundaries. These are methodological sources, not certifications of this software.

4. **External data sources connected.** Public Europe PMC REST discovery with retained PubMed/DOI/PMCID identifiers; CDC PLACES through Socrata; cached Census-derived US Atlas county geometry. Europe PMC was exercised live for colorectal navigation, diabetes prevention, collaborative depression care and asthma home interventions. Retrieved publications remain pending review rather than becoming active effect estimates.

5. **Michigan/local data sources connected.** PLACES county 2025 release, dataset `swc5-untb`: all **83 Michigan counties and 830 selected crude-prevalence rows**, with intervals, FIPS, units, definitions and measurement years. These are modeled small-area estimates. ACS has an optional validated key-backed connector; the unauthenticated request required a key, so ACS is not claimed as connected. Automated BLS retrieval returned 403; wages remain explicit user assumptions. MDHHS, CMS, HRSA and EPA are not claimed as connected.

6. **Intervention evidence sources.** CPSTF effectiveness/economic review pages and CDC Stacks rationale documents; the Archer collaborative-care Cochrane review indexed by PubMed; pending Europe PMC discovery records. Sources retain citations and original contexts. Discovery uses fixed canonical queries, DOI/PMID/title deduplication, explicit NCT study grouping and flagged numeric extraction with surrounding text. It is a bounded research workflow, not an autonomous systematic-review replacement.

7. **Number of interventions.** **20 archetypes**: three cancer-navigation programs; diabetes prevention; five cardiovascular/adherence/access programs; collaborative depression care; home depression support; two school-CBT variants; pediatric asthma home support; three vaccination strategies; quitline; cessation text messaging. They span access, affordability, prevention, workforce/task sharing, mental health, infectious disease and environmental health. Unsupported archetypes are not invented to fill taxonomy gaps.

8. **Effectiveness records ingested.** **20 curated review-level records representing 17 distinct review groups**. Seventeen have selected numerical primary effects; three retain qualitative support pending numerical extraction. Four selected effects retain actual reported confidence intervals. The number of underlying trials inside each review is preserved separately; those trials are not falsely counted as individually ingested studies.

9. **Economic evaluations ingested.** **14 economic-review records representing 13 distinct review groups**. Original USD price years, perspective, quantity basis, setting, study counts and qualifications are retained. Historical review medians are contextual evidence, not automatically treated as 2026 Michigan delivery prices or observed local ROI.

10. **Economic methods implemented.** Resource costing, financial versus opportunity costs, explicit perspective/ownership, annual undiscounted budget impact, discounted captured benefits/costs, ROI, benefit-cost ratio, net benefit, natural-unit cost-effectiveness, compatible incremental ICER/NMB and numerical thresholds. A generic cost-index normalization helper requires supplied source/target indices; no inflation series is silently assumed.

11. **Impact methods implemented.** A unique-cohort monthly model with outcome follow-up and lag. RR/OR use an explicit comparator risk; risk differences and percentage points preserve their scale; native mean differences retain their units; SMD requires a target scale SD. HR, rate effects and time-to-event values can be represented but predictions are withheld without their required survival/rate model. No unsupported intermediate-outcome-to-admission, mortality or QALY conversion is made.

12. **Population/reach model.** County denominator → demographic eligibility → compatible clinical/social need → awareness → contactability → uptake, capped by staffing service hours, total staff time per enrollee, sites and referral capacity. Unique people are not repeatedly enrolled. Completion/adherence remain distinct operational results. The published assignment effect is not multiplied by attrition a second time. County prevalence never comes from post counts or sentiment.

13. **Cost model.** Setup/equipment/training, full paid staff time and payroll overhead, administration/travel/evaluation, enrollee materials/support and separately valued opportunity time. Productive service hours are separate from paid hours, and staff remain paid during ramp-up. Local quantities/prices are visible assumptions until replaced with quotes or observations. Financial ledger totals reconcile against hand calculations.

14. **Budget-impact model.** Annual spending, captured benefits and perspective net expenditure are undiscounted; cash timing is explicit. The available budget is compared with whole-program expenditure. A staffing-fit action adjusts the draft under its fixed assumptions and reports infeasibility when fixed costs already exceed the budget. This does not imply that a budget-compatible program is clinically validated.

15. **ROI/cost-benefit model.** `(PV captured benefit − PV perspective cost) / PV perspective cost`, alongside benefit-cost ratio and net benefit. The selected perspective, cost share, captured share, funder and beneficiary are explicit. ROI is unavailable by default because no monetary value is manufactured. A user valuation remains distinct from an avoided-cost estimate; cost-saving probability is withheld for a general user valuation.

16. **Cost-effectiveness functionality.** Net cost per additional natural-unit outcome and compatible-alternative incremental analysis. The UI checks population/baseline, endpoint, horizon, perspective, price year, discounting and applicability review before ICER/NMB comparisons. An explicit optional monetary decision threshold is not an assumed QALY threshold. No QALY/DALY utility model or CEAC is claimed.

17. **Uncertainty methods.** Fixed, normal, lognormal, beta, gamma and triangular distributions; reported-CI conversion; optional operational-assumption ranges; conditional percentile intervals; budget, ROI and outcome-target probabilities; conservative/optimistic drafts from declared bounds. Medians/IQIs are not converted into sampling CIs. Structural/transportability uncertainty remains disclosed rather than assigned an invented percentage.

18. **Monte Carlo implementation.** Seeded reproducible generation, 100–10,000 bounded draws, support validation/rejection sampling, shared canonical formulas, bounded server cache and version/hash/seed audit. The UI offers 500/2,000/10,000 draws. Saves contain summaries, percentiles, histogram, annual fan and at most 80 thinned display samples, not all 10,000 raw draws. Inputs are independently sampled. Conditional two-option EVPI is gated; EVPPI is not implemented.

19. **Sensitivity analysis.** One-way analysis over declared effect/operational ranges, ranked by model change and rendered as a tornado. The metric is identified as net benefit, cost per natural outcome or expenditure. This ranking is not described as a variance decomposition or EVPPI.

20. **Break-even analysis.** Maximum affordable variable cost, minimum feasible uptake for perspective break-even, maximum variable cost at perspective break-even and payback timing. Root solving retains capacity, ramp-up and cohort maturity. Missing valuation or unreachable roots produce explicit unavailable results. The product does not invent an alternative-switch threshold without comparable evidence.

21. **Equity functionality.** County eligible-population coverage, reached population and unmet coverage; explicit priority-county minimum reach share in portfolio selection. No protected characteristics are inferred from narratives. This is geographic distribution and an explicit planning constraint, not full distributional cost-effectiveness analysis or an individual disadvantage classifier.

22. **Geographic functionality.** Cached keyboard-accessible 83-county Michigan map, county drilldown, comparison rows and selectable eligibility/reach/outcome/cost/coverage/ROI measures. Independent county alternatives receive the same program; a separate shared-footprint view divides one program's capacity. These totals cannot be mixed. Missing/negative values retain distinct labels/colors; no travel-time routing model is claimed.

23. **Portfolio optimization.** Exact bounded 0/1 subset enumeration for up to 16 saved whole programs, constrained by budget, staffing and priority-county reach. Outcomes, horizon and price year must agree. Unknown same-county cohort overlap blocks additive selection unless explicitly reviewed as disjoint; alternative versions of one program are mutually exclusive. This is not fractional allocation, nonlinear scaling or a cross-domain opaque impact score.

24. **Causal evaluation.** Balanced two-group, equal-site-weight DiD, conditional on reviewed identification assumptions, complete panels, stable treatment assignment, explicit comparator rationale and pretrend diagnostics. A 2,000-draw site-cluster bootstrap supplies an interval. Software gates require six sites/group and four pre/post periods; they are not a power calculation. Known-effect/null-effect benchmarks pass. Failed gates withhold the causal estimate. ITS, synthetic control, matching and staggered-adoption estimators are not implemented.

25. **Sentiment integration.** Model interventions passes county, dates, topic/subtheme, volume, trend, selected supporting narratives and relevant events. Existing filters survive the round trip. Signal provenance is retained. Conversation data inform the problem and barriers; they do not set disease prevalence, effect, eligible population or uptake. The working graph, clicked-record paragraph reader and existing ROI/scheduler remain available.

26. **Evidence provenance architecture.** Typed citations/effects/economic records/local metrics, dimensional quality/applicability context, source IDs, original years/units and immutable full evidence/data snapshots identified by SHA-256. Unknown fields stay unknown. Newly discovered abstract matches remain pending. A research refresh never silently promotes an estimate.

27. **Assumption register.** Every numeric input has status, unit, source/reason, timestamp, range and distribution. Edits become USER ASSUMPTION and drop the prior source attribution. The evidence/assumptions/applicability/audit drawer exposes those fields; the model canvas counts input statuses. Local beta-posterior uptake learning records the aggregate counts and explicit Beta(1,1) prior in a new draft.

28. **Scenario versioning.** SQLite immutable versions, parent/family relationships, timestamp/actor label, content hash, parameters, deterministic results, optional PSA summary and pinned evidence/data. Saved plans and observations are separate. Updates/deletes of saved versions are rejected by database triggers. Duplicate and session-draft recovery are available. Older pinned versions remain readable without silently recomputing against newer evidence.

29. **Model versioning.** `fieldwork-cohort-1.0.0`, evidence `evidence-2026-10-26.2`, local snapshot `places-2025-mi-7f92111ebaf6`. Version compatibility is validated; seeds/hashes and evidence cutoffs remain visible. The local database uses foreign keys, WAL and integrity checks; tests use isolated temporary databases.

30. **Research/evidence refresh.** CLI and in-product canonical Europe PMC discovery, query-aware 24-hour reuse, bounded concurrency/rate/body sizes, stored run/error history and deferred abstracts. Local refresh validates complete county coverage before replacing verified files; failed retrieval retains prior data. Curated evidence promotion remains a deliberate reviewed file/version change. No recurring automation was installed.

31. **Visualizations created.** Interactive reach funnel; annual spend/captured-benefit timeline; conditional uncertainty histogram/fan; thinned cost-impact scatter; tornado; threshold register; Michigan map/table; compatible scenario comparison/Pareto labels; implementation logic links; planned-versus-observed monitoring; evaluation trajectories/pretrend diagnostics; readable decision brief.

32. **UI interactions created.** Five connected modes, persistent context, discovery filtering, county/region selection, budget/horizon/target controls, staffing/uptake preview, assumption/distribution editing, evidence drilldown, deferred full PSA, stale-result protection, save/duplicate/restore, comparison, portfolio constraints, pilot planning, aggregate period capture and local uptake learning. Methods/Data health/brief views work. Exports remain disabled as previously requested; saved brief reading is available. Desktop, laptop, mobile overflow, keyboard and reduced-motion paths were checked.

33. **End-to-end scenarios validated.** Six saved examples: colorectal navigation in Wayne/Oakland/Macomb (three years), Oakland diabetes prevention (five), Genesee collaborative depression care (three) and Kent pediatric asthma support (three). All use real reviewed effects and separate local/operational assumptions. No monetary benefits are presumed. The identical capacity-constrained navigation totals across the three counties reflect identical funded capacity, not identical population need. See `docs/intervention-model-validation.json`.

34. **Numerical validation.** Hand-reconciled example: 1,200 enrolled, 960 completed, 720 adherent, 240 additional outcomes, $16,800 financial cost, $20,400 resource cost, $24,000 captured benefit and 42.857% program-perspective ROI under explicitly supplied test values. Thresholds recover $3/enrollee budget capacity and $8/enrollee break-even. Tests cover discounting, effect conversions, distributions/moments, zero eligibility, invalid provenance/precision, overlap and baseline/duration bounds. Causal benchmarks test recovery of known truth, not merely execution.

35. **Automated tests.** **28 tests pass**, including 18 intervention tests and 10 existing domain tests. Repository-wide lint, TypeScript checking and production build pass. SQLite immutability, foreign keys, retained source context and integrity are tested. Source/currency/year/geography invariants and bounded HTTP validation are included. Existing build warnings concern the legacy middleware convention and Browserslist metadata.

36. **Playwright tests.** Both intervention and original browser suites pass without page errors. Coverage includes sentiment handoff, evidence/register/audit, editable county/budget/staff, optional outcome target, 10,000-draw PSA, save/duplicate, two-program exact portfolio, implementation/monitoring/learning, stable briefs, disabled export HTTP 403, methods/data health, preserved original filters and responsive widths. New-module checks include 1920/1680/1440/1024/390; the original suite also covers 768 and 1512. Browser checks deliberately avoid live external research dependencies.

37. **Performance testing.** Production intervention benchmark: zero long tasks during 32 staffing edits; 23.8 ms p95 automation-to-two-frames time; 71 ms server computation for 10,000 draws; 84.7 ms first HTTP response and 2.4 ms cached response; 16,556-byte response. Slider previews issue no full-simulation requests; initial sentiment load issues no intervention-catalog request. Original graph benchmark after integration: 270 hover samples, 60 ms scripting, zero plotted-SVG mutations/formatter constructions/long tasks and 9 ms p95 frame interval. These are local measurements, not universal frame-rate guarantees. See `docs/intervention-performance.json`.

38. **Scientific limitations.** One selected primary endpoint per program; no unsupported lifetime tail, disease-progression microsimulation, mortality/utility model or automatic local causal claim. Three archetypes lack numeric effects. Assignment effects are not multiplied by attrition twice; transporting intensity remains an explicit limitation. Independent parameter uncertainty does not quantify structural uncertainty. Applicability review does not validate transportability. Geographic reach is narrower than full equity analysis. The DiD design and bootstrap have small-cluster/confounding limitations.

39. **Data/deployment limitations.** PLACES 2025 contains older measure years; population reference year is unspecified by the returned source and remains unknown. Exact age/clinical eligibility, comparator risks, local prices, contracts and monetary values require local review. ACS needs a key; BLS is not connected. Public discovery is not complete full-text extraction. SQLite persistence requires a writable durable volume and backups. The existing public local-workspace authentication boundary is preserved; hosted multi-tenant authorization and patient-data handling are not claimed. No deployment was performed. Earlier export disabling remains enforced.

40. **Exact operating commands.** Use Node 24. Run from this repository. Browser scripts use an installed Playwright runtime; set `PLAYWRIGHT_MODULE=/absolute/path/to/playwright` if the documented local default is unavailable. CLI refreshes read shell environment, so export `CENSUS_API_KEY` there for optional ACS.

```sh
# Installation and public-source refreshes
npm ci
npm run interventions:refresh-research
npm run interventions:refresh-research -- crc-navigation diabetes-prevention collaborative-depression asthma-home
npm run interventions:refresh-local

# Validate/rebuild/save the six pinned evidence examples
npm run interventions:rebuild-models

# Domain/backend/data/database/economic/simulation/causal tests and static checks
npm test
npm run test:interventions
npm run lint
npm run typecheck
npm run build

# Start Fieldwork (production or development)
npm start
# alternatively: npm run dev

# For isolated browser verification, start this server instead, in a separate terminal
FIELDWORK_DB_PATH=/private/tmp/fieldwork-interventions-test.sqlite npm run start -- --hostname 127.0.0.1 --port 3012

# Run against that server
BASE_URL=http://127.0.0.1:3012 npm run test:ui
BASE_URL=http://127.0.0.1:3012 npm run test:interventions:ui
BASE_URL=http://127.0.0.1:3012 node scripts/profile-interventions.mjs
BASE_URL=http://127.0.0.1:3012 PROFILE_OUTPUT=/private/tmp/fieldwork-chart-profile.json node scripts/profile-chart.mjs
```

The complete formulas, architecture, refresh procedure and boundaries are in [INTERVENTION_SIMULATOR.md](INTERVENTION_SIMULATOR.md). The original sentiment dataset was not regenerated or replaced, no LLM dependency was added, and no export was re-enabled.
