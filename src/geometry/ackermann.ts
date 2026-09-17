/**
 * Ackermann steering geometry for multi-axle vehicles.
 *
 * Coordinates: one axis along the vehicle, in blocks, increasing rearward.
 * The front axle sits at 0; every other axle is placed by its gap from the
 * previous one. The turn center lies on a line perpendicular to that axis at
 * some position `c`. Each steered axle at signed offset `pos - c` from that
 * line, with bearing track `T`, rolls without scrub when
 *
 *   inner = atan(L / (R - T/2))     outer = atan(L / (R + T/2))
 *
 * where L = |pos - c| and R is the turn radius measured from the vehicle
 * centerline. Axles ahead of the line steer with the front; axles behind it
 * steer the opposite way.
 */

export type SteerMode = "fixed" | "steer";

export type WheelSize = "small" | "big";

/** Wheel width in blocks. */
export const WHEEL_WIDTH: Record<WheelSize, number> = { small: 1, big: 2 };

export interface AxleSpec {
  /** Whole blocks behind the previous axle. Ignored for the first axle. */
  gap: number;
  /** Whole blocks between the two bearings on this axle (0 if they touch). */
  between: number;
  wheel: WheelSize;
  /**
   * Steering-axis tilt in degrees, 0 for a vertical axis. A caster-style
   * lean toward the vehicle center makes the wheels lean into turns, and
   * means the bearing setting no longer equals the wheel's ground angle.
   */
  tilt: number;
  mode: SteerMode;
}

const RAD = Math.PI / 180;

/**
 * Ground yaw produced by turning a bearing whose axis leans `tilt` degrees
 * from vertical (in the vehicle's long direction) by `setting` degrees.
 * Rotating the wheel's forward vector about the tilted axis and projecting
 * onto the ground gives tan(yaw) = cos t sin d / (cos^2 t cos d + sin^2 t).
 */
export function groundYaw(setting: number, tilt: number): number {
  const t = tilt * RAD;
  const d = setting * RAD;
  const c = Math.cos(t);
  return Math.atan2(c * Math.sin(d), c * c * Math.cos(d) + Math.sin(t) ** 2) / RAD;
}

/**
 * Bearing setting that yields a wanted ground yaw on an axis leaning `tilt`
 * degrees: the inverse of groundYaw, solved in closed form. NaN when the yaw
 * is not reachable.
 */
export function bearingSetting(yaw: number, tilt: number): number {
  if (tilt === 0) return yaw;
  const t = tilt * RAD;
  const tn = Math.tan(yaw * RAD);
  const a = Math.cos(t);
  const b = tn * Math.cos(t) ** 2;
  const c = tn * Math.sin(t) ** 2;
  return (Math.atan2(b, a) + Math.asin(c / Math.hypot(a, b))) / RAD;
}

/** Wheel lean (camber) at a bearing setting on a tilted axis: asin(sin tilt * sin setting). */
export function leanAt(setting: number, tilt: number): number {
  return Math.asin(Math.sin(tilt * RAD) * Math.sin(setting * RAD)) / RAD;
}

/**
 * Track width: the distance between the two wheel centerlines. Each bearing is
 * one block, and a wheel's center sits half a wheel outboard of its bearing,
 * so track = between + 2 + wheel width.
 */
export function trackOf(axle: Pick<AxleSpec, "between" | "wheel">): number {
  return axle.between + 2 + WHEEL_WIDTH[axle.wheel];
}

export type TurnCenterSpec = { kind: "auto" } | { kind: "custom"; position: number };

export type LimitSpec =
  | { kind: "angle"; degrees: number; axle: "auto" | number }
  | { kind: "radius"; blocks: number };

export interface VehicleSpec {
  axles: AxleSpec[];
  turnCenter: TurnCenterSpec;
  limit: LimitSpec;
}

/** How a steered axle turns relative to the front axle. */
export type Direction = "normal" | "reversed" | "none";

export interface AxleResult {
  index: number;
  position: number;
  track: number;
  mode: SteerMode;
  /** Signed distance from the turn-center line; negative is ahead of it. */
  offset: number;
  direction: Direction;
  /** Inner-wheel steering angle in degrees (0 for fixed axles). */
  inner: number;
  /** Outer-wheel steering angle in degrees (0 for fixed axles). */
  outer: number;
  /** Steering-axis tilt this axle was solved with. */
  tilt: number;
  /** Bearing setting that produces `inner` at the ground (equal to it when tilt is 0). */
  innerSetting: number;
  /** Bearing setting that produces `outer` at the ground. */
  outerSetting: number;
  /** Wheel lean at full lock for the inner wheel, degrees. */
  innerLean: number;
  /** Wheel lean at full lock for the outer wheel, degrees. */
  outerLean: number;
  /** Path radius of the inner wheel around the turn center. */
  innerRadius: number;
  /** Path radius of the outer wheel around the turn center. */
  outerRadius: number;
}

export interface Solution {
  ok: true;
  axles: AxleResult[];
  /** Position of the turn-center line, blocks behind the front axle. */
  turnCenter: number;
  /** Turn radius from the turn center to the vehicle centerline. */
  radius: number;
  /** Index of the axle the angle limit was applied to (angle mode only). */
  referenceAxle: number | null;
  /** Smallest wheel-path radius on the vehicle. */
  minRadius: number;
  /** Largest wheel-path radius on the vehicle. */
  maxRadius: number;
  warnings: string[];
}

export interface Failure {
  ok: false;
  errors: string[];
}

export type Result = Solution | Failure;

const DEG = 180 / Math.PI;
const EPS = 1e-9;

export function axlePositions(axles: readonly AxleSpec[]): number[] {
  const out: number[] = [];
  let pos = 0;
  axles.forEach((a, i) => {
    if (i > 0) pos += a.gap;
    out.push(pos);
  });
  return out;
}

/**
 * Where the turn-center line falls when not set explicitly: on the fixed axle,
 * at the mean of several fixed axles, or halfway along the vehicle when every
 * axle steers.
 */
export function autoTurnCenter(axles: readonly AxleSpec[], positions: readonly number[]): number {
  const fixed = positions.filter((_, i) => axles[i]?.mode === "fixed");
  if (fixed.length > 0) return fixed.reduce((s, p) => s + p, 0) / fixed.length;
  if (positions.length === 0) return 0;
  return (positions[0] + positions[positions.length - 1]) / 2;
}

export function resolveTurnCenter(spec: VehicleSpec, positions: readonly number[]): number {
  return spec.turnCenter.kind === "custom" ? spec.turnCenter.position : autoTurnCenter(spec.axles, positions);
}

/** The steered axle farthest from the turn-center line: the one that needs the largest angle. */
export function farthestSteeredAxle(
  axles: readonly AxleSpec[],
  positions: readonly number[],
  center: number,
): number | null {
  let best: number | null = null;
  let bestDist = -1;
  axles.forEach((a, i) => {
    if (a.mode !== "steer") return;
    const d = Math.abs(positions[i] - center);
    if (d > bestDist + EPS) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

function validate(spec: VehicleSpec): string[] {
  const errors: string[] = [];
  if (spec.axles.length < 2) errors.push("A vehicle needs at least two axles.");
  spec.axles.forEach((a, i) => {
    const n = i + 1;
    if (i > 0 && !(Number.isInteger(a.gap) && a.gap > 0)) {
      errors.push(`Axle ${n}: the gap to the previous axle must be a whole number of blocks, at least 1.`);
    }
    if (!(Number.isInteger(a.between) && a.between >= 0)) {
      errors.push(`Axle ${n}: blocks between the bearings must be a whole number, 0 or more.`);
    }
    if (!(Number.isFinite(a.tilt) && a.tilt >= 0 && a.tilt < 90)) {
      errors.push(`Axle ${n}: the steering-axis tilt must be between 0° and 90° (exclusive).`);
    }
  });
  if (spec.turnCenter.kind === "custom" && !Number.isFinite(spec.turnCenter.position)) {
    errors.push("The turn-center position must be a number.");
  }
  if (spec.limit.kind === "angle") {
    if (!(spec.limit.degrees > 0 && spec.limit.degrees < 90)) {
      errors.push("The inner wheel angle must be between 0° and 90° (exclusive).");
    }
  } else if (!(spec.limit.blocks > 0)) {
    errors.push("The turn radius must be greater than 0.");
  }
  if (!spec.axles.some((a) => a.mode === "steer")) errors.push("Mark at least one axle as steered.");
  return errors;
}

export function solve(spec: VehicleSpec): Result {
  const errors = validate(spec);
  if (errors.length > 0) return { ok: false, errors };

  const positions = axlePositions(spec.axles);
  const center = resolveTurnCenter(spec, positions);
  const warnings: string[] = [];

  let radius: number;
  let referenceAxle: number | null = null;
  if (spec.limit.kind === "angle") {
    const wanted = spec.limit.axle;
    const usable =
      typeof wanted === "number" &&
      spec.axles[wanted]?.mode === "steer" &&
      Math.abs(positions[wanted] - center) > EPS;
    referenceAxle = usable ? wanted : farthestSteeredAxle(spec.axles, positions, center);
    if (referenceAxle === null || Math.abs(positions[referenceAxle] - center) <= EPS) {
      return {
        ok: false,
        errors: [
          "Every steered axle sits on the turn-center line, so no steering angle applies. Move the turn center or fix a different axle.",
        ],
      };
    }
    if (typeof wanted === "number" && !usable) {
      warnings.push(
        `Axle ${wanted + 1} cannot be the reference (it is fixed or on the turn-center line); using axle ${referenceAxle + 1}.`,
      );
    }
    const ref = spec.axles[referenceAxle];
    const L = Math.abs(positions[referenceAxle] - center);
    radius = trackOf(ref) / 2 + L / Math.tan(spec.limit.degrees / DEG);
  } else {
    radius = spec.limit.blocks;
  }

  const axles: AxleResult[] = [];
  const tooTight: number[] = [];
  const idle: number[] = [];
  const scrubbing: number[] = [];
  const unreachable: string[] = [];
  let minRadius = Number.POSITIVE_INFINITY;
  let maxRadius = 0;

  spec.axles.forEach((a, i) => {
    const position = positions[i];
    const offset = position - center;
    const L = Math.abs(offset);
    const onLine = L <= EPS;
    let direction: Direction = "none";
    let inner = 0;
    let outer = 0;
    let innerSetting = 0;
    let outerSetting = 0;
    if (a.mode === "steer" && !onLine) {
      const innerArm = radius - trackOf(a) / 2;
      if (innerArm <= EPS) {
        tooTight.push(i + 1);
      } else {
        inner = Math.atan(L / innerArm) * DEG;
        outer = Math.atan(L / (radius + trackOf(a) / 2)) * DEG;
        innerSetting = bearingSetting(inner, a.tilt);
        outerSetting = bearingSetting(outer, a.tilt);
        if (!(innerSetting <= 90) || !(outerSetting <= 90)) {
          unreachable.push(
            `Axle ${i + 1}: a ${inner.toFixed(1)}° wheel angle is not reachable with a ${a.tilt}° steering-axis tilt.`,
          );
        }
      }
      direction = offset < 0 ? "normal" : "reversed";
    } else if (a.mode === "steer") {
      idle.push(i + 1);
    } else if (!onLine) {
      scrubbing.push(i + 1);
    }
    const innerRadius = Math.hypot(L, radius - trackOf(a) / 2);
    const outerRadius = Math.hypot(L, radius + trackOf(a) / 2);
    minRadius = Math.min(minRadius, innerRadius);
    maxRadius = Math.max(maxRadius, outerRadius);
    axles.push({
      index: i,
      position,
      track: trackOf(a),
      mode: a.mode,
      offset,
      direction,
      inner,
      outer,
      tilt: a.tilt,
      innerSetting,
      outerSetting,
      innerLean: leanAt(innerSetting, a.tilt),
      outerLean: leanAt(outerSetting, a.tilt),
      innerRadius,
      outerRadius,
    });
  });

  if (unreachable.length > 0) return { ok: false, errors: unreachable };
  if (tooTight.length > 0) {
    return {
      ok: false,
      errors: [
        `The turn is too tight for ${list("axle", tooTight)}: the turn center would fall inside the track width. Use a smaller inner angle or a larger turn radius.`,
      ],
    };
  }
  if (idle.length > 0) {
    warnings.push(
      `${list("Axle", idle)} sits on the turn-center line and does not need to steer; leave it fixed.`,
    );
  }
  if (scrubbing.length > 0) {
    warnings.push(
      `Fixed ${list("axle", scrubbing)} sit off the turn-center line, so those tires scrub in turns. Steer one of them or move the turn center onto a single fixed axle.`,
    );
  }

  return { ok: true, axles, turnCenter: center, radius, referenceAxle, minRadius, maxRadius, warnings };
}

function list(noun: string, numbers: number[]): string {
  const word = numbers.length === 1 ? noun : `${noun}s`;
  if (numbers.length <= 1) return `${word} ${numbers.join("")}`;
  return `${word} ${numbers.slice(0, -1).join(", ")} and ${numbers[numbers.length - 1]}`;
}

/** Bearing limits for one physical wheel: the angle to enter for each turn direction. */
export interface WheelLimits {
  axle: number;
  side: "left" | "right";
  direction: Direction;
  /** Bearing setting to enter for a left turn. */
  leftTurn: number;
  /** Bearing setting to enter for a right turn. */
  rightTurn: number;
  /** Wheel angle at the ground that the left-turn setting produces. */
  leftTurnGround: number;
  /** Wheel angle at the ground that the right-turn setting produces. */
  rightTurnGround: number;
  tilt: number;
}

/**
 * Per-wheel left/right limits as a Level 5 Driver's Seat expects them. In a
 * left turn the left wheel is the inner wheel on every axle, whichever way that
 * axle steers; the direction column says whether the wheel points with or
 * against the front axle. Settings are converted for a tilted steering axis.
 */
export function wheelLimits(solution: Solution): WheelLimits[] {
  const out: WheelLimits[] = [];
  for (const a of solution.axles) {
    if (a.mode !== "steer" || a.direction === "none") continue;
    const base = { axle: a.index, direction: a.direction, tilt: a.tilt };
    out.push({
      ...base,
      side: "left",
      leftTurn: a.innerSetting,
      rightTurn: a.outerSetting,
      leftTurnGround: a.inner,
      rightTurnGround: a.outer,
    });
    out.push({
      ...base,
      side: "right",
      leftTurn: a.outerSetting,
      rightTurn: a.innerSetting,
      leftTurnGround: a.outer,
      rightTurnGround: a.inner,
    });
  }
  return out;
}
