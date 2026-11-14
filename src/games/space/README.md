# Space Scale

An interactive size comparison from a child to Betelgeuse. Ages 6–8 can explore eight stops and answer five questions. Ages 3–5 can use `SpaceViewer` to explore the same stops with the quiz skipped.

## Preview and checks

From the repository root with Node.js 24 and the existing dependencies installed:

```sh
npm run dev
```

Open [the local preview](http://localhost:5173/dev/space-preview.html). Add `?view=1` for the viewer or `?text=1` to hide the speech control. The preview only selects installed English voices marked as local. If no local voice is available, the fact remains on screen. Back and Done display their callback results in the preview.

Use a wheel or swipe over the scene, press ↑ or ↓ while focused inside the journey, tap a stop, or use Previous stop and Next. Select Done to report 8 XP for visiting the last stop, plus 4 XP for each correct answer. The preview can continue offline once it loads. The game does not use storage or external assets.

```sh
node src/games/space/scale.check.ts
npm run typecheck
npm run build
npm run check-content
```

The checks cover monotonic zoom, screen-size bounds, exact stop alignment, ratios, and number formatting. The [screenshots](./screens/) show intro, journey, quiz, and result at 390 and 1280 px.

In desktop Chrome, a scripted fast scroll across all stops produced a 16.7 ms median frame interval and a 16.9 ms 95th percentile at both widths. The 64-frame samples showed zero long tasks and zero vertical scene drift. Browser checks also covered emulated touch at 390 px, 48 px controls and no horizontal overflow at 360 px, reduced motion, local speech callback, offline completion, and the 8–28 XP range. These timings are from desktop Chrome, with mobile dimensions emulated.

## Measurements and sources

The `diameterKm` field is the length compared by the game. It means height for the child and mountain, body length for the whale, and diameter for the celestial objects. Labels round the measurements for reading. The camera interpolates the logarithm of length between stops. Objects share a baseline and a scale, with an 11 px minimum for readability. The Sun beside Betelgeuse is depicted as a glowing 4 px marker.

| Object | Stored size | Source |
| --- | ---: | --- |
| Child | 1.2 m | Example height, in the range shown by the [CDC stature-for-age charts](https://www.cdc.gov/growthcharts/cdc-charts.htm). Children vary in height. |
| Blue whale | 30 m | Representative long blue whale, rounded from [NOAA's 100 ft illustration](https://repository.library.noaa.gov/view/noaa/45820/noaa_45820_DS7.pdf). [NOAA Fisheries](https://www.fisheries.noaa.gov/species/blue-whale/science) describes its diet. |
| Mount Everest | 8,848.86 m | Measured height above sea level, including snow. [Nepal Survey Department, Measurement of Height of Mt. Sagarmatha](https://giwmscdntwo.gov.np/media/pdf_upload/sd%20journal%202078_yvrpebb.pdf). |
| Moon | 3,474.8 km | Twice the mean radius from [NASA/JPL's satellite parameters](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html). |
| Earth | 12,742 km | Twice the volumetric mean radius from the [NASA Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html). |
| Jupiter | 139,822 km | Twice the mean radius from [NASA/JPL's planetary parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html). |
| Sun | 1,391,400 km | Twice the mean radius from the [NASA Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html?level=1). [NASA Hubble](https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/time-travel-observing-cosmic-history/) describes the light travel time. |
| Betelgeuse | About 1.063 billion km | [Joyce et al. (2020)](https://arxiv.org/abs/2006.09837) estimated a radius of 764 solar radii, with a model range of 702–880. Doubling and converting gives roughly 0.98–1.22 billion km. The game uses a coarser 0.9–1.2 billion km range that also includes the rounded [NASA Science estimate](https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/). |

Add objects to `objects.json` with a unique ID and a positive size. Stops sort by size. Reuse an existing `art` key or add an original illustration in `art/ObjectArt.tsx`.

[Integration steps](./INTEGRATION.md)
