# Architecture

AI Grand Prix separates neural control, authoritative race state and rendering.

```text
RACING ENVIRONMENT
    |
    v
AGP SENSORY ENCODER
    |
    v
CONNECTOME / NEURAL ENGINE
    |
    v
CONSTRAINED MOTOR READOUT
    |
    v
STEERING / THROTTLE / BRAKE
    |
    v
120 Hz AUTHORITATIVE RACE SIM
    |
    +--> replay / championship data
    |
    `--> browser snapshots --> React + Three.js broadcast
```

## Authoritative simulation

`packages/sim-core` owns vehicle and race state. It advances using a fixed 120 Hz timestep and does not depend on render delta. Constructor configuration is clamped inside one technical regulation family. Three.js cannot alter race classification.

## Neural control

`packages/driver-sdk` owns the current compact neural runtime. World state is converted into racing sensory channels before it reaches neural state. The constrained motor readout receives neural activity rather than circuit coordinates or a hidden ideal driving answer.

The current browser runtime is explicitly `AGP_SIMULATION_INTERFACE`. Full BANC v888 execution is a future local compute layer and must not be silently substituted by a scripted racing bot.

## Browser

`apps/web` provides the championship UI and the Three.js spectator scene. React owns menus and low-frequency broadcast state. Three.js transforms are updated imperatively from authoritative snapshots.

A live browser session can run the compact neural system in-process. The long-term full-connectome architecture should move neural compute off the renderer thread through Web Workers, WASM or a local native process.

## Headless race runner

`apps/race-runner` runs the same race/driver packages without rendering and records `.agpr.json` frames. Public spectators should consume precomputed replays rather than rerunning 22 full connectomes.

## Determinism

- championship driver identity has a permanent phenotype seed
- race seeds are explicit
- authoritative race logic must not depend on frame rate
- replay viewing does not require neural resimulation
- uncontrolled randomness is kept out of race outcomes

## Scientific boundary

Real connectome source data, AGP simulation assumptions, trained/adaptive interface components and gameplay systems are documented separately. See `docs/connectome-integration.md`.
