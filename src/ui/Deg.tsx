import { deg, wholeDeg } from "./format";

/**
 * An angle as the game accepts it (whole degrees), with the exact value as a
 * tooltip.
 */
export function Deg({ value }: { value: number }) {
  return (
    <span className="deg" title={deg(value)}>
      {wholeDeg(value)}
    </span>
  );
}
