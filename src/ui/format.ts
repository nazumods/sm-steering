export function deg(value: number, digits = 2): string {
  return `${value.toFixed(digits)}°`;
}

/** Whole degrees, the resolution the game's seat settings accept. */
export function wholeDeg(value: number): string {
  return `${Math.round(value)}°`;
}

export function blocks(value: number, digits = 2): string {
  return `${value.toFixed(digits)} blocks`;
}

/** Trim trailing zeros for compact display of user-entered values. */
export function short(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
