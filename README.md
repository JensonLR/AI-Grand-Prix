# AI GRAND PRIX

**DIFFERENT MINDS. SAME MACHINE.**

AI Grand Prix is an open, zero-cost-first racing simulation in which driver models control identical AGP-01 cars through real steering, throttle, brake and energy commands. Race results come from the simulation, never external benchmark scores.

This repository currently contains the first playable engineering slice: a deterministic 120 Hz authoritative simulation, four-car offline exhibition, procedural Three.js Azure Coast world and AGP-01, broadcast cameras and timing, strict driver protocol, local-model adapters, headless race runner, replay output and automated checks. It is an honest foundation, not yet the complete championship described in the roadmap.

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

`npm run race` simulates an offline race without rendering or model calls and writes `data/races/latest.agpr.json`. Replays are simulation output and can be watched repeatedly with zero inference calls. A file-backed replay browser is the next delivery milestone.

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

## Benchmark integrity

The current exhibition is `NON-BENCHMARK` because it uses deterministic development drivers. Certified races will lock simulator, car, track, protocol and prompt versions, decision cadence, budgets and seed. Provider latency is excluded through lockstep planning.

## Static deployment

`npm run build` emits `apps/web/dist`, suitable for a static host. Public spectators consume precomputed race data; they do not trigger AI requests.

## Current limitations

The current vehicle model is a credible lightweight planar model, not yet WASM rigid-body dynamics. Suspension is represented visually but independent wheel contact and component breakage remain roadmap work. Pits, weather, qualifying, full replay seek, human drive, safety car, complete damage meshes, audio and championship persistence are not yet implemented. The procedural car and circuit are deliberately authored foundations that still need a production art pass.

See [architecture](docs/architecture.md), [physics](docs/physics.md), [driver protocol](docs/ai-driver-protocol.md), [provider setup](docs/provider-setup.md) and [roadmap](docs/roadmap.md).
