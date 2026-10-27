export type InputStatus = 'OFFICIAL DATA' | 'LITERATURE-DERIVED' | 'USER ASSUMPTION' | 'MODELED' | 'OBSERVED' | 'UNVERIFIED';
export interface WorkspaceStorage { mode: 'local' | 'temporary'; label: string; notice: string | null }
export interface WorkspaceHealth { snapshots: number; observations: number; foreignKeys: unknown[]; storage: WorkspaceStorage }
export type EffectMeasure = 'risk_ratio' | 'odds_ratio' | 'hazard_ratio' | 'rate_ratio' | 'risk_difference' | 'percentage_points' | 'mean_difference' | 'standardized_mean_difference' | 'rate_difference' | 'time_to_event';
export type Distribution = { kind: 'fixed' } | { kind: 'normal'; sd: number } | { kind: 'lognormal'; sd: number } | { kind: 'beta'; alpha: number; beta: number } | { kind: 'gamma'; shape: number; scale: number } | { kind: 'triangular'; low: number; mode: number; high: number };
export interface Citation { id: string; title: string; url: string; publisher: string; retrievedAt: string; year: number | null; version: string; license: string; cutoff: string | null }
export interface EffectEvidence {
  id: string; studyId: string; sourceId: string; measure: EffectMeasure; estimate: number | null; low: number | null; high: number | null;
  intervalType: '95% CI' | 'median' | 'not reported'; outcome: string; outcomeId: string; unit: string; direction: 'increase' | 'decrease';
  population: string; setting: string; geography: string; comparator: string; followUpMonths: number | null; followUpNote: string;
  sampleSize: number | null; studies: number; design: string; intensity: string; baselineRisk: number | null; reviewState: 'curated' | 'pending';
  quality: { design: string; precision: string; consistency: string; directness: string; recency: string; implementation: string };
}
export interface EconomicEvidence { id: string; sourceId: string; studyId: string; kind: 'review'; measure: string; value: number | null; low: number | null; high: number | null; currency: 'USD'; priceYear: number | null; unit: string; geography: string; studies: number; perspective: string; note: string }
export interface Intervention {
  id: string; name: string; domain: string; concepts: string[]; description: string; population: string; setting: string; channel: string;
  components: string[]; resources: string[]; minimumStaffing: string; intensity: string; complexity: 'Lower' | 'Moderate' | 'Higher';
  equity: string; applicability: string; sourceIds: string[]; effectIds: string[]; economicIds: string[]; searchedAt: string; searchQuery: string;
  evidenceStrength: 'Strong CPSTF finding' | 'Sufficient CPSTF finding' | 'CPSTF recommendation';
  populationBase: 'adult' | 'child'; needMeasure: string | null; needComplement: boolean;
  defaults: { demographicShare: number; needShare: number; baselineRisk: number; followUpMonths: number; serviceHours: number; variableCost: number; setupCost: number; annualOperatingCost: number; staffFte: number };
  defaultReasons: { demographicShare: string; needShare: string; baselineRisk: string; followUpMonths: string };
  logic: { from: string; to: string; status: 'SUPPORTED' | 'ASSUMED' | 'MODELED'; reason: string; sourceId: string | null }[];
}
export interface CountyMetric { id: string; value: number; low: number | null; high: number | null; year: number; definition: string; unit: '%'; status: 'MODELED'; sourceId: string }
export interface CountyData { fips: string; name: string; total: number; adults: number; populationYear: string; longitude: number; latitude: number; metrics: CountyMetric[] }
export interface LocalData { version: string; retrievedAt: string; source: Citation; counties: CountyData[]; connectors: { id: string; name: string; status: string; reason: string; url: string }[] }
export interface Library { version: string; cutoff: string; sources: Citation[]; interventions: Intervention[]; effects: EffectEvidence[]; economics: EconomicEvidence[] }
export type ParamKey = 'demographicShare' | 'needShare' | 'awareness' | 'contactability' | 'uptake' | 'retention' | 'adherence' | 'staffFte' | 'paidHours' | 'monthlyHours' | 'serviceHours' | 'siteCapacity' | 'referralCapacity' | 'rampMonths' | 'setupCost' | 'annualOperatingCost' | 'hourlyWage' | 'fringeRate' | 'variableCost' | 'opportunityCost' | 'baselineRisk' | 'effect' | 'benefitPerOutcome' | 'costShare' | 'benefitCapture' | 'discountCost' | 'discountOutcome' | 'followUpMonths' | 'lagMonths' | 'nativeSd';
export interface Parameter { value: number; unit: string; status: InputStatus; sourceId: string | null; reason: string; editable: boolean; low: number | null; high: number | null; distribution: Distribution; updatedAt: string }
export type Perspective = 'Program / organization' | 'Payer' | 'Healthcare sector' | 'Public sector' | 'Societal';
export interface CommunitySignal { kind: 'community_signal'; county: string; topic: string; subtopic: string; dateFrom: string; dateTo: string; records: number; scored: number; mean: number | null; change: number | null; narratives: { id: string; text: string; source: string; synthetic: boolean }[]; events: { id: string; label: string; date: string }[]; synthetic: boolean; use: 'problem-discovery-only' }
export interface Scenario {
  schemaVersion: 1; name: string; interventionId: string; counties: string[]; horizonYears: number; budget: number; priceYear: number;
  perspective: Perspective; funder: string; beneficiary: string; goal: string; targetOutcome?: number | null; parameters: Record<ParamKey, Parameter>;
  useLocalNeed: boolean; monetization: 'none' | 'avoided cost' | 'user valuation'; includeAssumedUncertainty: boolean; applicabilityReviewed: boolean;
  seed: number; draws: number; libraryVersion: string; localDataVersion: string; evidenceCutoff: string; modelVersion: string; signal: CommunitySignal | null;
}
export interface ModelIssue { field: string; message: string; severity: 'error' | 'warning' }
export interface CountyResult { fips: string; name: string; population: number; demographic: number; eligible: number; demand: number; enrolled: number; completed: number; covered: number; outcomes: number | null; cost: number; coverage: number; needSource: string; needYear: number | null }
export interface PeriodResult { month: number; enrolled: number; completed: number; matured: number; outcomes: number | null; spend: number; benefits: number | null; cumulativeCost: number; cumulativeBenefit: number | null }
export interface ModelResult {
  modelVersion: string; readiness: 'MODEL WITH CAUTION' | 'KEY INPUTS MISSING' | 'READY TO MODEL' | 'NEEDS LOCAL PILOT'; issues: ModelIssue[];
  population: number; demographic: number; eligible: number; demand: number; capacity: number; reached: number; completed: number; adherent: number; matured: number;
  outcomes: number | null; discountedOutcomes: number | null; effectPerPerson: number | null; treatedRisk: number | null; outcomeUnit: string; outcomeId: string;
  financialCost: number; economicCost: number; perspectiveCost: number; discountedCost: number; grossBenefit: number | null; netBenefit: number | null; netCost: number;
  roi: number | null; bcr: number | null; costPerPerson: number | null; costPerOutcome: number | null; paybackMonth: number | null;
  ledger: { label: string; amount: number; kind: 'financial' | 'economic' }[]; periods: PeriodResult[]; counties: CountyResult[];
  annual: { year: number; spend: number; benefit: number | null; netSpend: number; outcomes: number | null }[];
  insights: string[]; gaps: string[];
}
export interface MetricSummary { mean: number; median: number; low: number; high: number }
export interface SimulationSummary {
  seed: number; draws: number; durationMs: number; varied: { key: ParamKey; kind: string; status: InputStatus }[];
  metrics: { cost: MetricSummary; impact: MetricSummary | null; netBenefit: MetricSummary | null; roi: MetricSummary | null };
  probability: { positiveRoi: number | null; costSaving: number | null; withinBudget: number; targetImpact: number | null };
  histogram: { low: number; high: number; count: number }[]; histogramMetric: string;
  fan: { year: number; low: number; median: number; high: number }[];
  scatter: { cost: number; impact: number }[]; sensitivity: { key: ParamKey; low: number; high: number; lowResult: number; highResult: number; span: number }[];
  sensitivityMetric: string; thresholds: { label: string; value: number | null; unit: string; reason: string }[]; evpi: number | null; caveat: string;
}
export interface SavedScenario { id: string; scenarioId: string; version: number; name: string; createdAt: string; createdBy: string; hash: string; evidenceHash: string; scenario: Scenario; result: ModelResult; simulation: SimulationSummary | null }
export interface ObservedPeriod { id: string; snapshotId: string; month: number; contacted: number; enrolled: number; completed: number; spend: number; outcomes: number | null; fidelity: number | null; sentiment: number | null; note: string; createdAt: string }
export interface ResearchCandidate { id: string; title: string; year: string; doi: string | null; pmid: string | null; pmcid: string | null; studyGroup: string; types: string[]; source: string; url: string; abstract: string; abstractLoaded?: boolean; reviewState: 'pending'; extracted: { measure: string; estimate: number; low: number; high: number; context: string; reviewRequired: true }[] }
export interface ResearchRun { id: string; interventionId: string; query: string; searchedAt: string; source: string; status: 'completed' | 'failed'; error: string | null; candidates: ResearchCandidate[]; excluded: { id: string; reason: string }[]; cached?: boolean }
export interface PortfolioOption { id: string; name: string; county: string; cost: number; impact: number; staff: number; outcomeId: string; months: number; priceYear: number; overlapGroup: string; alternativeGroup?: string; equityReach: number; reach: number }
