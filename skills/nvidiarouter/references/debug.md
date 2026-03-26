# NVIDIA Router — Debug Guide

## Common Patterns

### 1. Gateway returns `router_error` / HTTP 500

**Symptom:** `{"error":"router_error","message":"Failed to load NVIDIA provider catalog"}`

**Fix:**
```bash
# Verify OpenClaw config path
curl http://127.0.0.1:8787/v1/route -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"nvidiarouter/auto","messages":[{"role":"user","content":"hi"}]}'

# Check logs
journalctl --user -u openclaw-gateway.service -f | grep router
```

---

### 2. No eligible models found

**Symptom:** `{"error":"router_error","message":"No configured tier models exist in current NVIDIA catalog"}`

**Cause:** Your NVIDIA provider catalog doesn’t include any models in the tier chain.

**Fix:**
- Confirm your `~/.openclaw/config.json` has a `models.providers.nvidia.models` array
- Ensure model IDs match the router config (e.g., `gpt-5.4-mini`, `claude-sonnet-4.6`, etc.)

---

### 3. Correct tier selected but wrong model returned

**Symptom:** Request plans `gpt-5.4-mini` but upstream responds with `gpt-5-nano`

**Check:**
```bash
# Add verbose headers
curl http://127.0.0.1:8787/v1/route -X POST \
  -H "Content-Type: application/json" \
  -H "X-Router-Debug: true" \
  -d '{"model":"nvidiarouter/auto","messages":[{"role":"user","content":"hi"}]}'
```

Look for:
- `x-router-planned-model`
- `x-router-final-model`
- `x-router-tier`
- `x-router-confidence`

---

### 4. Embedded agent fails with "operation was aborted"

**Symptom:** Agent spawned via `sessions_spawn(runtime="subagent")` dies mid-run with abort.

**Known cause:** NVIDIA Router `v0.8.1` has aggressive abort handling. Fixed in `v0.8.2`.

**Verify:**
```bash
curl http://127.0.0.1:8787/health | jq .version
```

If version is `<0.8.2`, update the router:

```bash
cd ~/tachi/workspace/openclawnvidiarouter
git pull origin feat/router-v0.7-tool-code
npm run build
```

---

### 5. Memory search suddenly slow

**Symptom:** `memory_search` calls timing out or returning stale results.

**Check:**
```bash
# Verify QMD is using local embeddings
curl http://127.0.0.1:8787/health
# Check that `memoryProvider: "local"` in gateway logs
journalctl --user -u openclaw-gateway.service | grep qmd
```

**Fix:**
- Ensure `~/models/embeddings/nomic-embed-text-v1.5.Q8_0.gguf` exists
- Confirm config has `agents.defaults.memorySearch.local.modelPath` set correctly

---

## Diagnostic Endpoints

### `/health`
- health status
- uptime
- total requests
- upstream connection status

### `/v1/route` (dry-run)
Use this to test routing without calling upstream:

```bash
curl http://127.0.0.1:8787/v1/route -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "model":"nvidiarouter/auto",
    "messages":[{"role":"user","content":"build a simple flask app"}]
  }'
```

Look for:
- `plannedModel`
- `tier`
- `codeHeavy`
- `structuredOutput`
- `savings`

---

## Log Tail

```bash
# Follow router logs in real-time
journalctl --user -u openclaw-gateway.service -f | grep -E "(router|qmd)"
```

---

## Quick Fix Checklist

| Issue | Command |
|-------|---------|
| Restart router | `systemctl --user restart openclaw-gateway.service` |
| Verify version | `curl http://127.0.0.1:8787/health | jq .version` |
| Force catalog refresh | `rm ~/.cache/qmd/index.sqlite*; systemctl --user restart openclaw-gateway.service` |
| View latest errors | `journalctl --user -u openclaw-gateway.service --since "1 hour ago"` |
