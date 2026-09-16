# Connectome integration and scientific integrity

AI Grand Prix is a motorsport simulation and an engineering experiment. The project deliberately separates biological source data from AGP-specific simulation assumptions.

## 1. Real connectome data

The full-connectome target is **BANC v888**, the Female Adult Fly Brain and Nerve Cord dataset.

Current public dataset statistics in FlyWire Codex:

- dataset: BANC
- snapshot: v888
- organism: adult female *Drosophila melanogaster*
- scope: brain + ventral nerve cord / central nervous system
- neurons: 158,262
- thresholded connections: 3,037,361

Primary references:

- Bates AS, Phelps JS, Kim M et al. *Distributed control circuits across a brain-and-cord connectome*. Nature 656, 957–970 (2026). DOI: https://doi.org/10.1038/s41586-026-10735-w
- BANC portal: https://banc.community
- FlyWire Codex BANC explorer: https://codex.flywire.ai/?dataset=banc
- Static archive described by the Nature paper: https://doi.org/10.7910/DVN/7WTH1N

The Nature paper reports a unified adult brain-and-nerve-cord connectome and states that the final print analyses use BANC segmentation/metadata v888 (17 April 2026) with the v2 synapse table. Codex exposes v888 as the current public BANC release.

Codex recommends public bulk analysis through its static downloadable files rather than scraping interactive queries. The expected future AGP import therefore starts from versioned static BANC data products, not a live web dependency during a race.

## 2. What the bundled browser driver is

The browser build currently uses an **AGP SIMULATION INTERFACE**, not the full BANC network.

It is a compact, LIF-inspired aggregate neural system with 48 internal states. It exists so the browser build can already enforce the important causal architecture:

`racing world -> sensory encoder -> neural state -> constrained motor readout -> car controls -> new world state`

The motor readout receives neural activity. It does not receive circuit coordinates, an ideal racing line, target steering, target speed or an optimal braking point.

This gives the project a testable causal neural-control path without falsely claiming that a 158,262-neuron BANC simulation is already running in the browser.

## 3. Simulation assumptions

The following are AGP engineering assumptions, not established neuroscience:

- the mapping from racing observations into aggregate sensory channels
- the 48-state compact LIF-inspired topology
- bounded phenotype perturbations around that topology
- slow homeostatic gain regulation used to keep phenotype activity in a viable operating envelope
- the definition of simulated reinforcement signals
- the mapping from descending aggregate activity into steering, throttle and braking
- constructor-specific sensory filtering and decoder/control-response budgets

These are always labelled **AGP SIMULATION INTERFACE** in the product.

## 4. Persistent driver phenotypes

All championship drivers share the same fundamental aggregate topology in the current browser implementation.

A permanent seed generates tightly bounded differences in:

- firing threshold
- membrane leak
- synaptic gain
- sensory noise
- conduction delay
- adaptation
- plasticity rate
- decoder calibration
- small weight perturbations on the shared topology

The seed is deterministic and stable across sessions. There are no hand-written pace, cornering, rain or aggression skill multipliers.

The current phenotype envelope was tightened after measured race validation showed that a wider neural parameter range could amplify tiny seeded differences into an excessively large lap-time spread. The solution was to constrain physiological variation and add slow homeostatic activity regulation rather than introduce a hidden racing controller.

## 5. Decoder constraint

The decoder is intentionally small and shallow. Its permitted inputs are selected neural activity values produced by the neural system. Tests should fail if a decoder path gains access to forbidden information such as absolute track coordinates, ideal racing-line coordinates, target steering, target speed or optimal brake point.

The sensory encoder is allowed to derive fictional racing sensory channels from the world because it is explicitly the AGP interface between environment and nervous-system simulation.

## 6. State policy

| State | Current policy |
| --- | --- |
| shared neural topology | frozen per software version |
| driver phenotype seed | persistent |
| phenotype parameters | persistent |
| instantaneous membrane/activity state | reset at session boot |
| homeostatic neural gain | adaptive within a bounded session envelope |
| constrained decoder weights | persistent within a software/model version |
| short-timescale adaptation | adaptive, bounded |
| championship statistics | persistent in local storage / race data |
| constructor tuning | data-driven, bounded by technical regulations |
| race weather/tyres/damage | reset per event |

## 7. Super Licence validation

A named championship phenotype is not treated as valid merely because its seed exists.

The headless neutral certification race measures:

- lap completion
- off-track incident rate
- collision incident rate
- best-lap pace ratio

Current gates are:

- lap completion >= 0.96
- off-track rate <= 0.08
- collision rate <= 0.04
- pace ratio >= 0.72

Pace is measured against the **median of the five fastest valid laps**, not the single fastest lap. This is intentional: the gate is a minimum-competence licence, not a fastest-only selection mechanism.

The current deterministic release-candidate certification result is **22 / 22 finishers and 22 / 22 qualified phenotypes** over three laps with seed 4127. The assessment completed in 484.42 seconds and used a 125.292-second robust reference lap.

CI writes an `AGP-SUPER-LICENCE/1` artifact containing the measured driver results and gate metadata.

## 8. Full BANC import path

1. Download and version-lock BANC v888 metadata and connectivity from the published static sources.
2. Record source URLs, hashes, sizes, schema/version and citation information in a reproducible import manifest.
3. Identify sensory, ascending, descending, motor-related and control-relevant populations using dataset annotations.
4. Build sparse connectivity artifacts for local compute while preserving original neuron/root identifiers.
5. Validate that transformations preserve neuron IDs, edge directions and connection weights/counts.
6. Build validation fixtures that compare sparse-artifact summaries against the source CSV statistics.
7. Run the connectome engine in a worker/WASM/native local process rather than the Three.js rendering thread.
8. Stream only neural summaries and constrained descending/readout values into the authoritative race simulation.
9. Keep replay viewing free of connectome resimulation.

Until that pipeline is active and validated, the UI must continue to label neural telemetry as `AGP_SIMULATION_INTERFACE` rather than `BANC_V888_IMPORT`.

## 9. Why BANC rather than brain-only FAFB

FAFB/FlyWire v783 is the adult-female whole-brain dataset. BANC extends the relevant anatomical scope to the ventral nerve cord, making it the more appropriate target for an embodied motor-control project.

## 10. Product boundary today

The compact neural championship is a working product system: 22 persistent neural phenotypes, constructor trade-offs, race weekends, strategy, replays, live neural telemetry and measured certification all run locally in the same application.

The full BANC graph remains a **frontier integration target** because the raw biological connectivity is not bundled or executed by this release candidate. That distinction is part of the product specification, not an implementation detail to hide.
