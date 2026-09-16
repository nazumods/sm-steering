import { Input, type InputProps } from "@lepid-labs/ui-react";
import { useState } from "react";

interface Props extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
  /** Round committed values to whole numbers. */
  integer?: boolean;
}

/**
 * A numeric input that keeps the user's partial text ("", "-", "1.") while
 * typing and only commits finite numbers. Re-syncs from the prop when the
 * value changes from outside (a preset, an axle-count change).
 */
export function NumberInput({ value, onChange, integer = false, step = 1, ...rest }: Props) {
  const [text, setText] = useState(String(value));
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(String(value));
  }
  return (
    <Input
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      step={step}
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const raw = Number(t);
        if (t.trim() === "" || !Number.isFinite(raw)) return;
        const n = integer ? Math.round(raw) : raw;
        setSynced(n);
        onChange(n);
      }}
      onBlur={() => setText(String(value))}
      {...rest}
    />
  );
}
