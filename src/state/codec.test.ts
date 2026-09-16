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
        { gap: 0, track: 5.5, mode: "steer" },
        { gap: 4.25, track: 5.5, mode: "steer" },
        { gap: 7, track: 6, mode: "fixed" },
      ],
      turnCenter: { kind: "custom", position: 8.5 },
      limit: { kind: "angle", degrees: 22.5, axle: 1 },
    };
    expect(decodeSpec(`#${encodeSpec(a)}`)).toEqual(a);

    const b: VehicleSpec = { ...a, limit: { kind: "radius", blocks: 12 } };
    expect(decodeSpec(encodeSpec(b))).toEqual(b);
  });

  it("produces a readable hash", () => {
    expect(encodeSpec(PRESETS[0].spec)).toBe("a=s0x4%2Cf6x4&c=auto&l=a27");
  });

  it("rejects malformed input", () => {
    expect(decodeSpec("")).toBeNull();
    expect(decodeSpec("#")).toBeNull();
    expect(decodeSpec("a=s0x4")).toBeNull(); // one axle
    expect(decodeSpec("a=s0x4,zz")).toBeNull();
    expect(decodeSpec("a=s0x4,f6x4&c=nope")).toBeNull();
    expect(decodeSpec("a=s0x4,f6x4&l=x1")).toBeNull();
    expect(decodeSpec("a=s0x4,f6x4&l=a27@9")).toBeNull(); // axle out of range
    expect(decodeSpec("nonsense")).toBeNull();
  });

  it("defaults the turn center and limit when omitted", () => {
    expect(decodeSpec("a=s0x4,f6x4")).toEqual(PRESETS[0].spec);
  });
});
