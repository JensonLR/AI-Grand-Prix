# Connectome integration and scientific integrity

AI Grand Prix is both a racing product and an engineering experiment. This document separates source biological connectivity from AI Grand Prix modelling assumptions.

## 1. Biological source

The browser runtime target is **BANC v888**, the adult female *Drosophila melanogaster* brain-and-nerve-cord connectome used by the 2026 BANC publication.

The version-locked AGP graph build currently preserves:

- **188,508** mapped metadata rows
- **11,752,828** directed neuron pairs from the public v2 simple edge list
- materialization **888**
- source root/neuron identifiers in `node-ids.txt`

Primary references recorded by the generated manifest include:

- Bates AS, Phelps JS, Kim M et al. *Distributed control circuits across a brain-and-cord connectome*. Nature (2026). DOI: `10.1038/s41586-026-10735-w`
- BANC static archive: `10.7910/DVN/7WTH1N`
- pinned BANC-project metadata snapshot
- official public BANC v888 v2 GCS edge-list artifact

The exact source URLs and SHA-256 values are stored in `apps/web/public/connectome/banc-v888-full/manifest.json`. The graph builder fails when the observed source identity or row counts drift from the pinned contract.

## 2. Bundled browser graph

The processed browser graph is committed under:

`apps/web/public/connectome/banc-v888-full/`

Files:

- `manifest.json` — source identity, hashes, schema and runtime contract
- `offsets.u32` — CSR offsets
- `targets.u32` — directed targets
- `counts.u16` — pair connection counts
- `count-overflow.json` — exact values where a count cannot fit the base storage
- `roles.u8` — mapped functional role labels
- `sensory-buckets.u8` — sensory/visual racing-interface population assignment
- `motor-buckets.u8` — descending/motor racing-interface population assignment
- `node-ids.txt` — source node/root identifiers in graph order

The current processed payload is **75,418,182 bytes**. The public source Feather/Parquet files themselves are not required at race time.

## 3. Runtime architecture

The graph loads in a Web Worker rather than the Three.js render thread. Browser race startup is blocked unless the worker proves:

- schema `BANC-V888-FULL-GRAPH/1`
- materialization `888`
- 188,508 graph rows
- 11,752,828 directed pairs
- `offsets.length === neurons + 1`
- target/count arrays contain every directed pair
- sensory/motor annotation arrays cover every graph row
- the final CSR offset equals the complete pair count

The control loop is:

```text
race world
  -> AGP sensory transduction
  -> BANC sensory / visual populations
  -> sparse graph neural dynamics
  -> descending / motor populations
  -> constrained AGP decoder
  -> steering / throttle / brake / energy deployment
  -> authoritative race physics
  -> next world state
```

The decoder does not receive an ideal racing line, absolute circuit coordinates, target steering, target speed or a hidden optimal brake point.

## 4. What "full BANC runtime" means

AI Grand Prix loads and validates the **complete pinned BANC v888/v2 neuron-pair topology**. Neural activity is sparse: each decision propagates activity from a bounded active frontier rather than iterating every edge indiscriminately. Active nodes use their real outgoing edges from the complete CSR graph.

This keeps the browser workload bounded without replacing the graph with a separate toy topology.

It does **not** mean the project has recreated a living fly or that every biological mechanism is known.

## 5. AGP modelling assumptions

The following are game/simulation assumptions and must not be presented as established neuroscience:

- mapping racing observations to sensory stimulation
- LIF-like voltage/activity state
- firing threshold and leak rules
- global inhibition/homeostatic behaviour
- sparse active-frontier execution
- unsigned treatment of v2 pair counts as connection-strength input
- phenotype seed perturbations and calibration
- short- and long-timescale learning/development rules
- mapping descending/motor activity to vehicle controls
- constructor interface/control trade-offs

The runtime manifest deliberately states this boundary.

## 6. Twenty-two persistent drivers

The championship does not claim 22 separately reconstructed biological flies.

All 22 drivers share the same version-locked BANC topology. Each receives:

- a permanent deterministic phenotype seed
- bounded calibration/physiology differences
- an independent live neural state array
- persistent championship development only where the product contract allows it

Quick Race, Human Test and neutral validation are sandboxes and must not write persistent championship development. This prevents exhibition/test sessions from contaminating the season.

There are no hand-authored driver pace, cornering, wet-weather or aggression skill multipliers.

## 7. Motor-interface constraint

Sensory encoding is allowed to describe racing-relevant observations because it is explicitly the interface between the racing world and the nervous-system simulation.

The downstream motor decoder is intentionally constrained. It reads neural population activity and calibration only. If a future implementation gives it direct access to hidden track geometry or a precomputed optimal driving solution, that would violate the product architecture.

## 8. State policy

| State | Policy |
| --- | --- |
| BANC topology/source graph | frozen per pinned runtime version |
| driver phenotype seed | persistent |
| phenotype/calibration parameters | persistent within championship rules |
| instantaneous neural activity | independent per live driver; reset on fresh session boot |
| championship development | persistent for championship sessions |
| Quick Race / Human Test / neutral development | non-persistent sandbox |
| race tyres/weather/damage | event/session state |
| replay playback | recorded state only; no BANC resimulation required |

## 9. Super Licence and viability

The neutral licence gate exists to ensure the grid remains race-capable without selecting only the fastest generated phenotypes. CI requires all 22 named championship drivers to finish and satisfy the configured minimum-competence gates.

The separate 24-circuit smoke uses the same neural-driving contract to prove that the season geometry remains drivable by the neural system.

## 10. Release integrity

The September 17, 2026 release blocker was a source-artifact drift: the downloaded official v2 edge artifact contained **11,752,828** directed pairs while an older integrity constant expected **11,510,975**.

The build now pins the observed v2 artifact by row count and SHA-256, generates the complete CSR payload, validates it before the race product tests, verifies the same graph again after the production Vite build, and then runs a real Chromium smoke test. The browser preview is not published if any of those gates fail.

## 11. Claim language

Safe, accurate wording:

> AI Grand Prix uses the complete pinned BANC v888/v2 neuron-pair topology as the causal graph foundation for its browser neural drivers, with AGP-modelled neural dynamics and racing sensory/motor interfaces.

Do not describe the product as a biologically exact living-fly simulation or claim that the racing task is a validated neuroscience experiment about natural fly behaviour.
