import { describe, expect, it } from "vitest";
import {
  type AxleSpec,
  autoTurnCenter,
  axlePositions,
  farthestSteeredAxle,
  solve,
  type VehicleSpec,
  wheelLimits,
} from "./ackermann";

const steer = (gap: number, track = 4): AxleSpec => ({ gap, track, mode: "steer" });
const fixed = (gap: number, track = 4): AxleSpec => ({ gap, track, mode: "fixed" });

function spec(axles: AxleSpec[], extra: Partial<VehicleSpec> = {}): VehicleSpec {
  return {
    axles,
    turnCenter: { kind: "auto" },
    limit: { kind: "angle", degrees: 27, axle: "auto" },
    ...extra,
  };
}

function ok(s: VehicleSpec) {
  const r = solve(s);
  if (!r.ok) throw new Error(r.errors.join("\n"));
  return r;
}

describe("axlePositions", () => {
  it("accumulates gaps from the front axle", () => {
    expect(axlePositions([steer(0), fixed(6), fixed(3)])).toEqual([0, 6, 9]);
  });
});

describe("autoTurnCenter", () => {
  it("is the single fixed axle", () => {
    expect(autoTurnCenter([steer(0), fixed(6)], [0, 6])).toBe(6);
  });
  it("is the mean of several fixed axles", () => {
    expect(autoTurnCenter([steer(0), fixed(6), fixed(3)], [0, 6, 9])).toBe(7.5);
  });
  it("is the vehicle midpoint when every axle steers", () => {
    expect(autoTurnCenter([steer(0), steer(4), steer(4)], [0, 4, 8])).toBe(4);
  });
});

describe("solve: two-axle car", () => {
  // Matches the scrapmechanic.org calculator's default: 6 x 4, 27 deg inner.
  it("reproduces the reference outer angle and radii", () => {
    const r = ok(spec([steer(0), fixed(6)]));
    const front = r.axles[0];
    expect(front.inner).toBeCloseTo(27, 6);
    expect(front.outer).toBeCloseTo(20.82, 2);
    expect(r.radius).toBeCloseTo(13.78, 2);
    expect(front.outerRadius).toBeCloseTo(16.88, 2);
    expect(front.direction).toBe("normal");
    expect(r.axles[1].direction).toBe("none");
    expect(r.referenceAxle).toBe(0);
    expect(r.warnings).toEqual([]);
  });

  it("radius mode gives the same geometry as the equivalent angle", () => {
    const byAngle = ok(spec([steer(0), fixed(6)]));
    const byRadius = ok(spec([steer(0), fixed(6)], { limit: { kind: "radius", blocks: byAngle.radius } }));
    expect(byRadius.axles[0].inner).toBeCloseTo(27, 6);
    expect(byRadius.axles[0].outer).toBeCloseTo(byAngle.axles[0].outer, 9);
    expect(byRadius.referenceAxle).toBeNull();
  });
});

describe("solve: multi-axle", () => {
  it("front + rear steer around a middle fixed axle, rear reversed", () => {
    const r = ok(spec([steer(0), fixed(5), steer(5)]));
    expect(r.turnCenter).toBe(5);
    const [front, mid, rear] = r.axles;
    expect(front.direction).toBe("normal");
    expect(mid.direction).toBe("none");
    expect(rear.direction).toBe("reversed");
    // Symmetric layout: rear mirrors the front.
    expect(rear.inner).toBeCloseTo(front.inner, 9);
    expect(rear.outer).toBeCloseTo(front.outer, 9);
  });

  it("applies the angle limit to the farthest steered axle by default", () => {
    const r = ok(spec([steer(0), steer(3), fixed(6), fixed(3)]));
    expect(r.turnCenter).toBe(10.5); // mean of the fixed axles at 9 and 12
    expect(r.referenceAxle).toBe(0);
    expect(r.axles[0].inner).toBeCloseTo(27, 6);
    expect(r.axles[1].inner).toBeLessThan(27);
    expect(r.axles[1].direction).toBe("normal");
    // Two fixed axles straddle the turn center: scrub warning.
    expect(r.warnings.some((w) => w.includes("scrub"))).toBe(true);
  });

  it("honours an explicit reference axle", () => {
    const r = ok(
      spec([steer(0), steer(3), fixed(6), fixed(3)], { limit: { kind: "angle", degrees: 20, axle: 1 } }),
    );
    expect(r.referenceAxle).toBe(1);
    expect(r.axles[1].inner).toBeCloseTo(20, 6);
    expect(r.axles[0].inner).toBeGreaterThan(20);
  });

  it("falls back with a warning when the requested reference axle is fixed", () => {
    const r = ok(spec([steer(0), fixed(6)], { limit: { kind: "angle", degrees: 27, axle: 1 } }));
    expect(r.referenceAxle).toBe(0);
    expect(r.warnings[0]).toMatch(/cannot be the reference/);
  });

  it("all-steer vehicle pivots about its midpoint, or a custom override", () => {
    const auto = ok(spec([steer(0), steer(4), steer(4)]));
    expect(auto.turnCenter).toBe(4);
    expect(auto.axles[1].direction).toBe("none");
    expect(auto.warnings[0]).toMatch(/does not need to steer/);

    const custom = ok(spec([steer(0), steer(4), steer(4)], { turnCenter: { kind: "custom", position: 6 } }));
    expect(custom.axles.map((a) => a.direction)).toEqual(["normal", "normal", "reversed"]);
    expect(custom.axles[0].inner).toBeCloseTo(27, 6);
  });

  it("all wheels share one turn center: path radii are consistent", () => {
    const r = ok(spec([steer(0), fixed(5), steer(5)], { limit: { kind: "radius", blocks: 10 } }));
    for (const a of r.axles) {
      if (a.direction === "none") continue;
      const L = Math.abs(a.offset);
      expect(Math.tan((a.inner * Math.PI) / 180)).toBeCloseTo(L / (r.radius - a.track / 2), 9);
      expect(Math.tan((a.outer * Math.PI) / 180)).toBeCloseTo(L / (r.radius + a.track / 2), 9);
    }
    expect(r.minRadius).toBeCloseTo(8, 9);
    expect(r.maxRadius).toBeCloseTo(Math.hypot(5, 12), 9);
  });
});

describe("solve: validation", () => {
  it("rejects a vehicle with no steered axle", () => {
    const r = solve(spec([fixed(0), fixed(6)]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/at least one axle as steered/);
  });
  it("rejects non-positive gaps and tracks", () => {
    const r = solve(spec([steer(0, 0), fixed(0)]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBe(2);
  });
  it("rejects a turn tighter than the track allows", () => {
    const r = solve(spec([steer(0, 8), fixed(6)], { limit: { kind: "radius", blocks: 3 } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/too tight/);
  });
  it("rejects when every steered axle is on the turn-center line", () => {
    const r = solve(spec([steer(0), fixed(6)], { turnCenter: { kind: "custom", position: 0 } }));
    expect(r.ok).toBe(false);
  });
});

describe("farthestSteeredAxle", () => {
  it("picks the steered axle with the largest offset", () => {
    expect(farthestSteeredAxle([steer(0), steer(3), fixed(6)], [0, 3, 9], 9)).toBe(0);
    expect(farthestSteeredAxle([fixed(0), steer(3), steer(6)], [0, 3, 9], 0)).toBe(2);
    expect(farthestSteeredAxle([fixed(0), fixed(3)], [0, 3], 0)).toBeNull();
  });
});

describe("wheelLimits", () => {
  it("mirrors inner/outer across sides and skips fixed axles", () => {
    const r = ok(spec([steer(0), fixed(5), steer(5)]));
    const w = wheelLimits(r);
    expect(w.map((x) => [x.axle, x.side, x.direction])).toEqual([
      [0, "left", "normal"],
      [0, "right", "normal"],
      [2, "left", "reversed"],
      [2, "right", "reversed"],
    ]);
    expect(w[0].leftTurn).toBeCloseTo(27, 6);
    expect(w[0].rightTurn).toBeCloseTo(r.axles[0].outer, 9);
    expect(w[1].leftTurn).toBeCloseTo(r.axles[0].outer, 9);
    expect(w[1].rightTurn).toBeCloseTo(27, 6);
  });
});
