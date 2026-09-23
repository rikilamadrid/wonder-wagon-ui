"use client";
import { type ComponentPropsWithoutRef, type ReactNode, type Ref, useState } from "react";
import { cx } from "../../lib/cx.js";
import { flag } from "../../lib/data.js";

export interface SwitchOwnProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label. Provide this or `aria-label`. */
  label?: ReactNode;
  /** Two labels either side of the lever: the seated positions. The active one reads as ink. */
  labels?: { off: ReactNode; on: ReactNode };
  /** Set the labels in Plate type, for controls on the bench itself. */
  plate?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}
export type SwitchProps = SwitchOwnProps &
  Omit<
    ComponentPropsWithoutRef<"button">,
    keyof SwitchOwnProps | "type" | "role" | "aria-checked" | "onChange"
  >;

/**
 * A lever with a visible throw and two seated positions. `role="switch"`, toggled by
 * Space and Enter as any button is. The thumb is brass over a quiet recess; under
 * reduced motion it jumps and the seated state is still read from `aria-checked`.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  labels,
  plate,
  disabled,
  className,
  onClick,
  ...rest
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={cx("ww-switch", className)}
      data-plate={flag(plate)}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const next = !on;
        if (!isControlled) setInternal(next);
        onCheckedChange?.(next);
      }}
      {...rest}
    >
      {labels ? (
        <span className="ww-switch__label" data-active={flag(!on)}>
          {labels.off}
        </span>
      ) : null}
      <span className="ww-switch__track" aria-hidden="true">
        <span className="ww-switch__thumb" />
      </span>
      {labels ? (
        <span className="ww-switch__label" data-active={flag(on)}>
          {labels.on}
        </span>
      ) : null}
      {label ? (
        <span className="ww-switch__label" data-active="">
          {label}
        </span>
      ) : null}
    </button>
  );
}
