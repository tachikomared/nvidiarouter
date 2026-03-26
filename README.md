# NVIDIA Router for OpenClaw

## High-Performance Intelligent Routing for NVIDIA-Hosted Models

NVIDIA Router is an open-source, intelligent routing layer for [OpenClaw](https://github.com/openclaw/openclaw). It acts as the "brain" for your AI agents, automatically selecting the optimal model for every request based on task complexity, cost, and specific capabilities.

## What makes it different?
- **Intelligent Tiering (SIMPLE to VISION)**: No more "one model fits all." Automatically route tasks to the best-fit model:
  - **SIMPLE**: Low-cost, high-speed tasks (e.g., greetings, simple translations).
  - **MEDIUM**: Mid-range tasks (e.g., creative writing, standard analysis).
  - **COMPLEX**: Deep reasoning and architectural planning.
  - **REASONING**: Advanced chain-of-thought (DeepSeek, GLM, Moonshot).
  - **VISION**: Multimodal image processing and scene understanding.
- **Leverage NVIDIA Free-Tier**: Maximize the generous free-tier limits provided by the [NVIDIA API catalog](https://build.nvidia.com/nvidia/) without proprietary middleman fees.
- **Intelligent Fallback Chains**: If a primary high-performance model hits capacity, the router seamlessly switches to high-performance alternatives without failing your agentic workflow.
- **BYOK (Bring Your Own Key)**: Full ownership. Your API keys, your control.

## Setup
1.  **Get your API Key**: [build.nvidia.com](https://build.nvidia.com/nvidia/)
2.  **Configuration**: Add the plugin to your `openclaw.json` and start routing.
3.  **Run**: Launch your OpenClaw gateway and route prompts to `nvidiarouter/auto`.

## Why this changes everything
Tired of paying premium fees for simple tasks or dealing with locked AI workflows? NVIDIA Router gives you agentic autonomy:
- **Cost-Optimization**: Dynamically prioritize efficiency to get more agent runs per free-tier credit.
- **Workflow Resilience**: Intelligent automatic routing ensures you only pay for complexity when it's truly needed.
- **Open Source Autonomy**: Host your own smart routing layer locally. No proprietary SaaS dependencies.
