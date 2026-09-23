"use client";
import type { ComponentPropsWithoutRef, Ref } from "react";
import { cx } from "../../lib/cx.js";
import { describedBy, useField } from "../Field/Field.js";

export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  /** Override the enclosing Field's invalid state. */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** A native input on a quiet surface. Inside a Field it wires its own id and ARIA. */
export function Input({
  className,
  invalid,
  id,
  required,
  disabled,
  "aria-describedby": describedByProp,
  ...rest
}: InputProps) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  return (
    <input
      className={cx("ww-input", className)}
      id={id ?? field?.id}
      required={required ?? field?.required}
      disabled={disabled ?? field?.disabled}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy(field, describedByProp)}
      {...rest}
    />
  );
}
