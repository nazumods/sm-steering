import { Card } from "@lepid-labs/ui-react";
import { type ReactNode, useMemo } from "react";
import { AxleTable } from "./components/AxleTable";
import { Diagram } from "./components/Diagram";
import { Guide } from "./components/Guide";
import { Results } from "./components/Results";
import { VehicleForm } from "./components/VehicleForm";
import { solve } from "./geometry/ackermann";
import { matchingPreset, PRESETS } from "./state/spec";
import { useSpec } from "./state/useSpec";
import { ButtonGroup } from "./ui/ButtonGroup";

function SectionTitle({ n, title, sub }: { n: string; title: string; sub?: ReactNode }) {
  return (
    <>
      <h2 className="section-title">
        <span className="section-num">{n}</span>
        {title}
      </h2>
      {sub !== undefined && <p className="section-sub">{sub}</p>}
    </>
  );
}

export function App() {
  const [spec, setSpec] = useSpec();
  const result = useMemo(() => solve(spec), [spec]);
  const solution = result.ok ? result : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>SM Steering</h1>
          <p>
            Ackermann bearing limits for Scrap Mechanic vehicles with any number of axles. Pick which axles
            steer, where the vehicle pivots, and how far the reference wheel may turn; every other wheel
            follows.
          </p>
        </div>
        <div className="presets">
          <span className="ld-label">Presets</span>
          <ButtonGroup
            label="Presets"
            options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
            value={matchingPreset(spec)?.id ?? null}
            onChange={(id) => {
              const p = PRESETS.find((x) => x.id === id);
              if (p) setSpec(p.spec);
            }}
          />
        </div>
      </header>

      <div className="layout">
        <div className="stack">
          <Card>
            <SectionTitle
              n="01"
              title="Vehicle"
              sub="Count whole blocks; the wheel size fills in the rest."
            />
            <VehicleForm spec={spec} onChange={setSpec} solution={solution} />
          </Card>
          <Card>
            <SectionTitle
              n="02"
              title="Axles"
              sub="Front axle first. Gap is blocks to the axle above it; between is blocks between the two bearings."
            />
            <AxleTable spec={spec} onChange={setSpec} solution={solution} />
          </Card>
        </div>
        <div className="stack">
          <Card>
            <SectionTitle
              n="03"
              title="Geometry"
              sub="Top-down view of a left turn. Every wheel rolls around the same turn center."
            />
            <Diagram spec={spec} solution={solution} />
          </Card>
          <Card>
            <SectionTitle
              n="04"
              title="Bearing limits"
              sub="Whole degrees, as the seat accepts them. Hover a value for the exact angle."
            />
            <Results result={result} />
          </Card>
        </div>
      </div>

      <Guide />

      <footer className="app-footer">
        <a href="https://github.com/nazumods/sm-steering">Source on GitHub</a>
        <span className="ld-muted">
          Two-axle version and Level 5 seat workflow:{" "}
          <a href="https://scrapmechanic.org/tools/wheel-angle-calculator">scrapmechanic.org</a>
        </span>
      </footer>
    </div>
  );
}
