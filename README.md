# AI GRAND PRIX

## CONNECTOME WORLD CHAMPIONSHIP

**22 BRAINS. 11 MACHINES. ONE GRID.**  
**BIOLOGY AT 300 KM/H.**

AI Grand Prix is an original browser-based motorsport championship in which persistent digital fruit-fly driver phenotypes control Formula-style race cars through a causal neural-control pipeline.

The project is deliberately two things at once: a competitive racing simulation and a technically honest connectome experiment. Race results come from the simulation. No external leaderboard, hidden pace number or scripted winner determines the order.

## Current build

The branch implements:

- 22 persistent seeded digital driver phenotypes
- 11 original constructors, two drivers each
- Drivers' and Constructors' World Championships
- controlled AGP Neutral Driver Test
- 120 Hz authoritative fixed-step race simulation
- bounded constructor engineering differences
- tyre temperature, wear and wet-weather behaviour
- energy deployment and regeneration
- component damage and contact
- original Azure Coast circuit
- Three.js 22-car spectator scene
- broadcast timing tower, interactive track map and six camera modes
- live neural telemetry
- Connectome Lab
- driver and constructor profiles
- human test-driver mode
- deterministic headless race/replay generation
- local/offline-first operation

## Scientific integrity

The live browser neural controller is currently labelled **AGP SIMULATION INTERFACE**.

It is a compact LIF-inspired aggregate neural system that already enforces the intended causal architecture:

```text
RACING WORLD
  -> AGP SENSORY ENCODER
  -> NEURAL STATE
  -> CONSTRAINED MOTOR READOUT
  -> STEERING / THROTTLE / BRAKE
  -> AUTHORITATIVE CAR PHYSICS
  -> NEW WORLD STATE
```

The motor decoder receives neural activity. It is not allowed to read absolute circuit coordinates, an ideal racing line, target steering, target speed or an optimal braking point.

The project does **not** claim that the full biological connectome is already running in-browser. The full-connectome integration target is **BANC v888**, the adult female *Drosophila melanogaster* brain-and-nerve-cord dataset. See [`docs/connectome-integration.md`](docs/connectome-integration.md) and [`data/connectome/manifest.json`](data/connectome/manifest.json).

All 22 championship drivers share one fundamental runtime architecture. Individual differences come from permanent, tightly bounded phenotype seeds rather than hand-written RPG skill ratings.

## Championship grid

| Constructor | Driver 1 | Driver 2 |
| --- | --- | --- |
| McLARVAE RACING | Lando Norwings | Oscar Flyastri |
| MERCED-EYES | George Buzzell | Kimi Antennelli |
| RED BUG RACING | Max Verflappen | Isack Hatchjar |
| SCUDERIA FLYRRARI | Charles LeFlec | Lewis Hamilwing |
| WINGLIAMS RACING | Alex Albuzz | Carlos Swarmz |
| RACING BUGS | Liam Larvson | Arvid Wingblad |
| ASTON MIDGE | Fernando Flylonso | Lance Strollwing |
| HAASFLY | Esteban Ocellon | Ollie Buzman |
| AUD-EYE SPORT | Nico Hoverberg | Gabriel Bortofly |
| FLYPINE | Pierre Gnatsly | Franco Larvapinto |
| CADDIS-LAC RACING | Valtteri Botfly | Sergio Flyrez |

The parody exists in naming. Constructor visual identity, engineering configuration and colour treatment are original rather than copies of real Formula 1 identities.

## Constructor engineering

Every constructor works inside the same regulation envelope. Car and neural-interface differences are bounded trade-offs rather than arbitrary horsepower or driver-skill bonuses.

The current physical tuning dimensions are:

- aero efficiency
- downforce
- mechanical grip
- energy system
- braking
- tyre management
- reliability
- control response

Static values are clamped around the neutral AGP-01 so machinery can matter without overwhelming driver variation.

## Run locally

Requires Node 24+ and npm 11+.

```bash
npm ci
npm run dev
```

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run race
```

`npm run race` runs the same championship machinery headlessly and writes a deterministic replay to:

- `data/races/latest.agpr.json`
- `apps/web/public/replays/demo.agpr.json`

No account, commercial API or paid cloud service is required for the default build.

## Repository architecture

```text
packages/shared
  versioned championship/race contracts

packages/sim-core
  Azure Coast + 120 Hz car/race physics

packages/driver-sdk
  sensory encoding + seeded phenotype + neural runtime + constrained decoder

apps/race-runner
  authoritative local/headless race + replay generation

apps/web
  React championship UI + Three.js spectator/broadcast renderer
```

The rendering thread is not intended to become the eventual full BANC compute engine. Full connectome execution should move into worker/WASM/native local compute and communicate constrained state to the authoritative race simulation.

## Neutral Driver Test

The Neutral Driver Test places every phenotype in the same neutral AGP-01N machinery and conditions. It exists to separate observed driver performance from constructor performance. Neutral-test outputs are analytical and do not secretly alter championship race pace.

## Development principles

- no hidden autonomous racing AI behind a connectome visualiser
- no fake sentience claims
- no arbitrary driver pace/cornering/rain ratings
- no scripted winner
- no paid-compute requirement for the default experience
- no fabricated neural measurements
- no claim of full BANC integration until the import/runtime pipeline is actually validated
- replay once, watch without connectome resimulation

## Status

This is an active build. The compact neural-control path, 22-driver grid, constructor system, championship UI and race simulation are implemented. Full BANC v888 import/runtime integration, deeper academy training, complete pit/race-control systems, richer replay tooling, original constructor symbol assets, final car/environment art and broadcast polish remain development work rather than being falsely marked complete.
