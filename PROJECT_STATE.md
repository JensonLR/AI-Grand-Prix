# PROJECT STATE — AI GRAND PRIX / CONNECTOME WORLD CHAMPIONSHIP

Updated: 2026-09-16
Status: **Release-candidate product milestone on `connectome-world-championship`**

## Locked product identity

- Product: AI GRAND PRIX
- Championship: CONNECTOME WORLD CHAMPIONSHIP
- Brand line: `22 BRAINS. 11 MACHINES. ONE GRID.`
- Secondary line: `BIOLOGY AT 300 KM/H.`
- Flagship venue: Azure Coast Grand Prix
- Visual system: restored Azure Coast scene with cobalt / warm ivory / ink black, restrained gold and constructor colours
- Desktop and mobile are both first-class supported layouts

## Grid

Exactly 22 persistent digital fly-driver phenotypes, 11 constructors, two drivers per constructor. The roster lives in `apps/web/src/championship.ts` and must not be silently replaced.

All 22 named championship phenotypes pass the measured neutral Super Licence smoke race in the current release candidate:

- finishers: **22 / 22**
- licensed: **22 / 22**
- assessment: 3 laps, deterministic seed 4127
- completion time: **484.42 s**
- robust pace reference: **125.292 s**, median of the five fastest valid laps
- minimum pace ratio remains **0.72**
- off-track and collision-rate gates remain enforced

The robust pace reference prevents one unusually fast phenotype from turning the licence into fastest-only selection.

## Fly-brain system

Current live source label: `AGP_SIMULATION_INTERFACE`.

The browser/headless runtime uses a causal 48-state LIF-inspired aggregate neural controller:

`race world -> fictional sensory encoder -> neural dynamics -> constrained neural decoder -> car controls -> new race world`

Every driver shares the same fundamental topology. A permanent deterministic seed creates bounded differences in:

- firing threshold
- membrane leak
- synaptic gain
- sensory noise
- conduction delay
- adaptation
- plasticity rate
- decoder calibration
- tiny shared-topology weight perturbations

A slow homeostatic neural gain keeps phenotypes inside a viable activity envelope without replacing the neural controller with a racing-line script.

The constrained motor decoder reads neural activity only. It must not read absolute circuit coordinates, ideal racing-line coordinates, target steering, target speed or an optimal braking point.

There are no hand-authored driver pace/rain/aggression ratings.

## Scientific boundary

Full biological target: **BANC v888**, adult female *Drosophila melanogaster* brain + nerve cord.

The product does **not** claim the 158,262-neuron biological BANC graph is currently executing in the browser. BANC raw connectivity is not bundled with this repository release candidate.

Never expose `BANC_V888_IMPORT` as the live source until a version-locked import, sparse graph build, population mapping and runtime validation have actually completed. Until then, product telemetry remains explicitly labelled `AGP_SIMULATION_INTERFACE`.

## Implemented on this branch

### Product / UX

- restored original Azure Coast Three.js presentation as the visual source of truth
- full championship title / paddock / setup / race / archive / drivers / constructors / standings / Connectome Lab experience
- desktop broadcast layout
- responsive iPhone / mobile layouts with safe-area handling
- mobile touch steering, throttle, brake and deploy controls in Human Test
- installable mobile-web-app manifest and app mark
- production browser build published to `browser-preview`
- render fallback so the interface remains usable if WebGL fails

### Championship

- exactly 22 persistent drivers and 11 constructors
- Drivers' and Constructors' points tables persisted locally
- Practice -> Qualifying -> Grand Prix weekend state flow
- qualifying best laps determine the 22-car Grand Prix grid
- only the Grand Prix writes championship points
- Quick Race, Neutral Test, Replay and Human Test modes
- deterministic five-light-style launch countdown in the product UI

### Race simulation

- deterministic 120 Hz fixed-step simulation
- tyres, wear, temperatures, lock-ups and puncture state
- dry / intermediate / wet grip behaviour and track wetness
- bounded constructor engineering trade-offs
- energy deployment, fuel, aero/component damage and collision response
- pit requests, pit entry, limiter behaviour, 2.4 s tyre service, compound changes and pit exit
- weather-aware automatic tyre strategy
- yellow and VSC responses after meaningful incidents
- 22-car timing/classification, lap timing and track map
- imported AGP-01 GLB with procedural fallback
- broadcast, trackside, chase, cockpit, aerial and neural camera modes

### Neural / evaluation

- causal sensory -> neural -> decoder control path
- seeded persistent phenotype physiology
- homeostatic firing/activity stabilisation
- live neural telemetry in race HUD
- Connectome Lab with reproducible phenotype parameter inspector
- deterministic 160-seed academy candidate generator
- telemetry-based Super Licence gate
- generated `AGP-SUPER-LICENCE/1` data in CI/build output
- deterministic headless 22-driver race/replay generator
- replay frames include neural summaries when available

### Engineering / validation

- lint passes
- TypeScript project build passes
- unit suite passes
- 22-driver headless certification race passes
- production Vite build passes
- tested browser bundle is uploaded as an Actions artifact
- tested browser bundle is published to `browser-preview`
- regression tests guard the restored scene, connectome product contract and mobile/desktop requirements
- BANC dataset manifest and scientific-integrity documentation

## Remaining frontier work — not falsely advertised as complete

These are extensions beyond the current release-candidate product, not hidden missing pieces of the compact neural championship:

1. **Full BANC v888 biological runtime** — download/version-lock the public BANC files, hash them, construct sparse graph artifacts, map annotated sensory/ascending/descending/motor populations, validate edge direction/weights and execute the biological graph in worker/WASM/native compute. This is intentionally not claimed today.
2. **Physical safety car and red-flag restart procedures** — yellow/VSC exist; full SC bunching, pit-lane rules under SC, red-flag parc-ferme and restart grids do not.
3. **Deeper physical pit presentation** — sporting pit stops work; animated pit crew, per-constructor pit boxes and full pit-lane visual choreography are future art/simulation work.
4. **Multi-round calendar** — the current finished product is the Azure Coast flagship round; a full season of additional circuits remains expansion work.
5. **Advanced television direction** — incident replay cuts, battle detection, automated director logic and richer podium cinematics can be expanded further.
6. **Final constructor identity art pack** — current constructor identity is functional and distinct; bespoke production logo/livery asset packs can be upgraded without changing gameplay architecture.
7. **Bundle optimisation** — the production build passes, but Vite currently warns that the main JS chunk is roughly 985 kB minified; route/scene code splitting is a performance optimisation target.

## Visual-asset rule

If image generation is used, generated assets must contain symbols/art only where possible. Critical text stays HTML/CSS/SVG. Reject malformed insects, accidental letters, watermarks, broken car geometry and generic AI circuitry. Generated work must ultimately be used by the application rather than remaining disconnected concept art.

## Repository workflow

- Development branch: `connectome-world-championship`
- Pull request: `#2 Build Connectome World Championship`
- Browser publication branch: `browser-preview`
- Latest fully validated product commit before this state refresh: `ac0f77a8e2ea6402cb7d9879c065f999911315dc`

Do not merge a later change while CI is red or while a known feature is being presented more strongly than its implementation supports.
