# Architecture

The race-runner owns authoritative state. At each planning boundary it creates observations, pauses simulation time in benchmark mode, obtains all driver plans, validates them and then advances every entrant under the same fixed timestep. Rendering consumes snapshots and cannot alter classification.

The web application runs the same simulation in-process for zero-install live races and human test drives. It can also switch into replay mode, interpolate recorded frames, seek without simulation and select any tracked car or camera. The production boundary remains expressed as packages so the runner can emit live snapshots or `.agpr` replay data to a static spectator.

React owns menus and low-frequency broadcast state. Three.js transforms are updated imperatively. Physics is independent of Three.js and uses no render delta.

Version identifiers live in `@agp/shared`. Authoritative randomness must use `SeededRandom`; uncontrolled `Math.random()` is forbidden in race logic.
