import type { ModelReliability } from "./router/types.js";

const reliabilityStore = new Map<string, ModelReliability>();
const cooldownStore = new Map<string, number>();

function getOrCreate(modelId: string): ModelReliability {
  const existing = reliabilityStore.get(modelId);
  if (existing) return existing;
  return {
    successCount: 0,
    errorCount: 0,
    timeoutCount: 0,
    rateLimitCount: 0,
    totalRequests: 0,
    avgLatencyMs: 0,
    toolSuccessCount: 0,
    structuredSuccessCount: 0,
    lastUpdatedAt: Date.now(),
  };
}

export function recordSuccess(modelId: string, latencyMs: number, tools?: boolean, structured?: boolean): void {
  const stats = getOrCreate(modelId);
  const previousTotal = stats.totalRequests;
  stats.successCount += 1;
  stats.totalRequests += 1;
  stats.avgLatencyMs = (stats.avgLatencyMs * previousTotal + latencyMs) / stats.totalRequests;
  if (tools) stats.toolSuccessCount += 1;
  if (structured) stats.structuredSuccessCount += 1;
  stats.lastUpdatedAt = Date.now();
  reliabilityStore.set(modelId, stats);
  cooldownStore.delete(modelId); // Clear cooldown on success
}

export function recordError(modelId: string, status: number): void {
  const stats = getOrCreate(modelId);
  stats.errorCount += 1;
  stats.totalRequests += 1;
  if (status === 408 || status === 504 || status === 0) stats.timeoutCount += 1;
  if (status === 429) {
      stats.rateLimitCount += 1;
      // Set a 2-minute cooldown on 429s
      cooldownStore.set(modelId, Date.now() + 120000);
  } else {
      // Set a 30-second cooldown on other errors
      cooldownStore.set(modelId, Date.now() + 30000);
  }
  stats.lastUpdatedAt = Date.now();
  reliabilityStore.set(modelId, stats);
}

export function isModelInCooldown(modelId: string): boolean {
    const expiration = cooldownStore.get(modelId);
    if (!expiration) return false;
    if (Date.now() > expiration) {
        cooldownStore.delete(modelId);
        return false;
    }
    return true;
}

export function getReliability(modelId: string): ModelReliability | undefined {
  return reliabilityStore.get(modelId);
}

export function getAllReliability(): Record<string, ModelReliability> {
  return Object.fromEntries(reliabilityStore.entries());
}

export function computeReliabilityScore(modelId: string): number {
  if (isModelInCooldown(modelId)) return 0.0; // Heavily penalize models in cooldown

  const stats = getOrCreate(modelId);
  if (stats.totalRequests === 0) return 1.0;

  const successRate = stats.successCount / stats.totalRequests;
  const failurePenalty = stats.errorCount * 0.2 + stats.timeoutCount * 0.4 + stats.rateLimitCount * 0.3;
  const reliability = Math.max(0, successRate - failurePenalty / stats.totalRequests);
  return Math.min(1.0, reliability);
}

export function toolSuccessRate(modelId: string): number {
  const stats = getOrCreate(modelId);
  if (stats.toolSuccessCount === 0) return 0;
  return stats.toolSuccessCount / stats.totalRequests;
}

export function structuredSuccessRate(modelId: string): number {
  const stats = getOrCreate(modelId);
  if (stats.structuredSuccessCount === 0) return 0;
  return stats.structuredSuccessCount / stats.totalRequests;
}
