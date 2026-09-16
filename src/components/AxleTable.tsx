import { Badge, Switch } from "@lepid-labs/ui-react";
import type { ReactNode } from "react";
import { type AxleResult, axlePositions, type Solution, type VehicleSpec } from "../geometry/ackermann";
import { updateAxle } from "../state/spec";
import { short } from "../ui/format";
import { NumberInput } from "../ui/NumberInput";

interface Props {
  spec: VehicleSpec;
  onChange: (spec: VehicleSpec) => void;
  solution: Solution | null;
}

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
            <th scope="col">Track</th>
            <th scope="col">Steered</th>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          {spec.axles.map((a, i) => (
            <tr key={i}>
              <td>
                <span className="axle-num">{i + 1}</span>{" "}
                <span className="axle-pos">{i === 0 ? "front" : `${short(positions[i])} back`}</span>
              </td>
              <td>
                {i === 0 ? (
                  <span className="ld-muted">&mdash;</span>
                ) : (
                  <NumberInput
                    aria-label={`Axle ${i + 1} gap from axle ${i}, in blocks`}
                    min={0.5}
                    step={0.5}
                    value={a.gap}
                    onChange={(gap) => onChange(updateAxle(spec, i, { gap }))}
                  />
                )}
              </td>
              <td>
                <NumberInput
                  aria-label={`Axle ${i + 1} track width, in blocks`}
                  min={0.5}
                  step={0.5}
                  value={a.track}
                  onChange={(track) => onChange(updateAxle(spec, i, { track }))}
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
