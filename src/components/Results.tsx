import { Alert, Button } from "@lepid-labs/ui-react";
import { useEffect, useState } from "react";
import { type Result, type Solution, wheelLimits } from "../geometry/ackermann";
import { blocks, deg, short } from "../ui/format";
import { RoleBadge } from "./AxleTable";

export function Results({ result }: { result: Result }) {
  if (!result.ok) {
    return (
      <div className="results">
        {result.errors.map((e) => (
          <Alert key={e} variant="danger" title="Cannot solve">
            {e}
          </Alert>
        ))}
      </div>
    );
  }
  return <Solved solution={result} />;
}

function Solved({ solution }: { solution: Solution }) {
  const wheels = wheelLimits(solution);
  const steered = solution.axles.filter((a) => a.mode === "steer" && a.direction !== "none");
  const anyReversed = steered.some((a) => a.direction === "reversed");
  const ref = solution.referenceAxle;

  return (
    <div className="results">
      {solution.warnings.map((w) => (
        <Alert key={w} variant="warning">
          {w}
        </Alert>
      ))}

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Turn radius</span>
          <span className="stat-value accent">{short(round(solution.radius))}</span>
          <span className="stat-sub">blocks, centerline to turn center</span>
        </div>
        <div className="stat">
          <span className="stat-label">Turn center</span>
          <span className="stat-value">{short(round(solution.turnCenter))}</span>
          <span className="stat-sub">blocks behind the front axle</span>
        </div>
        <div className="stat">
          <span className="stat-label">Tightest wheel path</span>
          <span className="stat-value">{short(round(solution.minRadius))}</span>
          <span className="stat-sub">blocks</span>
        </div>
        <div className="stat">
          <span className="stat-label">Widest wheel path</span>
          <span className="stat-value">{short(round(solution.maxRadius))}</span>
          <span className="stat-sub">blocks, clearance you need</span>
        </div>
      </div>

      <h3>Per axle</h3>
      <div className="table-scroll">
        <table className="ld-table">
          <thead>
            <tr>
              <th scope="col">Axle</th>
              <th scope="col">Role</th>
              <th scope="col" className="num">
                Inner
              </th>
              <th scope="col" className="num">
                Outer
              </th>
              <th scope="col" className="num">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {solution.axles.map((a) => (
              <tr key={a.index}>
                <td>Axle {a.index + 1}</td>
                <td>
                  <RoleBadge axle={a} mode={a.mode} isReference={ref === a.index} />
                </td>
                <td className={`num${ref === a.index ? " lead" : ""}`}>
                  {a.direction === "none" ? "—" : deg(a.inner)}
                </td>
                <td className="num">{a.direction === "none" ? "—" : deg(a.outer)}</td>
                <td className="num">{a.direction === "none" ? "—" : deg(a.inner - a.outer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Level 5 seat bearing limits</h3>
      <div className="table-scroll">
        <table className="ld-table">
          <thead>
            <tr>
              <th scope="col">Wheel</th>
              <th scope="col" className="num">
                Left turn
              </th>
              <th scope="col" className="num">
                Right turn
              </th>
              <th scope="col">Direction</th>
            </tr>
          </thead>
          <tbody>
            {wheels.map((w) => (
              <tr key={`${w.axle}-${w.side}`}>
                <td>
                  Axle {w.axle + 1} {w.side}
                </td>
                <td className="num">{deg(w.leftTurn)}</td>
                <td className="num">{deg(w.rightTurn)}</td>
                <td>{w.direction === "reversed" ? "Reversed" : "With front"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <CopyButton text={formatForClipboard(solution)} />
        <span className="ld-muted">
          {steered.length} steered {steered.length === 1 ? "axle" : "axles"}, {wheels.length} bearings to set.
        </span>
      </div>

      {anyReversed && (
        <Alert variant="info" title="Reversed axles" style={{ marginTop: "var(--ld-space-3)" }}>
          Wheels behind the turn center must point the opposite way to the front wheels. Enter the same
          limits; if a wheel turns the wrong way in-game, reverse that bearing's connection with the Connect
          Tool.
        </Alert>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);
  const canCopy = typeof navigator !== "undefined" && !!navigator.clipboard;
  return (
    <Button
      variant={copied ? "accent" : "primary"}
      disabled={!canCopy}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => setCopied(true));
      }}
    >
      {copied ? "Copied" : "Copy bearing settings"}
    </Button>
  );
}

export function formatForClipboard(solution: Solution): string {
  const lines: string[] = [];
  lines.push(
    `Turn radius ${blocks(solution.radius)}, turn center ${short(round(solution.turnCenter))} blocks behind the front axle`,
  );
  lines.push("");
  lines.push("Wheel          Left turn   Right turn  Direction");
  for (const w of wheelLimits(solution)) {
    const name = `Axle ${w.axle + 1} ${w.side}`.padEnd(15);
    const dir = w.direction === "reversed" ? "reversed" : "with front";
    lines.push(`${name}${deg(w.leftTurn).padStart(9)}   ${deg(w.rightTurn).padStart(9)}   ${dir}`);
  }
  lines.push("");
  lines.push(`${window.location.href}`);
  return lines.join("\n");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
