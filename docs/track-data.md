# 2027 championship calendar and circuit geometry

AI Grand Prix uses the published **2027 Formula 1 calendar order** as the venue order for the Connectome World Championship.

## Calendar authority

The 24-round order and Sprint designations were announced by the FIA and Formula 1 on 16 September 2026. The in-product calendar stores venue names, dates and Sprint markers as sporting metadata; Formula 1 logos, official calendar artwork and broadcast graphics are not bundled.

## Circuit geometry

Playable circuit centreline geometry is derived from the open-source `bacinger/f1-circuits` GeoJSON dataset:

- Repository: https://github.com/bacinger/f1-circuits
- Licence: MIT
- Data form: geographic LineString centreline geometry
- Imported by: `scripts/sync-2027-circuits.mjs`

The importer converts longitude/latitude into a local 2D plane, resamples each centreline to 192 deterministic points and normalises the simulation-space lap length. The source dataset's circuit length remains stored separately as `officialLengthM` metadata where supplied.

Normalising simulation-space length is intentional: the AGP vehicle and neural-control model was developed around a compact browser simulation scale. It lets Monaco, Spa, Jeddah, Madrid and the other venues use their real layout shape without changing the neural driver's control frequency or forcing kilometres of Three.js world geometry onto mobile devices.

## 2027 round order

1. Bahrain — Sakhir
2. Saudi Arabia — Jeddah
3. Australia — Melbourne
4. Japan — Suzuka
5. China — Shanghai
6. United States — Miami
7. Canada — Montréal
8. Monaco — Monaco
9. Portugal — Portimão
10. Great Britain — Silverstone
11. Austria — Spielberg
12. Belgium — Spa-Francorchamps
13. Hungary — Budapest
14. Italy — Monza
15. Spain — Madrid
16. Azerbaijan — Baku
17. Türkiye — Istanbul
18. Singapore — Singapore
19. United States — Austin
20. Mexico — Mexico City
21. Brazil — São Paulo
22. United States — Las Vegas
23. Qatar — Lusail
24. United Arab Emirates — Yas Marina

The product advances official championship progression in this order. Quick Race and Human Test may select any circuit independently and do not advance championship progression.
