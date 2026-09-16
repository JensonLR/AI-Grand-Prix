# AGP-01 Physics 0.1

The first slice runs at 120 Hz and models mass-independent longitudinal acceleration, speed-sensitive steering/yaw response, aerodynamic drag, surface grip, braking, energy deployment, four tyre state channels, lock-up, slip, temperature, wear, front-wing effectiveness, off-track damage and low-restitution vehicle contact.

Track classification is geometric rather than visual: asphalt, kerb, grass and gravel change grip and rolling resistance. The renderer reads the resulting pose.

This is not yet the target rigid-body, raycast suspension and combined-slip tyre implementation. A future physics adapter will introduce Rapier or a verified Jolt WASM integration while retaining deterministic tests and the public state contract.
