import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type RouterLogRecord = {
  ts: string;
  plannedModel?: string;
  finalModel?: string;
  upstreamModel?: string;
  tier?: string | null;
  confidence?: number | null;
  retryCount?: number;
  statusCode?: number;
  latencyMs?: number;
  toolsDetected?: boolean;
  structuredOutput?: boolean;
  codeHeavy?: boolean;
  promptHash?: string;
  abortSource?: string | null;
};

export type LogSeverity = "info" | "warn" | "error";

const LOG_DIR = process.env.NVIDIA_ROUTER_LOG_DIR || path.join(process.cwd(), "logs");
const LOG_FILE = "requests.log";
const MAX_LOG_BYTES = Number(process.env.NVIDIA_ROUTER_LOG_MAX_BYTES || 5 * 1024 * 1024);
const MAX_BACKUPS = Number(process.env.NVIDIA_ROUTER_LOG_BACKUPS || 3);

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogPath() {
  return path.join(LOG_DIR, LOG_FILE);
}

function rotateIfNeeded() {
  try {
    const logPath = getLogPath();
    const stat = fs.statSync(logPath);
    if (stat.size < MAX_LOG_BYTES) return;

    for (let i = MAX_BACKUPS - 1; i >= 0; i -= 1) {
      const src = i === 0 ? logPath : `${logPath}.${i}`;
      const dest = `${logPath}.${i + 1}`;
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    }
  } catch {
    // ignore
  }
}

export function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex");
}

export function logRequest(record: RouterLogRecord, severity: LogSeverity = "info") {
  const payload = {
    ts: record.ts,
    plannedModel: record.plannedModel,
    finalModel: record.finalModel,
    upstreamModel: record.upstreamModel,
    tier: record.tier ?? null,
    confidence: record.confidence ?? null,
    retryCount: record.retryCount ?? 0,
    statusCode: record.statusCode ?? 0,
    latencyMs: record.latencyMs ?? 0,
    toolsDetected: record.toolsDetected ?? false,
    structuredOutput: record.structuredOutput ?? false,
    codeHeavy: record.codeHeavy ?? false,
    promptHash: record.promptHash,
    abortSource: record.abortSource ?? null,
  };

  const line = JSON.stringify(payload);
  if (severity === "error") {
    console.error(line);
  } else if (severity === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }

  try {
    ensureLogDir();
    rotateIfNeeded();
    fs.appendFileSync(getLogPath(), `${line}\n`);
  } catch {
    // ignore
  }
}
