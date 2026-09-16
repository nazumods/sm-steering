# CLAUDE.md

Guidance for working in this repo. Read this before making changes.

## What this is

A single-page React + TypeScript + Vite app that calculates Ackermann steering
angles for Scrap Mechanic vehicles with any number of axles, each of which can be
steered or fixed. Deployed to GitHub Pages from `main`.

## Commands

```
just install     # npm ci
just dev         # vite dev server (http://localhost:5173)
just check       # lint (biome) + typecheck (tsc) + test (vitest)
just build       # tsc --noEmit && vite build -> dist/
just fix         # biome --write
```

Run `just check` before committing. CI runs the same targets.

## Layout

- `src/geometry/ackermann.ts` is the pure solver (`solve(spec)`), with tests in
  `ackermann.test.ts`. Positions are blocks behind the front axle; the turn center
  is a position on that axis. All UI numbers derive from `Solution`.
- `src/state/`: `spec.ts` (types, presets, axle-count helpers), `codec.ts` (URL
  hash encode/decode, tested), `useSpec.ts` (state + hash sync).
- `src/components/`: `VehicleForm`, `AxleTable`, `Diagram` (SVG top-down view),
  `Results` (stats, per-axle angles, bearing table, copy), `Guide`.
- `src/ui/`: `format.ts` (angle/length formatting), `NumberInput.tsx`.
- `src/app.css` holds app layout only.

## Conventions

- **Design system:** consume `@lepid-labs/styles` (`neon-butterfly`) and
  `@lepid-labs/ui-react`. Use `--ld-*` tokens for every color, font, radius and
  spacing value; never literal colors. `app.css` holds layout only. A missing
  component belongs upstream in `Lepid-Labs/lepid-design`, not here.
- Keep the solver pure and framework-free; add a test for any geometry change.
- Encode any new configuration field in `codec.ts` (and its test) so shared
  links keep working; unknown or malformed hashes fall back to the default preset.
- Do not add dependencies without asking.
