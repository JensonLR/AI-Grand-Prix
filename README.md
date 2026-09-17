# AI GRAND PRIX

## CONNECTOME WORLD CHAMPIONSHIP

**22 BRAINS. 11 MACHINES. ONE GRID.**  
**BIOLOGY AT 300 KM/H.**

AI Grand Prix is a browser-based fictional motorsport championship in which 22 persistent digital fruit-fly driver phenotypes race for 11 original constructors. Race outcomes come from the authoritative simulation and neural control path rather than scripted winners, hidden pace ratings or external benchmark scores.

## Release status

The `connectome-world-championship` branch is a validated 2027 championship build. The release pipeline refuses to publish unless the complete BANC runtime assets, race product contract, automated tests, 24-circuit drivability gate, 22-driver licence gate, production build and real Chromium browser smoke all pass.

Implemented product:

- 22 persistent fly-driver phenotypes and 11 constructors, two drivers each
- Drivers' and Constructors' championships
- 24-round 2027 season from Bahrain to Abu Dhabi
- all 24 circuits selectable in Quick Race
- Quick Race isolated from championship standings and persistent development
- FP1 / FP2 / FP3, Q1 / Q2 / Q3 and Grand Prix weekend progression
- Sprint Qualifying / Sprint flow on designated Sprint rounds
- measured qualifying grids rather than scripted starting order
- deterministic 120 Hz authoritative vehicle simulation
- tyres, wear, temperature, wet-weather grip, lock-ups and punctures
- energy, fuel, component damage and collisions
- pit entry, limiter, timed service, compound changes and pit exit
- yellow, VSC, Safety Car pace control, red-flag stoppage and controlled rolling restart logic
- weather-aware strategy and premium rain/spray presentation
- 22-car Three.js spectator scene with multiple cameras, timing and live circuit map
- persistent championship standings, driver pages, constructor pages and Connectome Lab
- deterministic race/replay generation and replay playback without neural resimulation
- desktop and mobile layouts, touch Human Test controls and installable web-app metadata
- production browser build published only after a Chromium render smoke test

## Full BANC v888 runtime

The browser product now loads a version-locked sparse graph derived from the public **BANC v888 / v2** neuron-pair connectivity.

Pinned graph identity:

- mapped BANC metadata rows: **188,508**
- directed v2 neuron pairs: **11,752,828**
- sparse runtime payload: **75,418,182 bytes**
- materialization: **888**
- graph schema: `BANC-V888-FULL-GRAPH/1`

The graph is stored as CSR-style browser assets under `apps/web/public/connectome/banc-v888-full/` and loaded in a Web Worker. The release gate checks the manifest identity, array lengths, terminal CSR offset and production-build copy before a race can use the neural runtime.

The racing control path is:

```text
RACE WORLD
  -> AGP sensory transduction
  -> annotated BANC sensory / visual populations
  -> sparse BANC v888/v2 graph propagation
  -> annotated descending / motor populations
  -> constrained AGP motor decoder
  -> steering / throttle / brake / energy deployment
  -> authoritative vehicle physics
  -> new race world state
```

Every championship driver uses the same biological graph topology, while a permanent seed and bounded calibration/development create a persistent digital phenotype. Each live driver has independent neural state.

### Scientific boundary

The **BANC anatomy/connectivity is source data**. The following remain AI Grand Prix modelling assumptions rather than claims about living-fly physiology:

- how racing observations are transduced into neural stimulation
- the LIF-like activity dynamics, leak, threshold and homeostasis
- sparse active-frontier execution used to keep browser compute bounded
- phenotype perturbations and calibration
- how descending/motor population activity is decoded into racing controls
- reinforcement/development rules

The project therefore claims **full BANC v888/v2 neuron-pair topology in the runtime**, not a biophysically complete simulation of a living fruit fly.

See `docs/connectome-integration.md` and the generated runtime manifest at `apps/web/public/connectome/banc-v888-full/manifest.json`.

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

The parody is in the names. Constructor marks, palettes, liveries and engineering identities are original rather than copies of Formula 1 branding or sponsor layouts.

## 2027 season

The championship uses the published 2027 Formula 1 venue order as factual schedule metadata while retaining original AI Grand Prix branding. Circuit centrelines are versioned from the MIT-licensed `bacinger/f1-circuits` dataset by `scripts/sync-2027-circuits.mjs`.

1. Bahrain — Sakhir
2. Saudi Arabia — Jeddah
3. Australia — Melbourne
4. Japan — Suzuka
5. China — Shanghai
6. Miami
7. Canada — Montréal
8. Monaco
9. Portugal — Portimão
10. Great Britain — Silverstone
11. Austria — Spielberg
12. Belgium — Spa-Francorchamps
13. Hungary — Budapest
14. Italy — Monza
15. Spain — Madrid
16. Azerbaijan — Baku
17. Türkiye — Istanbul
18. Singapore
19. United States — Austin
20. Mexico City
21. São Paulo
22. Las Vegas
23. Qatar — Lusail
24. Abu Dhabi — Yas Marina

## Driver fairness

There are no hand-written driver pace, cornering, rain or aggression ratings. Drivers share the same fundamental connectome graph and receive bounded seeded variation plus the same control contract. Championship development can persist for championship sessions; Quick Race, Human Test and neutral validation are strict sandboxes and cannot write persistent driver development.

The neutral Super Licence gate measures minimum competence rather than selecting the 22 fastest candidates. Current release validation certifies all **22 / 22** championship phenotypes, and the 24-circuit neural smoke passes **24 / 24** layouts.

## Run locally

Requires Node 24+ and npm 11+.

```bash
npm ci
npm run dev
```

Verification:

```bash
npm run lint
npm run typecheck
npm test
npm run season-smoke
npm run race
npm run season-replay
npm run build
```

No paid API or commercial model provider is required for the default championship.

## Repository architecture

```text
packages/shared
  championship, race, replay and track contracts

packages/sim-core
  2027 circuit geometry, 120 Hz vehicle physics and championship sporting layer

packages/driver-sdk
  racing observation contract and deterministic fallback/validation driver code

apps/race-runner
  neural circuit smoke, neutral Super Licence certification and replay generation

apps/web
  React product shell, Three.js race presentation, BANC runtime/worker and championship UI

apps/web/public/connectome/banc-v888-full
  version-locked sparse BANC v888/v2 browser graph
```

## Release gates

A publishable branch run must pass all of the following:

1. version/sync the 24 circuit geometries
2. apply and verify the championship product contracts
3. verify the complete BANC v888 browser graph
4. lint
5. TypeScript build/typecheck
6. automated tests
7. 24 / 24 neural circuit drivability smoke
8. 22 / 22 neutral Super Licence certification
9. generate the public Bahrain replay
10. production Vite build
11. verify the BANC graph survived the production copy
12. launch the production bundle in Chromium and prove the cars and full BANC runtime render
13. publish `browser-preview`

## Product boundary

The original crashed-chat release blockers are closed: the BANC edge-count drift is repinned to the observed 11,752,828-pair v2 artifact, the hard runtime-readiness gate is active, and the tested production browser build is publishable again.

Further work is now presentation expansion rather than a missing core system: richer physical pit-lane/crew animation, more elaborate automated television/replay direction and continued bespoke art refinement can be added without changing the validated connectome/race architecture.
