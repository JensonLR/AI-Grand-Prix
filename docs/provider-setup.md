# Local Connectome Compute Setup

AI Grand Prix no longer requires language-model provider endpoints for championship driving.

The default browser/headless build uses the local `AGP_SIMULATION_INTERFACE` neural runtime and works with no API keys, cloud account or paid service.

## Default

No configuration is required:

```bash
npm ci
npm run dev
```

The environment marker is:

```text
AGP_CONNECTOME_SOURCE=AGP_SIMULATION_INTERFACE
```

## Future BANC v888 import

A full BANC runtime must be local-first and version-locked. `AGP_BANC_DATA_DIR` is reserved for a validated local import directory once that pipeline exists.

The production target is:

```text
BANC data / sparse artifacts
        |
        v
worker / WASM / native local connectome engine
        |
        v
constrained descending/motor readout
        |
        v
authoritative race simulation
```

The renderer must never silently fall back to a hidden autonomous racing bot if connectome compute fails. A failed biological/runtime integration should be visible as an explicit control/runtime failure or use an explicitly labelled AGP simulation mode.
