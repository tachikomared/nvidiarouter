import type { RequestStat, Tier } from "./router/types.js";
import { getAllReliability } from "./reliability.js";

const stats = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalRetries: 0,
  requestsByModel: new Map<string, number>(),
  requestsByTier: new Map<Tier, number>(),
  errorsByModel: new Map<string, number>(),
  latencyByModel: new Map<string, { count: number; totalMs: number }>(),
  inheritedFollowups: 0,
  toolRequests: 0,
  structuredRequests: 0,
  codeHeavyRequests: 0,
  lastRequestAt: 0,
  decisionsBuffer: [] as Array<{
    ts: number;
    plannedModel?: string;
    finalModel?: string;
    upstreamModel?: string;
    tier: Tier | null;
    toolsDetected?: boolean;
    structuredOutput?: boolean;
    codeHeavy?: boolean;
    retryCount?: number;
    success?: boolean;
    statusCode?: number;
  }>,
};

function incMap<K>(map: Map<K, number>, key: K, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function recordRequest(stat: RequestStat): void {
  stats.totalRequests += 1;
  stats.totalRetries += stat.retried;
  stats.lastRequestAt = stat.ts;

  if (stat.tier) {
    incMap(stats.requestsByTier, stat.tier);
  }

  incMap(stats.requestsByModel, stat.selectedModel);

  if (stat.inherited) {
    stats.inheritedFollowups += 1;
  }

  if (stat.toolsDetected) stats.toolRequests += 1;
  if (stat.structuredOutput) stats.structuredRequests += 1;
  if (stat.codeHeavy) stats.codeHeavyRequests += 1;

  stats.decisionsBuffer.push({
    ts: stat.ts,
    plannedModel: stat.plannedModel,
    finalModel: stat.finalModel ?? stat.selectedModel,
    upstreamModel: stat.upstreamModel,
    tier: stat.tier,
    toolsDetected: stat.toolsDetected,
    structuredOutput: stat.structuredOutput,
    codeHeavy: stat.codeHeavy,
    retryCount: stat.retried,
    success: stat.success,
    statusCode: stat.statusCode ?? stat.status,
  });
  if (stats.decisionsBuffer.length > 50) {
    stats.decisionsBuffer.shift();
  }

  const latency = stats.latencyByModel.get(stat.selectedModel) ?? { count: 0, totalMs: 0 };
  latency.count += 1;
  latency.totalMs += stat.latencyMs;
  stats.latencyByModel.set(stat.selectedModel, latency);

  if (stat.status >= 400) {
    incMap(stats.errorsByModel, stat.selectedModel);
  }
}

export function getStats() {
  const requestsByModel = Object.fromEntries(stats.requestsByModel.entries());
  const requestsByTier = Object.fromEntries(stats.requestsByTier.entries());
  const errorsByModel = Object.fromEntries(stats.errorsByModel.entries());

  const latencyByModel = Object.fromEntries(
    Array.from(stats.latencyByModel.entries()).map(([model, value]) => [
      model,
      {
        avgMs: value.count ? value.totalMs / value.count : 0,
        count: value.count,
      },
    ])
  );

  const reliability = getAllReliability();
  const successByModel = Object.fromEntries(
    Object.entries(reliability).map(([modelId, modelStats]) => [
      modelId,
      {
        successRate: modelStats.totalRequests > 0 ? modelStats.successCount / modelStats.totalRequests : 0,
        toolSuccessRate: modelStats.totalRequests > 0 ? modelStats.toolSuccessCount / modelStats.totalRequests : 0,
        structuredSuccessRate: modelStats.totalRequests > 0 ? modelStats.structuredSuccessCount / modelStats.totalRequests : 0,
        totalRequests: modelStats.totalRequests,
        avgLatencyMs: modelStats.avgLatencyMs,
      },
    ])
  );

  return {
    startedAt: stats.startedAt,
    totalRequests: stats.totalRequests,
    totalRetries: stats.totalRetries,
    lastRequestAt: stats.lastRequestAt,
    inheritedFollowups: stats.inheritedFollowups,
    toolRequests: stats.toolRequests,
    structuredRequests: stats.structuredRequests,
    codeHeavyRequests: stats.codeHeavyRequests,
    lastDecisions: stats.decisionsBuffer,
    requestsByModel,
    requestsByTier,
    errorsByModel,
    latencyByModel,
    successByModel,
    reliability,
  };
}

export function getHealthSummary() {
  const uptimeMs = Date.now() - stats.startedAt;

  return {
    startedAt: stats.startedAt,
    uptimeMs,
    totalRequests: stats.totalRequests,
    totalRetries: stats.totalRetries,
    lastRequestAt: stats.lastRequestAt,
    inheritedFollowups: stats.inheritedFollowups,
  };
}
