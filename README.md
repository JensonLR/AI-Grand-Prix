# AI GRAND PRIX

**DIFFERENT MINDS. SAME MACHINE.**

AI Grand Prix is an open, zero-cost-first racing simulation in which driver models control identical AGP-01 cars through real steering, throttle, brake and energy commands. Race results come from the simulation, never external benchmark scores.

This repository contains a browser-playable racing product built on a deterministic 120 Hz authoritative simulation. It includes live configurable races, a seekable bundled replay, eight named AI liveries, a human test-drive mode, five broadcast/onboard cameras, a five-light race start, weather grip, tyres, energy, damage, incidents, timing, live battle stories, results, garage and championship surfaces, a purpose-designed 24-corner Azure Coast street circuit and detailed coastal venue, the procedural AGP-01, strict driver protocol, local-model adapters, a headless race runner and automated checks.

## Run it

Requires Node 24+ and npm 11+.

```bash
npm install
npm run dev
```

Open the printed local URL. The default experience requires no account, key or paid API. It uses clearly labelled deterministic reference drivers.

```bash
npm run build
npm run typecheck
npm test
npm run lint
npm run race
```

`npm run race` simulates an offline race without rendering or model calls and writes `data/races/latest.agpr.json`. The browser's Race Archive loads `apps/web/public/replays/demo.agpr.json`; it can be paused, sought, accelerated and viewed from different cameras with zero inference calls.

## Architecture

```text
Driver adapters -> validated control plans -> 120 Hz simulation -> race state
                                                        |-> replay
                                                        `-> Three.js spectator
```

- `packages/sim-core`: fixed-step vehicle, track, surface, tyre, energy, contact and lap state.
- `packages/driver-sdk`: observation/decision contract, validation, reference driver and local HTTP adapters.
- `packages/shared`: versioned shared state.
- `apps/race-runner`: authoritative headless/offline race process.
- `apps/web`: React interface and Three.js spectator renderer. React does not own 120 Hz state.

## Local models

Copy `.env.example` to `.env`. Paid providers remain disabled by default.

For Ollama:

```bash
ollama serve
ollama pull <your-model>
```

Set `OLLAMA_MODEL` to the installed model. `OllamaDriver` uses Ollama's OpenAI-compatible local endpoint. For another local server, set `GENERIC_OPENAI_BASE_URL` and `GENERIC_OPENAI_MODEL`. Credentials stay in the race-runner/server process; they are never bundled into browser JavaScript.

Provider/model connection state must be verified before a grid is labelled with that identity. A provider failure is never silently replaced by another model.

## AI grid and livery system

| Car | Company | Livery logic | Default driver state |
| --- | --- | --- | --- |
| GPT #10 | OpenAI | Ink, ivory and green | Not configured |
| Claude #32 | Anthropic | Terracotta, warm paper and ink | Not configured |
| Gemini #88 | Google | Blue, violet and ivory | Not configured |
| Grok #24 | xAI | Black, ivory and steel | Not configured |
| Qwen #72 | Alibaba Cloud | Violet, cyan and ivory | Not configured |
| DeepSeek #1 | DeepSeek | Electric blue, ice white and navy | Not configured |
| Mistral #7 | Mistral AI | Orange, amber and carbon black | Not configured |
| Llama #70 | Meta | Blue, ivory and cyan | Not configured |

These identities are company-informed colour treatments, not endorsements. The bundled offline exhibition uses deterministic simulated reference profiles for every car. A commercial model is only credited as the active driver after its endpoint and model identity have been verified.

## Benchmark integrity

The current exhibition is `NON-BENCHMARK` because it uses deterministic development drivers. Certified races will lock simulator, car, track, protocol and prompt versions, decision cadence, budgets and seed. Provider latency is excluded through lockstep planning.

## Static deployment

`npm run build` emits `apps/web/dist`, suitable for a static host. A GitHub Pages workflow deploys the spectator when `main` changes. Public spectators consume precomputed race data; they do not trigger AI requests.

## Current limitations

The current vehicle model is a credible lightweight planar model, not yet WASM rigid-body dynamics. Suspension is represented visually but independent wheel contact and detachable component breakage remain roadmap work. Weather grip, live race control, human driving and replay seeking are present; full pit-lane choreography, staged practice/qualifying, safety car logic, production audio sampling, persistent championship storage and commercial-provider orchestration still require further engineering. The procedural car and circuit are deliberately authored, but a future production art pass can take them beyond code-generated geometry.

See [architecture](docs/architecture.md), [physics](docs/physics.md), [driver protocol](docs/ai-driver-protocol.md), [provider setup](docs/provider-setup.md) and [roadmap](docs/roadmap.md).
