# NVIDIA Router — Install

## Prerequisites

- OpenClaw gateway installed and running
- NVIDIA provider configured in your `~/.openclaw/config.json`
- Node.js v20+ (for local dev only)

## Quick Install

1. **Ensure you're on the latest router version**

   ```bash
   cd ~/tachi/workspace/openclawnvidiarouter
   git pull origin feat/router-v0.7-tool-code
   npm install
   npm run build
   ```

2. **Start the router**

   ```bash
   cd ~/tachi/workspace/openclawnvidiarouter
   npm run start:dev
   ```

3. **Verify it's up**

   ```bash
   curl http://127.0.0.1:8787/health
   ```

   Expected: `{"ok":true,"name":"nvidiarouter","upstream":"https://llm.nvidia.bot/v1",...}`

## Configuration

The router reads model catalog from your existing OpenClaw config. No extra config file required.

If you need to adjust routing behavior, edit `src/router/config.ts` and re-run `npm run build`.

## Production Deploy (Docker)

```bash
cd ~/tachi/workspace/openclawnvidiarouter
docker build -t nvidiarouter .
docker run -d -p 8787:8787 \
  -e OPENCLAW_CONFIG_PATH=/root/.openclaw/config.json \
  -v ~/.openclaw:/root/.openclaw \
  --name nvidiarouter nvidiarouter
```

## Post-Install Checklist

- [ ] `curl /health` returns healthy
- [ ] `/v1/chat/completions` test passes
- [ ] `x-router-planned-model` header appears in responses
- [ ] No error logs in console/gateway
