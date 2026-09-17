# sm-steering

Ackermann steering-angle calculator for Scrap Mechanic vehicles, with per-axle
steering control for 4-, 6-, 8- and 10-wheel builds.

**Live:** https://nazumods.github.io/sm-steering/

Give it your axle spacing, the blocks between each axle's bearings, the wheel
size (small or big), and which axles steer. It finds
the turn center, the turn radius, and the inner/outer bearing limits for every
steered axle, including rear axles that need to steer the opposite way, and
lays them out as the left/right limits to enter on a Level 5 Driver's Seat.

Inspired by the two-axle calculator at
[scrapmechanic.org](https://scrapmechanic.org/tools/wheel-angle-calculator);
this one adds multi-axle vehicles, selectable steering per axle, a movable turn
center, and radius-driven limits. The configuration lives in the URL hash so a
setup can be shared as a link.

## How it works

Every wheel on a turning vehicle should roll on a circle around one shared turn
center. That center lies on the line through the fixed axle (or the average of
several fixed axles; if every axle steers, halfway between the first and last).
Given the turn radius `R` measured from the vehicle centerline, each steered
axle at distance `L` from that line with track `T` gets:

```
inner = atan(L / (R - T/2))
outer = atan(L / (R + T/2))
```

All measurements are whole blocks. `T` is the distance between the two wheel
centerlines: the blocks between the bearings, plus one block per bearing, plus
one wheel width (small wheels are 1 block wide, big wheels 2), since each
wheel's center sits half a wheel outboard of its bearing.

Axles ahead of the turn center steer with the front; axles behind it steer the
opposite way.

An axle can also carry a steering-axis tilt: the caster-style build where the
steering bearing leans toward the vehicle center so the wheels lean into turns.
The geometry above is solved at the ground, and the seat settings are then
converted, since turning a bearing on a tilted axis by `d` only yaws the wheel
by `atan(cos t sin d / (cos²t cos d + sin²t))`. With a 30° tilt, a 27° wheel
angle needs about a 31° setting, and the wheel leans `asin(sin t sin d)`. `R` comes from the inner-wheel limit you set on the reference
axle (`R = T/2 + L / tan(inner)`), or directly if you drive the calculator by
turn radius instead.

## Development

```
just install    # npm ci
just dev        # dev server at http://localhost:5173
just check      # lint + typecheck + test
just build      # production build to dist/
```

Built with React, Vite and TypeScript, styled by the
[lepid-design](https://github.com/Lepid-Labs/lepid-design) `neon-butterfly`
theme. Pushes to `main` deploy to GitHub Pages via `.github/workflows/pages.yml`.
