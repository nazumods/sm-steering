import type { AxleSpec, VehicleSpec } from "../geometry/ackermann";
import { MAX_AXLES, MIN_AXLES } from "./spec";

/**
 * Compact URL-hash form of a VehicleSpec, so a setup can be shared as a link.
 *
 *   #a=s0x1s,f6x1s&c=auto&l=a27
 *
 * `a`: one entry per axle, `<mode><gap>x<between><wheel>[t<tilt>]` with mode `s`
 *      (steer) or `f` (fixed), whole-block gap and between, wheel `s` (small) or
 *      `b` (big), and an optional steering-axis tilt in degrees (omitted when 0).
 * `c`: `auto` or a number (blocks behind the front axle).
 * `l`: `a<degrees>` (inner angle, farthest steered axle), `a<degrees>@<axle>`
 *      (inner angle on a 1-based axle), or `r<blocks>` (turn radius).
 */

const num = (n: number) => String(Math.round(n * 1000) / 1000);

export function encodeSpec(spec: VehicleSpec): string {
  const p = new URLSearchParams();
  p.set(
    "a",
    spec.axles
      .map(
        (a) =>
          `${a.mode === "steer" ? "s" : "f"}${num(a.gap)}x${num(a.between)}${a.wheel === "big" ? "b" : "s"}${
            a.tilt ? `t${num(a.tilt)}` : ""
          }`,
      )
      .join(","),
  );
  p.set("c", spec.turnCenter.kind === "auto" ? "auto" : num(spec.turnCenter.position));
  if (spec.limit.kind === "angle") {
    const at = spec.limit.axle === "auto" ? "" : `@${spec.limit.axle + 1}`;
    p.set("l", `a${num(spec.limit.degrees)}${at}`);
  } else {
    p.set("l", `r${num(spec.limit.blocks)}`);
  }
  return p.toString();
}

function parseNumber(s: string | undefined): number | null {
  if (s === undefined || s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseAxle(s: string): AxleSpec | null {
  const m = /^([sf])(\d+)x(\d+)([sb])(?:t(\d+(?:\.\d+)?))?$/.exec(s);
  if (!m) return null;
  const gap = parseNumber(m[2]);
  const between = parseNumber(m[3]);
  const tilt = m[5] === undefined ? 0 : parseNumber(m[5]);
  if (gap === null || between === null || tilt === null) return null;
  return {
    gap,
    between,
    wheel: m[4] === "b" ? "big" : "small",
    tilt,
    mode: m[1] === "s" ? "steer" : "fixed",
  };
}

/** Returns null for anything malformed; callers fall back to a default. */
export function decodeSpec(hash: string): VehicleSpec | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw === "") return null;
  const p = new URLSearchParams(raw);

  const axleText = p.get("a");
  if (!axleText) return null;
  const axles: AxleSpec[] = [];
  for (const part of axleText.split(",")) {
    const a = parseAxle(part);
    if (!a) return null;
    axles.push(a);
  }
  if (axles.length < MIN_AXLES || axles.length > MAX_AXLES) return null;
  axles[0].gap = 0;

  const c = p.get("c") ?? "auto";
  let turnCenter: VehicleSpec["turnCenter"];
  if (c === "auto") turnCenter = { kind: "auto" };
  else {
    const position = parseNumber(c);
    if (position === null) return null;
    turnCenter = { kind: "custom", position };
  }

  const l = p.get("l") ?? "a27";
  let limit: VehicleSpec["limit"];
  const angle = /^a(-?[\d.]+)(?:@(\d+))?$/.exec(l);
  const radius = /^r(-?[\d.]+)$/.exec(l);
  if (angle) {
    const degrees = parseNumber(angle[1]);
    if (degrees === null) return null;
    let axle: "auto" | number = "auto";
    if (angle[2] !== undefined) {
      const idx = Number(angle[2]) - 1;
      if (!Number.isInteger(idx) || idx < 0 || idx >= axles.length) return null;
      axle = idx;
    }
    limit = { kind: "angle", degrees, axle };
  } else if (radius) {
    const blocks = parseNumber(radius[1]);
    if (blocks === null) return null;
    limit = { kind: "radius", blocks };
  } else {
    return null;
  }

  return { axles, turnCenter, limit };
}
