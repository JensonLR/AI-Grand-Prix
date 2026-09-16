# PROJECT STATE — AI GRAND PRIX / CONNECTOME WORLD CHAMPIONSHIP

Updated: 2026-09-16

## Locked product identity

- Product: AI GRAND PRIX
- Championship: CONNECTOME WORLD CHAMPIONSHIP
- Brand line: `22 BRAINS. 11 MACHINES. ONE GRID.`
- Secondary line: `BIOLOGY AT 300 KM/H.`
- Flagship venue: Azure Coast Grand Prix
- Visual system: cobalt / warm ivory / ink black with restrained gold and constructor colours

## Grid

Exactly 22 persistent digital fly-driver phenotypes, 11 constructors, two drivers per constructor. Roster lives in `apps/web/src/championship.ts` and must not be silently replaced.

## Scientific boundary

Current live source label: `AGP_SIMULATION_INTERFACE`.

The browser/headless runtime is a compact 48-state LIF-inspired aggregate neural controller. It is not the full biological connectome.

Full biological target: BANC v888 adult female Drosophila brain + nerve cord.

Never claim `BANC_V888_IMPORT` until the import/runtime pipeline is actually validated.

The constrained motor readout must not access absolute circuit coordinates, an ideal racing line, target steering, target speed or optimal braking points.

## Implemented on this branch

- expanded shared championship contracts
- 120 Hz fixed-step race physics
- bounded constructor tuning
- tyres / wetness / energy / component damage / collision response
- seeded persistent driver phenotypes
- causal sensory -> neural -> decoder -> control path
- 22-driver / 11-constructor registry
- neutral-car mode
- React championship UI
- Three.js 22-car race scene
- drivers and constructors pages
- Drivers' and Constructors' championship tables
- Connectome Lab
- live timing tower, track map and neural telemetry
- six camera modes
- human keyboard test mode
- deterministic headless race/replay generator
- expanded phenotype and simulation tests
- BANC integration manifest and scientific-integrity documentation
- CI checks: lint, typecheck, tests, headless race, production build

## Explicitly incomplete / next engineering priorities

1. Validate full 22-car race completion and tune any weak phenotypes/start congestion.
2. Implement real start-light sequence and formation/grid presentation.
3. Build physical pit lane, pit boxes, tyre changes and deterministic strategy.
4. Add yellow/VSC/safety-car/red-flag sporting state and penalties.
5. Add full practice -> qualifying -> grid -> race weekend progression.
6. Persist richer driver/constructor career statistics and Neutral Driver Index.
7. Expand replay event markers, incident replay and TV director logic.
8. Improve car geometry/liveries and Azure Coast environment art/LOD/performance.
9. Create original master/constructor symbols and championship visual assets without generated text.
10. Build version-locked BANC v888 import/sparse-compute pipeline for local worker/WASM/native execution.

## Visual-asset rule

If image generation is used, generated assets must contain symbols/art only where possible. Critical text stays HTML/CSS/SVG. Reject malformed insects, accidental letters, watermarks, broken car geometry and generic AI circuitry. Generated work must ultimately be used by the application rather than remaining disconnected concept art.

## Repository workflow

Development branch: `connectome-world-championship`
Draft PR: `#2 Build Connectome World Championship`
Do not merge while CI is red or while a change is known to fake an advertised feature.
