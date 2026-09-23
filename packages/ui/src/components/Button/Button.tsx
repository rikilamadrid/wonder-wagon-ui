import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { cx } from "../../lib/cx.js";
import { flag } from "../../lib/data.js";

export type ButtonVariant = "quiet" | "signature" | "ghost";

export interface ButtonOwnProps {
  /**
   * quiet — the default and most buttons · signature — the five-layer raised enamel
   * action, one per screen · ghost — a quiet button without a border.
   */
  variant?: ButtonVariant;
  /** Announces busy state and shows the working indicator in place of the label. */
  loading?: boolean;
  /** What the button says while loading. Loading is the object doing its job, so say what it is doing. */
  loadingLabel?: string;
  /** Force the pressed geometry, for specimens and toggles. */
  pressed?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}
export type ButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonOwnProps>;

/**
 * Quiet by default. The signature variant is the one raised, enamelled action a screen
 * may carry; its physics (rim, raised stacks, throw) come entirely from tokens.
 */
export function Button({
  variant = "quiet",
  loading,
  loadingLabel = "Working…",
  pressed,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("ww-button", className)}
      data-variant={variant}
      data-loading={flag(loading)}
      data-pressed={flag(pressed)}
      aria-busy={loading || undefined}
      aria-pressed={pressed}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className="ww-button__detent" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
