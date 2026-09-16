import type { AxleSpec, VehicleSpec, WheelSize } from "../geometry/ackermann";

export const MIN_AXLES = 2;
export const MAX_AXLES = 5;

const steer = (gap: number, between: number, wheel: WheelSize): AxleSpec => ({
  gap,
  between,
  wheel,
  mode: "steer",
});
const fixed = (gap: number, between: number, wheel: WheelSize): AxleSpec => ({
  gap,
  between,
  wheel,
  mode: "fixed",
});

const angle = (degrees: number): VehicleSpec["limit"] => ({ kind: "angle", degrees, axle: "auto" });

export interface Preset {
  id: string;
  label: string;
  spec: VehicleSpec;
}

export const PRESETS: Preset[] = [
  {
    id: "car",
    label: "4 wheels: front steer",
    // 1 block between, small wheels: track 4. Matches the scrapmechanic.org default (6 x 4).
    spec: {
      axles: [steer(0, 1, "small"), fixed(6, 1, "small")],
      turnCenter: { kind: "auto" },
      limit: angle(27),
    },
  },
  {
    id: "six-front",
    label: "6 wheels: front steer",
    spec: {
      axles: [steer(0, 2, "big"), fixed(6, 2, "big"), fixed(3, 2, "big")],
      turnCenter: { kind: "auto" },
      limit: angle(27),
    },
  },
  {
    id: "six-both",
    label: "6 wheels: front + rear steer",
    spec: {
      axles: [steer(0, 2, "big"), fixed(5, 2, "big"), steer(5, 2, "big")],
      turnCenter: { kind: "auto" },
      limit: angle(27),
    },
  },
  {
    id: "six-split",
    label: "6 wheels: split, all steer",
    // Front axle alone, rear pair close together. The turn center sits halfway
    // along the vehicle, so the middle axle is behind it and steers reversed.
    spec: {
      axles: [steer(0, 2, "big"), steer(7, 2, "big"), steer(3, 2, "big")],
      turnCenter: { kind: "auto" },
      limit: angle(27),
    },
  },
  {
    id: "eight-front",
    label: "8 wheels: front pair steer",
    spec: {
      axles: [steer(0, 2, "big"), steer(3, 2, "big"), fixed(6, 2, "big"), fixed(3, 2, "big")],
      turnCenter: { kind: "auto" },
      limit: angle(27),
    },
  },
  {
    id: "eight-all",
    label: "8 wheels: all steer",
    spec: {
      axles: [steer(0, 2, "big"), steer(3, 2, "big"), steer(6, 2, "big"), steer(3, 2, "big")],
      turnCenter: { kind: "auto" },
      limit: angle(27),
    },
  },
];

export const DEFAULT_SPEC = PRESETS[0].spec;

/** Structural equality, used to show which preset (if any) the current spec matches. */
export function specEquals(a: VehicleSpec, b: VehicleSpec): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function matchingPreset(spec: VehicleSpec): Preset | undefined {
  return PRESETS.find((p) => specEquals(p.spec, spec));
}

/** Grow or shrink the axle list, keeping existing axles and cloning the last one for new rows. */
export function withAxleCount(spec: VehicleSpec, count: number): VehicleSpec {
  const n = Math.max(MIN_AXLES, Math.min(MAX_AXLES, Math.round(count)));
  const axles = spec.axles.slice(0, n);
  while (axles.length < n) {
    const last = axles[axles.length - 1];
    axles.push({ gap: 4, between: last?.between ?? 2, wheel: last?.wheel ?? "big", mode: "fixed" });
  }
  return { ...spec, axles };
}

export function updateAxle(spec: VehicleSpec, index: number, patch: Partial<AxleSpec>): VehicleSpec {
  return { ...spec, axles: spec.axles.map((a, i) => (i === index ? { ...a, ...patch } : a)) };
}
