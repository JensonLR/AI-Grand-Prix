# AI Driver Protocol 1

Drivers receive compact vehicle state, race state, nearby-car data and sampled track headings/boundaries. They are not given an ideal line, optimum braking point or control answer.

Plans contain a horizon, time-indexed steering/throttle/brake values, energy deployment, pit/tyre requests, short public intent/radio and bounded private memory. Zod validates structure; numerical controls are clamped; model text is never executed.

Planning is intentionally slower than physics. The initial driver updates every 0.25 seconds for responsive offline validation. Language models should begin at a configurable 2–4 second horizon, with early replanning on incidents. Certified competition uses one shared system prompt and lockstep requests so network latency does not affect the car.
