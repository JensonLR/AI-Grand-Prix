# Provider Setup

The project boots and races with every environment variable empty. Remote providers are opt-in and paid providers are disabled by default.

Use `OllamaDriver` for Ollama or `OpenAICompatibleDriver` for a local endpoint offering `/models` and `/chat/completions`. Call `initialize()` before displaying `CONNECTED`; an installed model name must come from configuration. Never place keys in `VITE_*` variables or frontend code.

Production provider work still required: server-side registry, per-race request/token budgets, bounded retry and timeout policy, persistent private memory, safety trajectory reuse and explicit `AI CONTROL FAILURE` retirement.
