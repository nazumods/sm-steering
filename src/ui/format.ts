export function deg(value: number, digits = 2): string {
  return `${value.toFixed(digits)}°`;
}

export function blocks(value: number, digits = 2): string {
  return `${value.toFixed(digits)} blocks`;
}

/** Trim trailing zeros for compact display of user-entered values. */
export function short(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
