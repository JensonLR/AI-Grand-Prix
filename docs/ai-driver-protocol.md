# AGP Neural Driver Protocol 1

A championship driver is a persistent seeded phenotype around one shared neural architecture.

## Control boundary

The permitted causal path is:

```text
world -> sensory encoder -> neural activity -> constrained decoder -> controls
```

The driver produces:

- steering `[-1, 1]`
- throttle `[0, 1]`
- brake `[0, 1]`
- bounded energy deployment

The decoder must not consume:

- absolute circuit coordinates
- ideal racing-line coordinates
- target steering
- target speed
- optimal braking point
- a hidden scripted control solution

Those restrictions make neural activity causally necessary rather than decorative.

## Sensory encoder

The AGP sensory encoder is a fictional interface layer. It may derive bounded racing sensory channels from world state, including heading/flow, edge proximity, relative-car presence, speed/load state and surface condition. This is a simulation assumption, not a biological claim.

## Phenotypes

Each driver has a permanent deterministic seed. Current bounded phenotype parameters include firing threshold, membrane leak, synaptic gain, sensory noise, conduction delay, adaptation/plasticity behaviour and decoder calibration.

Drivers are not given manual `PACE`, `RAIN`, `CORNERING` or similar RPG skill ratings.

## Neural telemetry

Only measurements computed by the runtime may be exposed. Current browser telemetry includes aggregate active state count, spike-rate estimate, sensory/descending activity and the resulting motor outputs.

Telemetry is labelled `AGP_SIMULATION_INTERFACE` until a validated BANC runtime is active.

## Academy / Super Licence

Candidate phenotypes should receive the same curriculum and compute budget. Qualification is a minimum competence gate rather than a fastest-22 ranking. The deterministic seeded draw of qualified phenotypes is intended to preserve diversity while preventing unusable drivers.

## Future full-connectome runtime

A BANC v888 implementation should preserve this same protocol boundary: the browser/race simulator supplies sensory-interface input, the connectome engine produces permitted descending/motor-related activity, and only a documented constrained readout converts that neural activity into car controls.
