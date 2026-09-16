# PROJECT STATE — AI GRAND PRIX / CONNECTOME WORLD CHAMPIONSHIP

Updated: 2026-09-16
Status: **Validated 2027 multitrack release candidate on `connectome-world-championship`**

## Locked product identity

- Product: AI GRAND PRIX
- Championship: CONNECTOME WORLD CHAMPIONSHIP
- Brand line: `22 BRAINS. 11 MACHINES. ONE GRID.`
- Secondary line: `BIOLOGY AT 300 KM/H.`
- Visual source of truth: the restored original AGP Three.js / broadcast presentation. New systems are additive rather than wholesale UI replacements.
- Desktop and mobile are both first-class supported layouts.

## Grid

Exactly 22 persistent digital fly-driver phenotypes, 11 constructors, two drivers per constructor. The roster lives in `apps/web/src/championship.ts` and must not be silently replaced.

Latest neutral Super Licence certification:

- finishers: **22 / 22**
- licensed: **22 / 22**
- deterministic seed: **4127**
- neutral circuit: **Azure Coast**
- assessment: **3 laps**
- completion time: **538.17 s**
- robust pace reference: **147.800 s**, median of the five fastest valid laps
- minimum pace ratio: **0.72**
- off-track and collision-rate gates remain enforced

The robust reference prevents one unusually fast phenotype from turning the licence into fastest-only selection.

## Official 2027 season

The Connectome World Championship now follows the published 2027 Formula 1 venue order as a 24-round season:

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

The ten announced Sprint venues are marked in the calendar UI. Exact future Sprint sporting-session rules are not invented beyond the announced Sprint designation.

Circuit centrelines are versioned simulation data derived from the MIT-licensed `bacinger/f1-circuits` GeoJSON dataset. `scripts/sync-2027-circuits.mjs` imports each venue, converts geographic coordinates to a deterministic local plane, resamples to 192 points and normalises simulation-space length while retaining source circuit length metadata.

Validation status:

- **24 / 24** circuits pass static geometry/tangent/nearest-track tests
- **24 / 24** circuits pass a live single-lap neural drivability smoke with the same fly-brain control path used by races
- Quick Race and Human Test can select any circuit independently
- Official Championship progression is locked to rounds 1 → 24 and persists locally
- Practice → Qualifying → Grand Prix uses the active round layout
- qualifying result becomes that round's 22-car starting grid
- only points-paying Grand Prix sessions advance championship progression

## Fly-brain system

Current live source label: `AGP_SIMULATION_INTERFACE`.

The browser/headless runtime uses a causal 48-state LIF-inspired aggregate neural controller:

`race world -> fictional sensory encoder -> neural dynamics -> constrained neural decoder -> car controls -> new race world`

Every driver shares one fundamental topology. A permanent deterministic seed creates bounded differences in firing threshold, membrane leak, synaptic gain, sensory noise, conduction delay, adaptation, plasticity rate, decoder calibration and tiny shared-topology weight perturbations. Slow homeostatic gain keeps phenotypes inside a viable activity envelope without replacing neural control with a racing-line script.

The motor decoder reads neural activity only. Absolute circuit coordinates, ideal racing-line coordinates, target steering, target speed and optimal braking points are forbidden decoder inputs. Track selection changes the upstream sensory sampling and authoritative physics, not the decoder contract.

There are no hand-authored driver pace/rain/aggression ratings.

## Scientific boundary

Full biological target: **BANC v888**, adult female *Drosophila melanogaster* brain + nerve cord.

The current release candidate does **not** claim the complete biological BANC graph is executing in the browser. Public v888 metadata and neuron-to-neuron connectivity are suitable for an offline version-locked preprocessing pipeline, but the raw graph is not bundled into the mobile product today.

Never expose `BANC_V888_IMPORT` as the live source until a real import, sparse graph build, population mapping and runtime validation have completed. Until then, product telemetry remains explicitly labelled `AGP_SIMULATION_INTERFACE`.

## Implemented product

### UX / platform

- restored original Three.js presentation baseline
- title / paddock / setup / calendar / race / archive / drivers / constructors / standings / Connectome Lab flows
- responsive desktop broadcast layout
- responsive iPhone/mobile layouts with safe-area handling
- mobile touch steering, throttle, brake and deploy in Human Test
- installable mobile-web-app manifest and app mark
- WebGL fallback
- tested production browser build published to `browser-preview`

### Championship / circuits

- 24-round 2027 calendar in published order
- all 24 playable circuit layouts selectable in Quick Race
- current round persistence
- Practice -> Qualifying -> Grand Prix flow
- measured qualifying grid
- Drivers' and Constructors' points persistence
- 10 announced Sprint venues identified without inventing unconfirmed 2027 session rules

### Race simulation

- deterministic 120 Hz fixed-step simulation
- dynamic selected-circuit geometry used by physics, lap progress, boundaries, neural observations, rendering and replay metadata
- tyres / wear / temperature / lock-ups / punctures
- weather, wetness and dry/intermediate/wet grip
- bounded constructor engineering trade-offs
- energy deployment, fuel, component damage and collision response
- sporting pit request / entry / limiter / 2.4 s service / compound change / exit
- weather-aware tyre strategy
- yellow and VSC incident response
- 22-car timing/classification and selected-circuit map
- AGP-01 GLB with procedural fallback
- broadcast / trackside / chase / cockpit / aerial / neural cameras

### Neural / evaluation

- causal sensory -> neural -> decoder path
- seeded persistent phenotype physiology
- homeostatic activity stabilisation
- live neural telemetry and phenotype inspector
- deterministic 160-seed academy candidate generator
- telemetry-based Super Licence gate
- deterministic headless race/replay generator
- 24-circuit neural drivability command (`npm run season-smoke`)

### Validation

Current CI requires all of the following before the browser preview is published:

1. sync/version the 24 circuit geometries
2. lint
3. TypeScript project build
4. **17 automated tests**
5. **24 / 24 neural circuit drivability smoke**
6. **22 / 22 neutral Super Licence certification**
7. production Vite build
8. browser artifact upload
9. tested `browser-preview` publication

## Remaining frontier work — not falsely advertised as complete

1. **Real BANC v888 connectivity runtime** — version-lock public metadata/edgelist, hash them, derive a browser-appropriate sparse motor-control graph, validate IDs/edge direction/weights and execute it off the rendering thread. The current neural controller remains an AGP simulation until that succeeds.
2. **Physical safety car / red-flag restart choreography** — yellow/VSC work; complete SC bunching and red-flag restart regulations/visuals remain future work.
3. **Full pit-lane art** — the sporting stop works; animated crews, individual pit boxes and physical pit-lane choreography can be expanded.
4. **Advanced television direction** — incident replay cuts, battle detection, director automation and richer podium sequences remain an art/product expansion.
5. **Final bespoke constructor identity pack** — current liveries/colours are distinct and functional; production logo/livery art can be upgraded without changing race logic.
6. **Bundle optimisation** — the production build passes but the primary JS bundle is just over 1 MB minified; code splitting is a mobile performance target.

## Repository workflow

- Development branch: `connectome-world-championship`
- Pull request: `#2 Build Connectome World Championship`
- Browser publication branch: `browser-preview`
- Latest fully validated multitrack source run: CI #133 (`516cdcfd989054a9b163b528d0e8123f0198b442`)

Do not merge a change while CI is red or present a biological/data feature more strongly than its implementation supports.
