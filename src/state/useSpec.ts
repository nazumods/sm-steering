import { useCallback, useEffect, useState } from "react";
import type { VehicleSpec } from "../geometry/ackermann";
import { decodeSpec, encodeSpec } from "./codec";
import { DEFAULT_SPEC } from "./spec";

function readHash(): VehicleSpec {
  if (typeof window === "undefined") return DEFAULT_SPEC;
  return decodeSpec(window.location.hash) ?? DEFAULT_SPEC;
}

/** Vehicle spec state mirrored into the URL hash so a setup can be shared as a link. */
export function useSpec(): [VehicleSpec, (next: VehicleSpec) => void] {
  const [spec, setSpec] = useState<VehicleSpec>(readHash);

  useEffect(() => {
    const next = `#${encodeSpec(spec)}`;
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [spec]);

  useEffect(() => {
    const onHash = () => setSpec(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const update = useCallback((next: VehicleSpec) => setSpec(next), []);
  return [spec, update];
}
