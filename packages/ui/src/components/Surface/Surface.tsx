import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";
import { cx } from "../../lib/cx.js";
import { flag } from "../../lib/data.js";
import type { SpaceStep } from "../Stack/Stack.js";

export type SurfaceVariant = "ground" | "stage" | "quiet" | "plate" | "well" | "case";
export type SurfaceTone = "inherit" | "light" | "dark";

export interface SurfaceOwnProps {
  as?: ElementType;
  /**
   * ground — the page · stage — Field Paper for a specimen or an object · quiet — a card
   * (the most-used surface in any product) · plate — a raised label strip · well — a recess
   * · case — a ridged frame that holds an object.
   */
  variant?: SurfaceVariant;
  /**
   * `dark` re-scopes every semantic token inside to the night values — ink, focus ring,
   * enamel — by setting the environment attribute on this element. That is the rule
   * "the focus ring follows the ground behind the control" made structural.
   */
  tone?: SurfaceTone;
  /** For `well`: the quiet two-layer recess, or the ten-layer object well. */
  depth?: "quiet" | "object";
  /** For `stage`: a faint drafting grid. Never behind body copy. */
  grid?: boolean;
  padding?: SpaceStep;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}
export type SurfaceProps = SurfaceOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SurfaceOwnProps>;

const ENV: Record<SurfaceTone, string | undefined> = {
  inherit: undefined,
  light: "day",
  dark: "night",
};

/** The six surface types. Objects are compositions built from this, never a variant of it. */
export function Surface({
  as,
  variant = "quiet",
  tone = "inherit",
  depth,
  grid,
  padding,
  className,
  children,
  ...rest
}: SurfaceProps) {
  const Tag: ElementType = as ?? "div";
  const resolvedTone =
    tone === "inherit" && variant === "well" && depth === "object" ? "dark" : tone;
  return (
    <Tag
      className={cx("ww-surface", className)}
      data-variant={variant}
      data-depth={variant === "well" ? (depth ?? "quiet") : undefined}
      data-grid={flag(grid)}
      data-padding={padding}
      data-ww-env={ENV[resolvedTone]}
      {...rest}
    >
      {children}
    </Tag>
  );
}
