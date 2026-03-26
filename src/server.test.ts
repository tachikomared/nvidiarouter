import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import http from "node:http";
import fs from "node:fs";
import { startServer } from "./server.js";

describe("server v0.8.0", () => {
  let server: http.Server;
  let port: number;
  const originalFetch = globalThis.fetch;
  const testConfigPath = "/tmp/test-openclaw-v08.json";
  const testLogDir = "/tmp/test-logs-v08";

  // Use model IDs that match DEFAULT_NVIDIA_ROUTING_CONFIG tiers
  const mockCatalog = [
    { id: "gpt-5-nano", name: "GPT-5 Nano", contextWindow: 128000, cost: { input: 0.1, output: 0.3 } },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", contextWindow: 128000, cost: { input: 0.1, output: 0.3 } },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", contextWindow: 128000, cost: { input: 0.3, output: 1.2 } },
    { id: "gpt-5.4", name: "GPT-5.4", contextWindow: 128000, cost: { input: 0.6, output: 1.8 } },
    { id: "deepseek-v3.2", name: "DeepSeek V3.2", contextWindow: 128000, cost: { input: 0.2, output: 0.6 } },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", contextWindow: 128000, cost: { input: 0.075, output: 0.3 } },
    { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", contextWindow: 128000, cost: { input: 1.25, output: 5.0 } },
    { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", contextWindow: 128000, cost: { input: 0.3, output: 1.2 } },
    { id: "claude-opus-4.6", name: "Claude Opus 4.6", contextWindow: 128000, cost: { input: 3.0, output: 15.0 } },
    { id: "minimax-m2.7", name: "MiniMax M2.7", contextWindow: 128000, cost: { input: 0.3, output: 0.9 } },
    { id: "glm-5", name: "GLM-5", contextWindow: 128000, cost: { input: 0.72, output: 2.3 } },
    { id: "qwen3-coder", name: "Qwen 3 Coder", contextWindow: 128000, cost: { input: 0.2, output: 0.6 } },
    { id: "gpt-5-mini", name: "GPT-5 Mini", contextWindow: 128000, cost: { input: 0.4, output: 1.2 } },
    { id: "gpt-5.2", name: "GPT-5.2", contextWindow: 128000, cost: { input: 1.0, output: 3.0 } },
    { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", contextWindow: 128000, cost: { input: 1.0, output: 3.0 } },
    { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", contextWindow: 128000, cost: { input: 0.3, output: 1.2 } },
    { id: "claude-opus-4.5", name: "Claude Opus 4.5", contextWindow: 128000, cost: { input: 3.0, output: 15.0 } },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", contextWindow: 128000, cost: { input: 0.1, output: 0.4 } },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", contextWindow: 128000, cost: { input: 0.5, output: 1.5 } },
    { id: "grok-4.1-fast", name: "Grok 4.1 Fast", contextWindow: 128000, cost: { input: 0.3, output: 0.9 } },
    { id: "qwen3.5-flash", name: "Qwen 3.5 Flash", contextWindow: 128000, cost: { input: 0.14, output: 0.28 } },
    { id: "qwen3.5-plus", name: "Qwen 3.5 Plus", contextWindow: 128000, cost: { input: 0.28, output: 0.56 } },
    { id: "gemini-3-flash", name: "Gemini 3 Flash", contextWindow: 128000, cost: { input: 0.1, output: 0.4 } },
    { id: "gemini-3-pro", name: "Gemini 3 Pro", contextWindow: 128000, cost: { input: 2.5, output: 10.0 } },
    { id: "kimi-k2.5", name: "Kimi K2.5", contextWindow: 128000, cost: { input: 0.35, output: 1.05 } },
    { id: "minimax-m2.5", name: "MiniMax M2.5", contextWindow: 128000, cost: { input: 0.3, output: 0.9 } },
  ];

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  before(async () => {
    // Create test config
    fs.writeFileSync(
      testConfigPath,
      JSON.stringify({
        models: {
          providers: {
            nvidia: {
              apiKey: "test-key",
              models: mockCatalog,
            },
          },
        },
      })
    );

    // Clean up log dir
    try {
      fs.rmSync(testLogDir, { recursive: true });
    } catch {}
    fs.mkdirSync(testLogDir, { recursive: true });

    process.env.NVIDIA_ROUTER_LOG_DIR = testLogDir;

    // Start server on random port and wait for it to be ready
    const srv = startServer({
      host: "127.0.0.1",
      port: 0,
      openclawConfigPath: testConfigPath,
      nvidiaProviderId: "nvidia",
      routerProviderId: "nvidiarouter",
    });
    server = srv;

    // Wait for server to be listening
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Server start timeout")), 5000);
      srv.on("listening", () => {
        clearTimeout(timeout);
        resolve();
      });
      srv.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    port = (server.address() as any).port;
  });

  after(() => {
    globalThis.fetch = originalFetch;
    server.close();
    try {
      fs.unlinkSync(testConfigPath);
      fs.rmSync(testLogDir, { recursive: true });
    } catch {}
  });

  function request(path: string, body: any, headers?: Record<string, string>) {
    return new Promise<{ status: number; headers: Record<string, string>; body: string }>((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            ...headers,
          },
        },
        (res) => {
          let chunks = "";
          res.on("data", (c) => (chunks += c));
          res.on("end", () => {
            resolve({
              status: res.statusCode || 0,
              headers: res.headers as Record<string, string>,
              body: chunks,
            });
          });
        }
      );
      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }

  describe("/v1/route dry-run", () => {
    it("should return planned model without executing upstream", async () => {
      const res = await request("/v1/route", {
        model: "nvidiarouter/auto",
        messages: [{ role: "user", content: "Hello" }],
      });

      assert.strictEqual(res.status, 200);
      const json = JSON.parse(res.body);
      assert.ok(json.plannedModel);
      assert.ok(json.tier);
      assert.ok(res.headers["x-router-planned-model"]);
      assert.strictEqual(res.headers["x-router-final-model"], undefined);
    });

    it("should not have upstream-model header in dry-run", async () => {
      const res = await request("/v1/route", {
        model: "nvidiarouter/auto",
        messages: [{ role: "user", content: "Test" }],
      });
      assert.strictEqual(res.headers["x-router-upstream-model"], undefined);
    });
  });

  describe("planned-model invariants", () => {
    it("no-retry request => planned == attempted[0] == final", async () => {
      globalThis.fetch = (async () => new Response(
        JSON.stringify({ id: "cmpl-1", object: "chat.completion", model: "gpt-5.4-nano", choices: [] }),
        { status: 200, headers: { "content-type": "application/json" } }
      )) as unknown as typeof fetch;

      const res = await request("/v1/chat/completions", {
        model: "nvidiarouter/auto",
        messages: [{ role: "user", content: "hello" }],
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers["x-router-attempts"], "1");
      assert.strictEqual(res.headers["x-router-planned-model"], res.headers["x-router-final-model"]);
      assert.strictEqual(
        res.headers["x-router-planned-model"],
        String(res.headers["x-router-attempted-models"]).split(",")[0]
      );
    });

    it("retry request => planned == attempted[0], final may differ", async () => {
      let call = 0;
      globalThis.fetch = (async (_url: any, init: any) => {
        call += 1;
        const reqBody = JSON.parse(String(init.body));
        if (call === 1) {
          return new Response(
            JSON.stringify({ error: "rate_limited" }),
            { status: 429, headers: { "content-type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ id: "cmpl-2", object: "chat.completion", model: reqBody.model, choices: [] }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }) as unknown as typeof fetch;

      const res = await request("/v1/chat/completions", {
        model: "nvidiarouter/auto",
        messages: [{ role: "user", content: "function test() { return 1 }\nplease debug this code" }],
      });

      assert.strictEqual(res.status, 200);
      const attempted = String(res.headers["x-router-attempted-models"]).split(",");
      assert.ok(attempted.length >= 2);
      assert.strictEqual(res.headers["x-router-planned-model"], attempted[0]);
      assert.strictEqual(res.headers["x-router-final-model"], attempted[attempted.length - 1]);
    });
  });
});
