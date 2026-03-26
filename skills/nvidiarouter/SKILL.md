# README

- Name: NVIDIA Router Plugin
- Version: 0.1.0
- Description: Local intelligent routing for NVIDIA-hosted LLM/Vision/Reasoning models within OpenClaw.
- Authors: TachikomaRed / Shikamaru
- License: MIT

## How it works
NVIDIA Router automatically selects the most efficient model from your configured NVIDIA API catalog (Llama 3.x, Mistral, Qwen, DeepSeek, etc.) based on your prompt's complexity tier (SIMPLE, MEDIUM, COMPLEX, REASONING, VISION). It uses local rule-based analysis (token count, keywords, complexity markers) to ensure you always route tasks to the model best suited for your specific request while staying within budget.

## Why this helps
- **Cost Efficiency**: Automatically routes simple prompts to cheaper models (e.g., Ministral 14B) and complex prompts to top-tier models (e.g., Mistral Large 3).
- **Zero Proprietary Locks**: No vendor-specific SDK or platform lock-in.
- **Workflow Resilience**: Built-in fallback chains mean your agentic workflows don't break when a primary model hits limits.

## Setup Instructions
1. Get your API Key at [build.nvidia.com](https://build.nvidia.com/nvidia/).
2. Add the plugin to your `openclaw.json`:
   ```json
   {
     "providers": { "nvidia": { "apiKey": "nvapi-..." } },
     "plugins": { "nvidiarouter": { "enabled": true } }
   }
   ```
3. Use the `nvidiarouter/auto` model alias in your OpenClaw agents.
