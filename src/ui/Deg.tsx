import { deg, wholeDeg } from "./format";

/**
 * An angle as the game accepts it (whole degrees), with the exact value, or a
 * custom explanation, as a tooltip.
 */
export function Deg({ value, title }: { value: number; title?: string }) {
  return (
    <span className="deg" title={title ?? deg(value)}>
      {wholeDeg(value)}
    </span>
  );
}
