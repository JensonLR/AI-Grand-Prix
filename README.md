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
- a 24-round 2027 season following the published Formula 1 venue order
- all 24 season circuit layouts as playable simulation geometry
- all 24 circuits selectable in Quick Race
- persistent official championship round progression from Bahrain to Abu Dhabi
- Drivers' and Constructors' championship tables
- full Practice -> Qualifying -> Grand Prix weekend progression
- qualifying best laps determining the actual 22-car race grid
- controlled AGP Neutral Driver Test
- telemetry-based AGP Super Licence certification
- **22 / 22 current championship phenotypes certified**
- **24 / 24 season circuits passed by the neural drivability smoke**
- 120 Hz authoritative fixed-step race simulation
- selected-circuit geometry shared by physics, neural observations, rendering, minimaps and replay metadata
- bounded constructor engineering differences
- tyre temperature, wear, wet-weather behaviour, lock-ups and punctures
- energy deployment and regeneration
- component damage and car-to-car contact
- sporting pit entry, limiter, 2.4 s service, tyre changes and exit
- weather-aware automatic tyre strategy
- yellow and VSC race-control response
- restored original AGP Three.js / broadcast presentation baseline
- imported AGP-01 GLB with procedural fallback
- 22-car spectator scene
- broadcast timing tower, selected-circuit map and six camera modes
- live neural telemetry
- Connectome Lab with reproducible phenotype parameter inspection
- deterministic headless race/replay generation
- replay neural summaries
- human keyboard test mode on desktop
- human touch driving controls on mobile
- responsive mobile and desktop product layouts
- iPhone safe-area handling
- installable mobile-web-app manifest
- local/offline-first default operation after the app bundle is loaded
- tested browser build published to the `browser-preview` branch

## 2027 championship calendar

The championship uses the published 2027 Formula 1 venue order as its season order. Sporting names/logos/artwork are not copied into the product; the schedule is factual metadata and the visual system remains AI Grand Prix.

| Rd | Venue | Circuit | Date | Sprint |
|---:|---|---|---|:---:|
| 1 | Bahrain | Sakhir | 12–14 Mar | ✓ |
| 2 | Saudi Arabia | Jeddah | 19–21 Mar | |
| 3 | Australia | Melbourne | 2–4 Apr | ✓ |
| 4 | Japan | Suzuka | 9–11 Apr | ✓ |
| 5 | China | Shanghai | 16–18 Apr | |
| 6 | Miami | Miami | 30 Apr–2 May | |
| 7 | Canada | Montréal | 21–23 May | ✓ |
| 8 | Monaco | Monaco | 4–6 Jun | ✓ |
| 9 | Portugal | Portimão | 18–20 Jun | |
| 10 | Great Britain | Silverstone | 2–4 Jul | ✓ |
| 11 | Austria | Spielberg | 9–11 Jul | |
| 12 | Belgium | Spa-Francorchamps | 23–25 Jul | |
| 13 | Hungary | Budapest | 30 Jul–1 Aug | |
| 14 | Italy | Monza | 3–5 Sep | ✓ |
| 15 | Spain | Madrid | 10–12 Sep | |
| 16 | Azerbaijan | Baku | 24–26 Sep | |
| 17 | Türkiye | Istanbul | 1–3 Oct | |
| 18 | Singapore | Singapore | 8–10 Oct | |
| 19 | United States | Austin | 22–24 Oct | |
| 20 | Mexico | Mexico City | 29–31 Oct | |
| 21 | Brazil | São Paulo | 5–7 Nov | ✓ |
| 22 | Las Vegas | Las Vegas | 19–21 Nov | |
| 23 | Qatar | Lusail | 3–5 Dec | ✓ |
| 24 | Abu Dhabi | Yas Marina | 10–12 Dec | ✓ |

The ten announced Sprint venues are marked in-product. AI Grand Prix does not invent unannounced 2027 Sprint-session regulations simply because a venue is designated as a Sprint event.

### Circuit geometry

Playable centreline data is derived from the MIT-licensed [`bacinger/f1-circuits`](https://github.com/bacinger/f1-circuits) GeoJSON dataset and versioned by `scripts/sync-2027-circuits.mjs`.

The importer:

1. fetches the 24 named venue layouts
2. converts geographic coordinates into a local simulation plane
3. closes and resamples each layout to 192 deterministic points
4. preserves source circuit length as metadata
5. normalises simulation-space lap length so the existing neural/car dynamics remain stable on mobile and desktop
6. writes both TypeScript runtime data and browser-readable JSON

See [`docs/track-data.md`](docs/track-data.md).

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

The selected circuit changes the authoritative geometry seen by the sensory encoder and physics. The motor decoder itself still receives neural activity only. It is not allowed to read absolute circuit coordinates, an ideal racing line, target steering, target speed or an optimal braking point.

All 22 drivers use the same fundamental 48-state topology. Permanent deterministic seeds create tightly bounded differences in firing threshold, membrane leak, synaptic gain, sensory noise, conduction delay, adaptation, plasticity, decoder calibration and tiny shared-topology weight perturbations. A slow homeostatic neural gain keeps those phenotypes inside a viable activity envelope without replacing their neural control with a hidden racing-line bot.

There are no hand-written pace, cornering, rain or aggression skill ratings.

## Neural season validation

`npm run season-smoke` runs the same neural controller on every 2027 layout for one complete lap. The current build passes all 24:

- Sakhir — pass
- Jeddah — pass
- Melbourne — pass
- Suzuka — pass
- Shanghai — pass
- Miami — pass
- Montréal — pass
- Monaco — pass
- Portimão — pass
- Silverstone — pass
- Spielberg — pass
- Spa-Francorchamps — pass
- Budapest — pass
- Monza — pass
- Madrid — pass
- Baku — pass
- Istanbul — pass
- Singapore — pass
- Austin — pass
- Mexico City — pass
- São Paulo — pass
- Las Vegas — pass
- Lusail — pass
- Yas Marina — pass

This is a drivability gate, not a claim that one phenotype is optimally trained for all 24 venues.

## Super Licence

`npm run race` performs the deterministic three-lap **neutral Azure Coast** certification race used by CI. This intentionally remains separate from Round 1; Bahrain should not determine whether a phenotype is allowed to enter the championship.

Current validated result:

- 22 / 22 finishers
- 22 / 22 Super Licence passes
- deterministic seed: `4127`
- assessment time: `538.17 s`
- pace reference: `147.800 s`
- reference method: median of the five fastest valid laps
- minimum pace ratio: `0.72`
- off-track and collision-rate gates remain active

The generated `AGP-SUPER-LICENCE/1` file is written to the replay/build output and exposed to the browser build.

## Scientific integrity

The project does **not** claim that the complete biological BANC graph is already running in-browser.

The full-connectome integration target is **BANC v888**, the adult female *Drosophila melanogaster* brain-and-nerve-cord dataset. The current public BANC resources provide versioned neuron metadata and neuron-to-neuron connectivity suitable for an offline sparse-graph preprocessing pipeline. See [`docs/connectome-integration.md`](docs/connectome-integration.md) and [`data/connectome/manifest.json`](data/connectome/manifest.json).

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

The current physical tuning dimensions are aero efficiency, downforce, mechanical grip, energy system, braking, tyre management, reliability and control response. Static values are clamped around the neutral AGP-01 so machinery can matter without overwhelming driver variation.

## Run locally

Requires Node 24+ and npm 11+.

```bash
npm ci
npm run dev
```

Verification commands:

```bash
npm run lint
npm run typecheck
npm test
npm run season-smoke
npm run race
npm run build
```

`npm run race` writes deterministic neutral-certification outputs to:

- `data/races/latest.agpr.json`
- `apps/web/public/replays/demo.agpr.json`
- `data/connectome/super-licence.json`
- `apps/web/public/connectome/super-licence.json`

No account, commercial API or paid cloud service is required for the default championship experience.

## Repository architecture

```text
packages/shared
  versioned championship/race/track contracts

packages/sim-core
  24 season layouts + Azure Coast neutral test + 120 Hz car/race physics + sporting layer

packages/driver-sdk
  selected-track sensory encoding + seeded phenotype + neural runtime + constrained decoder

apps/race-runner
  24-track neural smoke + neutral 22-driver certification + replay generation

apps/web
  React championship/calendar UI + responsive mobile/desktop product + Three.js renderer
```

## Validation

A publishable branch run must pass:

1. import/version the 24 circuit geometries
2. lint
3. TypeScript project build
4. 17 automated tests
5. 24 / 24 neural single-lap circuit smoke
6. 22 / 22 neutral Super Licence race
7. production browser build
8. browser artifact upload
9. tested preview publication

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
- preserve the restored original visual stack as the presentation baseline

## Frontier work not falsely labelled complete

The 24-round compact-neural championship product is working. Explicit frontier extensions remain:

- full BANC v888 biological connectivity runtime
- complete physical safety-car bunching and red-flag restart choreography
- animated pit crews / full physical pit-lane presentation
- richer incident replay / automated television direction
- final bespoke production constructor identity/livery art pack
- code-splitting and further mobile bundle optimisation
