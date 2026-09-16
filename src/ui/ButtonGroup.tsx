import { Button } from "@lepid-labs/ui-react";
import type { ReactNode } from "react";

export interface ButtonGroupOption<T> {
  value: T;
  label: ReactNode;
}

interface Props<T> {
  options: ButtonGroupOption<T>[];
  /** The selected value; nothing is highlighted when no option matches. */
  value: T | null;
  onChange: (value: T) => void;
  label: string;
}

/** A row of compact toggle buttons; exactly one is highlighted as the current choice. */
export function ButtonGroup<T extends string | number>({ options, value, onChange, label }: Props<T>) {
  return (
    <div className="btn-group" role="group" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Button
            key={String(o.value)}
            type="button"
            size="sm"
            variant={active ? "primary" : "default"}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
