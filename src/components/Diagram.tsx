import {
  axlePositions,
  type Solution,
  trackOf,
  type VehicleSpec,
  WHEEL_WIDTH,
  type WheelSize,
} from "../geometry/ackermann";
import { blocks } from "../ui/format";

interface Props {
  spec: VehicleSpec;
  solution: Solution | null;
}

/** Wheel footprint in blocks: width across the axle, diameter along the vehicle. */
const WHEEL_SIZE: Record<WheelSize, { w: number; l: number }> = {
  small: { w: WHEEL_WIDTH.small, l: 3 },
  big: { w: WHEEL_WIDTH.big, l: 5 },
};

/**
 * Top-down view of a left turn, in block units. Front is up, the turn center
 * is to the left at (-R, c). SVG rotation is clockwise, so a left-pointing
 * wheel gets a negative rotation.
 */
export function Diagram({ spec, solution }: Props) {
  const positions = axlePositions(spec.axles);
  const length = positions[positions.length - 1] ?? 0;
  const tracks = spec.axles.map(trackOf);
  const maxTrack = Math.max(1, ...tracks);
  const minBetween = Math.min(...spec.axles.map((a) => a.between));
  const center = solution?.turnCenter ?? null;
  const radius = solution?.radius ?? null;

  const span = Math.max(length + 3, maxTrack + 3);
  const showCenter = radius !== null && radius <= 3 * span;

  const xMax = maxTrack / 2 + 4.5;
  const xMin = showCenter && radius !== null ? -radius - 2.5 : -maxTrack / 2 - 6;
  const yMin = Math.min(-3.5, center !== null ? center - 1 : 0);
  const yMax = Math.max(length + 3, center !== null ? center + 1 : 0);
  const width = xMax - xMin;
  const height = yMax - yMin;
  const fs = Math.min(1.1, Math.max(0.55, width / 42));

  // Chassis spans the bearings: half the narrowest gap plus one bearing block.
  const bodyHalf = minBetween / 2 + 1;

  return (
    <div>
      <svg
        className="diagram"
        viewBox={`${xMin} ${yMin} ${width} ${height}`}
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label="Top-down steering geometry diagram"
      >
        <title>Top-down steering geometry</title>

        {/* chassis */}
        <rect
          className="dg-body"
          x={-bodyHalf}
          y={-1.5}
          width={bodyHalf * 2}
          height={length + 3}
          rx={0.4}
          vectorEffect="non-scaling-stroke"
        />
        <line
          className="dg-centerline"
          x1={0}
          y1={-1.5}
          x2={0}
          y2={length + 1.5}
          vectorEffect="non-scaling-stroke"
        />
        <text className="dg-text" x={0} y={-2.2} fontSize={fs} textAnchor="middle">
          front
        </text>

        {/* turn-center line and rays */}
        {center !== null && (
          <line
            className="dg-turnline"
            x1={showCenter && radius !== null ? -radius : xMin}
            y1={center}
            x2={maxTrack / 2 + 1.5}
            y2={center}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {center !== null &&
          radius !== null &&
          spec.axles.map((_, i) =>
            [-tracks[i] / 2, tracks[i] / 2].map((x) => (
              <line
                key={`${i}-${x}`}
                className="dg-ray"
                x1={-radius}
                y1={center}
                x2={x}
                y2={positions[i]}
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}

        {/* axles and wheels */}
        {spec.axles.map((a, i) => {
          const y = positions[i];
          const half = tracks[i] / 2;
          const size = WHEEL_SIZE[a.wheel];
          const res = solution?.axles[i];
          const steered = a.mode === "steer" && res !== undefined && res.direction !== "none";
          const sign = res?.direction === "reversed" ? 1 : -1;
          const leftRot = steered && res ? sign * res.inner : 0;
          const rightRot = steered && res ? sign * res.outer : 0;
          const cls =
            a.mode === "fixed"
              ? "dg-wheel"
              : res?.direction === "reversed"
                ? "dg-wheel reversed"
                : res?.direction === "none"
                  ? "dg-wheel idle"
                  : "dg-wheel steer";
          return (
            <g key={i}>
              <line
                className="dg-axle"
                x1={-half}
                y1={y}
                x2={half}
                y2={y}
                vectorEffect="non-scaling-stroke"
              />
              <Wheel x={-half} y={y} rotation={leftRot} size={size} className={cls} />
              <Wheel x={half} y={y} rotation={rightRot} size={size} className={cls} />
              <text className="dg-text primary" x={half + size.w / 2 + 0.9} y={y + fs * 0.35} fontSize={fs}>
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* turn center */}
        {center !== null && radius !== null && showCenter && (
          <g>
            <circle
              className="dg-tc-ring"
              cx={-radius}
              cy={center}
              r={fs * 0.9}
              vectorEffect="non-scaling-stroke"
            />
            <circle className="dg-tc" cx={-radius} cy={center} r={fs * 0.35} />
            <text
              className="dg-text accent"
              x={-radius}
              y={center - fs * 1.4}
              fontSize={fs}
              textAnchor="middle"
            >
              turn center
            </text>
            <text
              className="dg-text"
              x={-radius}
              y={center + fs * 2.2}
              fontSize={fs * 0.9}
              textAnchor="middle"
            >
              R {blocks(radius)}
            </text>
          </g>
        )}
        {center !== null && radius !== null && !showCenter && (
          <text className="dg-text accent" x={xMin + 0.5} y={center - fs * 0.6} fontSize={fs}>
            &lt; turn center, R {blocks(radius)}
          </text>
        )}
      </svg>
      <ul className="legend">
        <li>
          <span className="swatch steer" /> steers with front
        </li>
        <li>
          <span className="swatch reversed" /> steers reversed
        </li>
        <li>
          <span className="swatch" /> fixed
        </li>
        <li>
          <span className="swatch tc" /> turn center
        </li>
      </ul>
    </div>
  );
}

function Wheel({
  x,
  y,
  rotation,
  size,
  className,
}: {
  x: number;
  y: number;
  rotation: number;
  size: { w: number; l: number };
  className: string;
}) {
  return (
    <rect
      className={className}
      x={x - size.w / 2}
      y={y - size.l / 2}
      width={size.w}
      height={size.l}
      rx={0.25}
      transform={`rotate(${rotation.toFixed(3)} ${x} ${y})`}
      vectorEffect="non-scaling-stroke"
    />
  );
}
