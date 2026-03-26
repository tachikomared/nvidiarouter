# NVIDIA Router for OpenClaw

A local, high-performance, and intelligent model router designed for NVIDIA-hosted models. 

## Features
- **Intelligent Tiered Routing**: Automatically routes prompts to the right model (SIMPLE, MEDIUM, COMPLEX, REASONING, VISION) based on capability, cost, and task complexity.
- **BYOK (Bring Your Own Key)**: Full control over your NVIDIA API keys—zero middleman.
- **Optimized Fallbacks**: Automatic tier-based fallback ensures your workflows never fail.
- **Developer-Focused**: Drop-in OpenClaw plugin; requires zero proprietary infrastructure.

## Setup
1.  **Get your API Key**: [build.nvidia.com](https://build.nvidia.com/nvidia/)
2.  **Configuration**: Update your OpenClaw config to use the `nvidiarouter` plugin.
3.  **Run**: Launch your OpenClaw gateway and start building.

## Why this changes everything
Tired of paying premium fees for simple tasks or dealing with locked AI workflows? NVIDIA Router gives you:
- **Free-Tier Leverage**: Maximize the generous free-tier limits provided by NVIDIA’s API.
- **Workflow Resilience**: Intelligent automatic routing ensures you only pay for complexity when it's truly needed.
- **Open Source Autonomy**: Host your own smart routing layer locally. No proprietary SaaS dependencies.
