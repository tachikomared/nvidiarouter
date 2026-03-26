import { startServer } from "./server.js";
import { resolveOpenclawConfigPath, OpenclawConfigNotFoundError } from "./config-path.js";

export const name = "NVIDIA Router";

type NvidiaRouterGlobal = typeof globalThis & {
  __nvidiaRouterServer?: ReturnType<typeof startServer>;
};

function buildConfigErrorResponse(attemptedPaths: string[]) {
  return {
    error: "router_error" as const,
    message: "Could not locate OpenClaw config",
    details: {
      attemptedPaths,
      hint: "Set plugins.entries.nvidiarouter.config.openclawConfigPath or OPENCLAW_CONFIG_PATH",
    },
  };
}

export default function activate(ctx?: any) {
  const g = globalThis as NvidiaRouterGlobal;
  const config = ctx?.config ?? {};

  const explicitPath = config.openclawConfigPath ?? null;

  let resolved: { selectedPath: string | null; attemptedPaths: string[] };
  try {
    resolved = resolveOpenclawConfigPath({ explicitPath });
  } catch {
    resolved = { selectedPath: null, attemptedPaths: [] };
  }

  if (!resolved.selectedPath) {
    console.error("[nvidiarouter] Failed to locate OpenClaw config");
    return {
      name,
      dispose: () => Promise.resolve(),
      __diagnostics: buildConfigErrorResponse(resolved.attemptedPaths),
    };
  }

  if (!g.__nvidiaRouterServer) {
    try {
      g.__nvidiaRouterServer = startServer({
        host: config.host ?? "127.0.0.1",
        port: config.port ?? 8787,
        openclawConfigPath: resolved.selectedPath,
        nvidiaProviderId: config.nvidiaProviderId ?? "nvidia",
        routerProviderId: config.routerProviderId ?? "nvidiarouter",
      });
    } catch (err) {
      if (err instanceof OpenclawConfigNotFoundError) {
        console.error("[nvidiarouter] Config not found:", err.attemptedPaths);
        return {
          name,
          dispose: () => Promise.resolve(),
          __diagnostics: buildConfigErrorResponse(err.attemptedPaths),
        };
      }
      throw err;
    }
  }

  return {
    name,
    dispose: () => {
      return new Promise<void>((resolve, reject) => {
        const server = g.__nvidiaRouterServer;
        if (!server) {
          resolve();
          return;
        }

        server.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          g.__nvidiaRouterServer = undefined;
          resolve();
        });
      });
    },
  };
}
