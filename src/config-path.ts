import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type OpenclawConfigResolution = {
  selectedPath: string | null;
  attemptedPaths: string[];
};

export type OpenclawConfigPathOptions = {
  explicitPath?: string | null;
  cwd?: string;
};

export class OpenclawConfigNotFoundError extends Error {
  attemptedPaths: string[];

  constructor(attemptedPaths: string[]) {
    super("Could not locate OpenClaw config");
    this.name = "OpenclawConfigNotFoundError";
    this.attemptedPaths = attemptedPaths;
  }
}

function expandEnv(input: string): string {
  return input
    .replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] ?? "")
    .replace(/\$([A-Z0-9_]+)/gi, (_, name) => process.env[name] ?? "");
}

function expandHome(input: string): string {
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

function normalizePath(input: string, cwd: string): string {
  const expanded = expandHome(expandEnv(input));
  return path.isAbsolute(expanded) ? expanded : path.resolve(cwd, expanded);
}

function normalizeMaybePath(input?: string | null): string | null {
  if (input === undefined || input === null) return null;
  const trimmed = String(input).trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function resolveOpenclawConfigPath(
  options: OpenclawConfigPathOptions = {},
): OpenclawConfigResolution {
  const cwd = options.cwd ?? process.cwd();
  const attemptedPaths: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (candidate?: string | null) => {
    const raw = normalizeMaybePath(candidate);
    if (!raw) return null;
    const normalized = normalizePath(raw, cwd);
    if (!seen.has(normalized)) {
      attemptedPaths.push(normalized);
      seen.add(normalized);
    }
    if (fs.existsSync(normalized)) {
      return normalized;
    }
    return null;
  };

  let selectedPath = pushCandidate(options.explicitPath);

  if (!selectedPath) {
    selectedPath = pushCandidate(process.env.OPENCLAW_CONFIG_PATH);
  }

  if (!selectedPath && process.env.OPENCLAW_HOME) {
    const home = normalizePath(process.env.OPENCLAW_HOME, cwd);
    selectedPath = pushCandidate(path.join(home, "openclaw.json"));
  }

  if (!selectedPath && process.env.OPENCLAW_STATE_DIR) {
    const stateDir = normalizePath(process.env.OPENCLAW_STATE_DIR, cwd);
    selectedPath = pushCandidate(path.join(path.dirname(stateDir), "openclaw.json"));
  }

  if (!selectedPath) {
    selectedPath = pushCandidate(path.join(os.homedir(), ".openclaw", "openclaw.json"));
  }

  if (!selectedPath) {
    let cursor = path.resolve(cwd);
    while (true) {
      selectedPath = pushCandidate(path.join(cursor, ".openclaw", "openclaw.json"));
      if (selectedPath) break;
      const parent = path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return { selectedPath: selectedPath ?? null, attemptedPaths };
}

export function requireOpenclawConfigPath(
  options: OpenclawConfigPathOptions = {},
): { selectedPath: string; attemptedPaths: string[] } {
  const resolved = resolveOpenclawConfigPath(options);
  if (!resolved.selectedPath) {
    throw new OpenclawConfigNotFoundError(resolved.attemptedPaths);
  }
  return {
    selectedPath: resolved.selectedPath,
    attemptedPaths: resolved.attemptedPaths,
  };
}
