# Architecture

The race-runner owns authoritative state. At each planning boundary it creates observations, pauses simulation time in benchmark mode, obtains all driver plans, validates them and then advances every entrant under the same fixed timestep. Rendering consumes snapshots and cannot alter classification.

The web application currently runs the same simulation in-process for its zero-install exhibition. The production boundary is already expressed as packages so the runner can emit live snapshots or `.agpr` replay data to a static spectator.

React owns menus and low-frequency broadcast state. Three.js transforms are updated imperatively. Physics is independent of Three.js and uses no render delta.

Version identifiers live in `@agp/shared`. Authoritative randomness must use `SeededRandom`; uncontrolled `Math.random()` is forbidden in race logic.
