import { describe, expect, it } from "vitest";
import type { VehicleSpec } from "../geometry/ackermann";
import { decodeSpec, encodeSpec } from "./codec";
import { PRESETS } from "./spec";

describe("codec", () => {
  it("round-trips every preset", () => {
    for (const p of PRESETS) {
      expect(decodeSpec(encodeSpec(p.spec))).toEqual(p.spec);
    }
  });

  it("round-trips a custom turn center, explicit reference axle, and radius mode", () => {
    const a: VehicleSpec = {
      axles: [
        { gap: 0, between: 3, wheel: "big", tilt: 30, mode: "steer" },
        { gap: 4, between: 3, wheel: "big", tilt: 0, mode: "steer" },
        { gap: 7, between: 0, wheel: "small", tilt: 0, mode: "fixed" },
      ],
      turnCenter: { kind: "custom", position: 8.5 },
      limit: { kind: "angle", degrees: 22.5, axle: 1 },
    };
    expect(decodeSpec(`#${encodeSpec(a)}`)).toEqual(a);

    const b: VehicleSpec = { ...a, limit: { kind: "radius", blocks: 12 } };
    expect(decodeSpec(encodeSpec(b))).toEqual(b);
  });

  it("produces a readable hash", () => {
    expect(encodeSpec(PRESETS[0].spec)).toBe("a=s0x1s%2Cf6x1s&c=auto&l=a27");
    const tilted = {
      ...PRESETS[0].spec,
      axles: [{ ...PRESETS[0].spec.axles[0], tilt: 30 }, PRESETS[0].spec.axles[1]],
    };
    expect(encodeSpec(tilted)).toBe("a=s0x1st30%2Cf6x1s&c=auto&l=a27");
  });

  it("rejects malformed input", () => {
    expect(decodeSpec("")).toBeNull();
    expect(decodeSpec("#")).toBeNull();
    expect(decodeSpec("a=s0x1s")).toBeNull(); // one axle
    expect(decodeSpec("a=s0x1s,zz")).toBeNull();
    expect(decodeSpec("a=s0x1s,f6x1")).toBeNull(); // missing wheel size
    expect(decodeSpec("a=s0x1s,f6.5x1s")).toBeNull(); // fractional blocks
    expect(decodeSpec("a=s0x1s,f6x1s&c=nope")).toBeNull();
    expect(decodeSpec("a=s0x1s,f6x1s&l=x1")).toBeNull();
    expect(decodeSpec("a=s0x1s,f6x1s&l=a27@9")).toBeNull(); // axle out of range
    expect(decodeSpec("nonsense")).toBeNull();
  });

  it("defaults the turn center and limit when omitted", () => {
    expect(decodeSpec("a=s0x1s,f6x1s")).toEqual(PRESETS[0].spec);
  });
});
