import { Input, type InputProps } from "@lepid-labs/ui-react";
import { useState } from "react";

interface Props extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * A numeric input that keeps the user's partial text ("", "-", "1.") while
 * typing and only commits finite numbers. Re-syncs from the prop when the
 * value changes from outside (a preset, an axle-count change).
 */
export function NumberInput({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(String(value));
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(String(value));
  }
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = Number(t);
        if (t.trim() !== "" && Number.isFinite(n)) {
          setSynced(n);
          onChange(n);
        }
      }}
      onBlur={() => setText(String(value))}
      {...rest}
    />
  );
}
