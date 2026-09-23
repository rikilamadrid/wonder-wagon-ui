"use client";
import { useEffect, useState } from "react";
import { Switch, type SwitchProps } from "./Switch.js";

export type Environment = "day" | "night";

export interface EnvironmentSwitchProps
  extends Omit<SwitchProps, "checked" | "defaultChecked" | "onCheckedChange" | "labels" | "label"> {
  /** The element carrying `data-ww-env`. Defaults to the document root. */
  target?: () => HTMLElement | null;
  /** Remember the choice in this browser under this key. A convenience, never the source of truth. */
  persistKey?: string;
  labels?: { off: string; on: string };
  onEnvironmentChange?: (env: Environment) => void;
}

function readEnvironment(target: HTMLElement | null): Environment {
  const explicit = target?.getAttribute("data-ww-env");
  if (explicit === "night" || explicit === "day") return explicit;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
    return "night";
  return "day";
}

/**
 * The bench's own lever: flips the environment attribute on a target element, so every
 * token beneath it switches value. Day and night are both first class; this only chooses.
 */
export function EnvironmentSwitch({
  target,
  persistKey,
  labels = { off: "Day", on: "Night" },
  onEnvironmentChange,
  plate = true,
  ...rest
}: EnvironmentSwitchProps) {
  const resolveTarget = () =>
    target ? target() : typeof document !== "undefined" ? document.documentElement : null;
  const [env, setEnv] = useState<Environment>("day");
  const [mounted, setMounted] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reads the environment once, on mount, by design
  useEffect(() => {
    const el = resolveTarget();
    let initial = readEnvironment(el);
    if (persistKey) {
      try {
        const saved = window.localStorage.getItem(persistKey);
        if (saved === "day" || saved === "night") initial = saved;
      } catch {
        /* storage may be unavailable; the attribute or the system preference decides */
      }
    }
    el?.setAttribute("data-ww-env", initial);
    setEnv(initial);
    setMounted(true);
  }, []);

  const apply = (next: Environment) => {
    resolveTarget()?.setAttribute("data-ww-env", next);
    setEnv(next);
    if (persistKey) {
      try {
        window.localStorage.setItem(persistKey, next);
      } catch {
        /* ignore */
      }
    }
    onEnvironmentChange?.(next);
  };

  return (
    <Switch
      {...rest}
      plate={plate}
      aria-label={rest["aria-label"] ?? "Night environment"}
      labels={labels}
      checked={env === "night"}
      disabled={rest.disabled || !mounted}
      onCheckedChange={(on) => apply(on ? "night" : "day")}
    />
  );
}
