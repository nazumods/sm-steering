import type { Solution } from "../geometry/ackermann";
import { short } from "../ui/format";

const round = (n: number) => Math.round(n * 100) / 100;

/** The turn geometry numbers: radius, center, and the tightest and widest wheel paths. */
export function GeometryStats({ solution }: { solution: Solution | null }) {
  const v = (n: number | undefined) => (n === undefined ? "—" : short(round(n)));
  return (
    <div className="stats">
      <div className="stat">
        <span className="stat-label">Turn radius</span>
        <span className="stat-value accent">{v(solution?.radius)}</span>
        <span className="stat-sub">blocks, centerline to turn center</span>
      </div>
      <div className="stat">
        <span className="stat-label">Turn center</span>
        <span className="stat-value">{v(solution?.turnCenter)}</span>
        <span className="stat-sub">blocks behind the front axle</span>
      </div>
      <div className="stat">
        <span className="stat-label">Tightest wheel path</span>
        <span className="stat-value">{v(solution?.minRadius)}</span>
        <span className="stat-sub">blocks</span>
      </div>
      <div className="stat">
        <span className="stat-label">Widest wheel path</span>
        <span className="stat-value">{v(solution?.maxRadius)}</span>
        <span className="stat-sub">blocks, clearance you need</span>
      </div>
    </div>
  );
}
