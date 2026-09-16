import { Badge, Switch } from "@lepid-labs/ui-react";
import type { ReactNode } from "react";
import {
  type AxleResult,
  axlePositions,
  type Solution,
  trackOf,
  type VehicleSpec,
  type WheelSize,
} from "../geometry/ackermann";
import { updateAxle } from "../state/spec";
import { ButtonGroup } from "../ui/ButtonGroup";
import { short } from "../ui/format";
import { NumberInput } from "../ui/NumberInput";

interface Props {
  spec: VehicleSpec;
  onChange: (spec: VehicleSpec) => void;
  solution: Solution | null;
}

const WHEEL_OPTIONS: { value: WheelSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "big", label: "Big" },
];

export function RoleBadge({
  axle,
  mode,
  isReference,
}: {
  axle?: AxleResult;
  mode: "steer" | "fixed";
  isReference: boolean;
}) {
  let badge: ReactNode;
  if (mode === "fixed") badge = <Badge>Fixed</Badge>;
  else if (!axle) badge = <Badge variant="primary">Steers</Badge>;
  else if (axle.direction === "normal") badge = <Badge variant="success">Steers</Badge>;
  else if (axle.direction === "reversed") badge = <Badge variant="info">Reversed</Badge>;
  else badge = <Badge variant="warning">On center</Badge>;
  return (
    <span className="role">
      {badge}
      {isReference && (
        <Badge variant="primary" title="The inner-angle limit applies to this axle">
          Ref
        </Badge>
      )}
    </span>
  );
}

export function AxleTable({ spec, onChange, solution }: Props) {
  const positions = axlePositions(spec.axles);
  return (
    <div className="table-scroll">
      <table className="ld-table axle-table">
        <thead>
          <tr>
            <th scope="col">Axle</th>
            <th scope="col">Gap</th>
            <th scope="col">Between</th>
            <th scope="col">Wheels</th>
            <th scope="col">Steered</th>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          {spec.axles.map((a, i) => (
            <tr key={i}>
              <td>
                <span className="axle-num">{i + 1}</span>{" "}
                <span className="axle-pos">
                  {i === 0 ? "front" : `${short(positions[i])} back`}
                  <br />
                  track {trackOf(a)}
                </span>
              </td>
              <td>
                {i === 0 ? (
                  <span className="ld-muted">&mdash;</span>
                ) : (
                  <NumberInput
                    aria-label={`Axle ${i + 1}: blocks behind axle ${i}`}
                    integer
                    min={1}
                    value={a.gap}
                    onChange={(gap) => onChange(updateAxle(spec, i, { gap }))}
                  />
                )}
              </td>
              <td>
                <NumberInput
                  aria-label={`Axle ${i + 1}: blocks between the two bearings`}
                  integer
                  min={0}
                  value={a.between}
                  onChange={(between) => onChange(updateAxle(spec, i, { between }))}
                />
              </td>
              <td>
                <ButtonGroup
                  label={`Axle ${i + 1} wheel size`}
                  options={WHEEL_OPTIONS}
                  value={a.wheel}
                  onChange={(wheel) => onChange(updateAxle(spec, i, { wheel }))}
                />
              </td>
              <td>
                <Switch
                  aria-label={`Axle ${i + 1} steered`}
                  checked={a.mode === "steer"}
                  onChange={(e) =>
                    onChange(updateAxle(spec, i, { mode: e.target.checked ? "steer" : "fixed" }))
                  }
                />
              </td>
              <td>
                <RoleBadge
                  axle={solution?.axles[i]}
                  mode={a.mode}
                  isReference={solution?.referenceAxle === i}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
