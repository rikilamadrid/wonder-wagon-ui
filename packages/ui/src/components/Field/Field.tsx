"use client";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
  useId,
} from "react";
import { cx } from "../../lib/cx.js";
import { flag } from "../../lib/data.js";

export interface FieldContextValue {
  id: string;
  hintId: string;
  errorId: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  hasHint: boolean;
  hasError: boolean;
}
const FieldContext = createContext<FieldContextValue | null>(null);

/** Read the enclosing Field, if any. Controls use it to wire ids and ARIA without props. */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldRootProps extends Omit<ComponentPropsWithoutRef<"div">, "id"> {
  /** Stable id for the control; generated when omitted. */
  id?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** Tell the Field which descriptions exist so `aria-describedby` only names rendered ids. */
  hint?: boolean;
  error?: boolean;
  children?: ReactNode;
}

function Root({
  id,
  invalid = false,
  required = false,
  disabled = false,
  hint = false,
  error = false,
  className,
  children,
  ...rest
}: FieldRootProps) {
  const generated = useId();
  const base = id ?? `ww-field-${generated}`;
  const value: FieldContextValue = {
    id: base,
    hintId: `${base}-hint`,
    errorId: `${base}-error`,
    invalid,
    required,
    disabled,
    hasHint: hint,
    hasError: error && invalid,
  };
  return (
    <FieldContext.Provider value={value}>
      <div
        className={cx("ww-field", className)}
        data-invalid={flag(invalid)}
        data-disabled={flag(disabled)}
        {...rest}
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}

function Label({ className, children, ...rest }: ComponentPropsWithoutRef<"label">) {
  const field = useField();
  return (
    <label className={cx("ww-field__label", className)} htmlFor={field?.id} {...rest}>
      {children}
      {field?.required ? <span className="ww-field__required">(required)</span> : null}
    </label>
  );
}

function Hint({ className, children, ...rest }: ComponentPropsWithoutRef<"p">) {
  const field = useField();
  return (
    <p className={cx("ww-field__hint", className)} id={field?.hintId} {...rest}>
      {children}
    </p>
  );
}

/** Rendered only when the field is invalid; announced politely. The corrective action is always plain. */
function FieldError({ className, children, ...rest }: ComponentPropsWithoutRef<"p">) {
  const field = useField();
  if (field && !field.invalid) return null;
  return (
    <p
      className={cx("ww-field__error", className)}
      id={field?.errorId}
      aria-live="polite"
      {...rest}
    >
      <span className="ww-sr">Error: </span>
      {children}
    </p>
  );
}

/** Compose the `aria-describedby` a control inside this Field should carry. */
export function describedBy(field: FieldContextValue | null, extra?: string): string | undefined {
  if (!field) return extra;
  const ids = [
    field.hasHint ? field.hintId : null,
    field.hasError ? field.errorId : null,
    extra ?? null,
  ].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/**
 * Label, hint and error around one control, with ids and ARIA wired by context so the
 * control never has to be told. A form without this is not a form.
 */
export const Field = { Root, Label, Hint, Error: FieldError };
