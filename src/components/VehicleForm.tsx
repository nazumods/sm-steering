import { Field, Select } from "@lepid-labs/ui-react";
import { autoTurnCenter, axlePositions, type Solution, type VehicleSpec } from "../geometry/ackermann";
import { MAX_AXLES, MIN_AXLES, withAxleCount } from "../state/spec";
import { ButtonGroup } from "../ui/ButtonGroup";
import { deg, short } from "../ui/format";
import { NumberInput } from "../ui/NumberInput";

interface Props {
  spec: VehicleSpec;
  onChange: (spec: VehicleSpec) => void;
  solution: Solution | null;
}

const AXLE_COUNTS = Array.from({ length: MAX_AXLES - MIN_AXLES + 1 }, (_, i) => MIN_AXLES + i);

export function VehicleForm({ spec, onChange, solution }: Props) {
  const positions = axlePositions(spec.axles);
  const autoCenter = autoTurnCenter(spec.axles, positions);
  const fixedCount = spec.axles.filter((a) => a.mode === "fixed").length;
  const steered = spec.axles.map((a, i) => ({ a, i })).filter(({ a }) => a.mode === "steer");

  const autoCenterHint =
    fixedCount === 0
      ? "No fixed axle: pivots halfway between the first and last axle."
      : fixedCount === 1
        ? "On the fixed axle."
        : `Average of the ${fixedCount} fixed axles.`;

  return (
    <div>
      <Field label="Axles">
        <ButtonGroup
          label="Number of axles"
          options={AXLE_COUNTS.map((n) => ({ value: n, label: n }))}
          value={spec.axles.length}
          onChange={(n) => onChange(withAxleCount(spec, n))}
        />
        <p className="hint">{spec.axles.length * 2} wheels.</p>
      </Field>

      <div className="grid2">
        <Field label="Turn center" htmlFor="center-mode">
          <Select
            id="center-mode"
            value={spec.turnCenter.kind}
            onChange={(e) =>
              onChange({
                ...spec,
                turnCenter:
                  e.target.value === "custom" ? { kind: "custom", position: autoCenter } : { kind: "auto" },
              })
            }
          >
            <option value="auto">Automatic</option>
            <option value="custom">Custom position</option>
          </Select>
          <p className="hint">
            {spec.turnCenter.kind === "auto" ? (
              <>
                {autoCenterHint} <strong>{short(autoCenter)} blocks</strong> behind the front axle.
              </>
            ) : (
              "The line the vehicle pivots around. Axles ahead of it steer normally, axles behind it steer reversed."
            )}
          </p>
        </Field>
        {spec.turnCenter.kind === "custom" ? (
          <Field label="Blocks behind front axle" htmlFor="center-pos">
            <NumberInput
              id="center-pos"
              step={0.5}
              value={spec.turnCenter.position}
              onChange={(position) => onChange({ ...spec, turnCenter: { kind: "custom", position } })}
            />
          </Field>
        ) : (
          <div />
        )}
      </div>

      <div className="grid2">
        <Field label="Limit by" htmlFor="limit-mode">
          <Select
            id="limit-mode"
            value={spec.limit.kind}
            onChange={(e) => {
              if (e.target.value === spec.limit.kind) return;
              if (e.target.value === "radius") {
                onChange({
                  ...spec,
                  limit: { kind: "radius", blocks: solution ? round(solution.radius) : 12 },
                });
              } else {
                const ref = solution?.referenceAxle ?? null;
                const inner = ref !== null ? solution?.axles[ref]?.inner : undefined;
                onChange({
                  ...spec,
                  limit: { kind: "angle", degrees: inner ? round(inner) : 27, axle: "auto" },
                });
              }
            }}
          >
            <option value="angle">Max inner wheel angle</option>
            <option value="radius">Turn radius</option>
          </Select>
          <p className="hint">
            {spec.limit.kind === "angle"
              ? "The limit for the wheel closest to the turn center on the reference axle. Everything else is derived."
              : "Distance from the turn center to the vehicle centerline, in blocks."}
          </p>
        </Field>
        {spec.limit.kind === "angle" ? (
          <Field label="Inner angle (degrees)" htmlFor="limit-angle">
            <NumberInput
              id="limit-angle"
              min={1}
              max={89}
              step={0.5}
              value={spec.limit.degrees}
              onChange={(degrees) =>
                onChange({ ...spec, limit: { kind: "angle", degrees, axle: axleOf(spec) } })
              }
            />
          </Field>
        ) : (
          <Field label="Radius (blocks)" htmlFor="limit-radius">
            <NumberInput
              id="limit-radius"
              min={0.5}
              step={0.5}
              value={spec.limit.blocks}
              onChange={(blocks) => onChange({ ...spec, limit: { kind: "radius", blocks } })}
            />
          </Field>
        )}
      </div>

      {spec.limit.kind === "angle" && (
        <Field label="Reference axle" htmlFor="ref-axle">
          <Select
            id="ref-axle"
            value={spec.limit.axle === "auto" ? "auto" : String(spec.limit.axle)}
            onChange={(e) =>
              onChange({
                ...spec,
                limit: {
                  kind: "angle",
                  degrees: spec.limit.kind === "angle" ? spec.limit.degrees : 27,
                  axle: e.target.value === "auto" ? "auto" : Number(e.target.value),
                },
              })
            }
          >
            <option value="auto">Automatic (farthest steered axle from the turn center)</option>
            {steered.map(({ i }) => (
              <option key={i} value={i}>
                Axle {i + 1}
              </option>
            ))}
          </Select>
          <p className="hint">
            {solution?.referenceAxle !== null && solution?.referenceAxle !== undefined ? (
              <>
                Applies to <strong>axle {solution.referenceAxle + 1}</strong>; its inner wheel turns{" "}
                <strong>{deg(solution.axles[solution.referenceAxle].inner)}</strong> and the rest turn less.
              </>
            ) : (
              "The axle whose inner wheel gets the limit above."
            )}
          </p>
        </Field>
      )}
    </div>
  );
}

function axleOf(spec: VehicleSpec): "auto" | number {
  return spec.limit.kind === "angle" ? spec.limit.axle : "auto";
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
