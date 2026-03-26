export type Tier = "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING" | "VISION";
export type RoutingProfile = "auto";

export type NvidiaModel = {
  id: string;
  name?: string;
  api?: "openai-completions" | "anthropic-messages";
  apiKey?: string;
  input?: Array<"text" | "image">;
  contextWindow?: number;
  maxTokens?: number;
  supportsTools?: boolean;
  cost?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
};

export type TierConfig = {
  primary: string;
  fallback: string[];
};

export type ScoringConfig = {
  tokenCountThresholds: { simple: number; complex: number };

  codeKeywords: string[];
  reasoningKeywords: string[];
  simpleKeywords: string[];
  technicalKeywords: string[];
  creativeKeywords: string[];

  imperativeVerbs: string[];
  constraintIndicators: string[];
  outputFormatKeywords: string[];
  referenceKeywords: string[];
  negationKeywords: string[];
  domainSpecificKeywords: string[];
  agenticTaskKeywords: string[];

  dimensionWeights: Record<string, number>;

  tierBoundaries: {
    simpleMedium: number;
    mediumComplex: number;
    complexReasoning: number;
  };

  confidenceSteepness: number;
  confidenceThreshold: number;
};

export type OverridesConfig = {
  maxTokensForceComplex: number;
  structuredOutputMinTier: Tier;
  ambiguousDefaultTier: Tier;
  enableAgenticAuto: boolean;
};

export type RoutingConfig = {
  scoring: ScoringConfig;
  overrides: OverridesConfig;

  tiers: Record<Tier, TierConfig>;

  followup?: {
    enabled: boolean;
    maxAgeMs: number;
    shortPromptMaxChars: number;
    inheritConfidenceFloor: number;
  };

  retries?: {
    enabled: boolean;
    maxAttempts: number;
    retryOnStatuses: number[];
  };

  server?: {
    authToken?: string;
    rateLimitPerMinute?: number;
    upstreamTimeoutMs?: number;
  };
};

export type DimensionScore = {
  name: string;
  score: number;
  signal: string | null;
};

export type ScoringResult = {
  score: number;
  tier: Tier | null;
  confidence: number;
  signals: string[];
  agenticScore: number;
  dimensions: DimensionScore[];
};

export type RankedCandidate = {
  id: string;
  estimatedCost: number;
  rankingScore?: number;
};

export type RoutingDecision = {
  model: string;
  plannedModel?: string;
  tier: Tier;
  confidence: number;
  chain: string[];
  ranked: RankedCandidate[];
  inherited?: boolean;
  inheritedFromTier?: Tier | null;
  method?: "rules";
  reasoning?: string;
  costEstimate?: number;
  baselineCost?: number;
  savings?: number;
  agenticScore?: number;
  toolsDetected?: boolean;
  structuredOutput?: boolean;
  codeHeavy?: boolean;
  visionDetected?: boolean;
};

export type ConversationState = {
  lastTier: Tier | null;
  lastConfidence: number;
  lastUpdatedAt: number;
  lastSelectedModel?: string;
};

export type RequestStat = {
  ts: number;
  selectedModel: string;
  plannedModel?: string;
  finalModel?: string;
  upstreamModel?: string;
  tier: Tier | null;
  confidence: number;
  latencyMs: number;
  status: number;
  retried: number;
  inherited: boolean;
  toolsDetected?: boolean;
  structuredOutput?: boolean;
  codeHeavy?: boolean;
  visionDetected?: boolean;
  success?: boolean;
  statusCode?: number;
};

export type ModelReliability = {
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  rateLimitCount: number;
  totalRequests: number;
  avgLatencyMs: number;
  toolSuccessCount: number;
  structuredSuccessCount: number;
  lastUpdatedAt: number;
};