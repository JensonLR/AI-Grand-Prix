# AI GRAND PRIX

## CONNECTOME WORLD CHAMPIONSHIP

**22 BRAINS. 11 MACHINES. ONE GRID.**  
**BIOLOGY AT 300 KM/H.**

AI Grand Prix is an original browser-based motorsport championship in which persistent digital fruit-fly driver phenotypes control Formula-style race cars through a causal neural-control pipeline.

The project is deliberately two things at once: a competitive racing simulation and a technically honest connectome experiment. Race results come from the simulation. No external leaderboard, hidden pace number or scripted winner determines the order.

## Current release-candidate build

The `connectome-world-championship` branch implements:

- exactly 22 persistent seeded digital driver phenotypes
- 11 original constructors, two drivers each
- Drivers' and Constructors' championship tables
- full Practice -> Qualifying -> Grand Prix weekend progression
- qualifying best laps determining the actual 22-car race grid
- controlled AGP Neutral Driver Test
- telemetry-based AGP Super Licence certification
- **22 / 22 current championship phenotypes certified** in the deterministic neutral smoke race
- 120 Hz authoritative fixed-step race simulation
- bounded constructor engineering differences
- tyre temperature, wear, wet-weather behaviour, lock-ups and punctures
- energy deployment and regeneration
- component damage and car-to-car contact
- sporting pit entry, limiter, 2.4 s service, tyre changes and exit
- weather-aware automatic tyre strategy
- yellow and VSC race-control response
- restored Azure Coast Three.js visual environment
- imported AGP-01 GLB with procedural fallback
- 22-car spectator scene
- broadcast timing tower, track map and six camera modes
- live neural telemetry
- Connectome Lab with reproducible phenotype parameter inspection
- deterministic headless race/replay generation
- replay neural summaries
- human keyboard test mode on desktop
- human touch driving controls on mobile
- responsive mobile and desktop product layouts
- iPhone safe-area handling
- installable mobile-web-app manifest
- local/offline-first default operation
- tested browser build published to the `browser-preview` branch

## Fly-brain system

The live browser neural controller is labelled **AGP SIMULATION INTERFACE**.

It is a compact LIF-inspired aggregate neural system that enforces the intended causal architecture:

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

All 22 drivers use the same fundamental 48-state topology. Permanent deterministic seeds create tightly bounded differences in firing threshold, membrane leak, synaptic gain, sensory noise, conduction delay, adaptation, plasticity, decoder calibration and tiny shared-topology weight perturbations. A slow homeostatic neural gain keeps those phenotypes inside a viable activity envelope without replacing their neural control with a hidden racing-line bot.

There are no hand-written pace, cornering, rain or aggression skill ratings.

## Super Licence

`npm run race` performs the deterministic three-lap neutral certification race used by CI.

Current validated result:

- 22 / 22 finishers
- 22 / 22 Super Licence passes
- deterministic seed: `4127`
- assessment time: `484.42 s`
- pace reference: `125.292 s`
- reference method: median of the five fastest valid laps
- minimum pace ratio: `0.72`
- off-track and collision-rate gates remain active

The robust reference is deliberate: one unusually fast phenotype cannot make the licence a fastest-only selection test.

The generated `AGP-SUPER-LICENCE/1` file is written to the build/replay output and exposed to the browser build.

## Scientific integrity

The project does **not** claim that the complete biological BANC graph is already running in-browser.

The full-connectome integration target is **BANC v888**, the adult female *Drosophila melanogaster* brain-and-nerve-cord dataset. The current public BANC release contains 158,262 neurons and 3,037,361 thresholded connections. See [`docs/connectome-integration.md`](docs/connectome-integration.md) and [`data/connectome/manifest.json`](data/connectome/manifest.json).

The raw BANC connectivity files are not bundled in this release candidate. The live source therefore remains `AGP_SIMULATION_INTERFACE`. It must not be changed to `BANC_V888_IMPORT` until a version-locked import, sparse graph build, population mapping and runtime validation have actually been completed.

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
npm run race
npm run build
```

`npm run race` runs the same championship neural/sporting stack headlessly and writes deterministic outputs to:

- `data/races/latest.agpr.json`
- `apps/web/public/replays/demo.agpr.json`
- `data/connectome/super-licence.json`
- `apps/web/public/connectome/super-licence.json`

No account, commercial API or paid cloud service is required for the default championship experience.

## Repository architecture

```text
packages/shared
  versioned championship/race contracts

packages/sim-core
  Azure Coast + 120 Hz car/race physics + championship sporting layer

packages/driver-sdk
  sensory encoding + seeded phenotype + neural runtime + constrained decoder

apps/race-runner
  authoritative local/headless race + replay + Super Licence generation

apps/web
  React championship UI + responsive mobile/desktop product + Three.js renderer
```

The rendering thread is not intended to become the eventual full BANC compute engine. Full connectome execution should move into worker/WASM/native local compute and communicate only constrained neural summaries/readout state to the authoritative race simulation.

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
- mobile and desktop must both remain usable product targets
- preserve the restored Azure Coast visual scene as the presentation baseline

## Validation

The release-candidate branch is guarded by CI that runs:

1. lint
2. TypeScript project build
3. unit tests
4. the full 22-driver headless certification race
5. production browser build
6. browser artifact upload
7. tested preview publication

The latest validated product build before this documentation refresh passed every stage and published the tested browser bundle.

## What is intentionally not claimed complete

The compact neural championship product is working. These are explicit frontier extensions rather than hidden completed features:

- full 158,262-neuron BANC v888 biological graph execution
- physical safety-car bunching and red-flag restart procedures
- animated pit crews / full pit-lane choreography
- multi-circuit season calendar beyond Azure Coast
- richer incident replay / automated television director logic
- final bespoke production constructor logo/livery art pack
- production JS code splitting beyond the current passing build
