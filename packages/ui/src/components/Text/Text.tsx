import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";
import { cx } from "../../lib/cx.js";
import { flag } from "../../lib/data.js";

export type TextRole = "working" | "engraved" | "plate" | "tag";
export type TextSize = -1 | 0 | 1 | 2 | 3 | 4 | 5;
export type TextTone = "ink" | "muted" | "link" | "ok" | "warn" | "no" | "on-accent";

export interface TextOwnProps {
  /** The element to render. Defaults to `p`. */
  as?: ElementType;
  /**
   * The type role: Working (default), Engraved for names and claims, Plate for labels on
   * objects, Tag for quiet metadata. Named `face` so the ARIA `role` attribute stays free.
   */
  face?: TextRole;
  /** A step on the type scale, `-1` to `5`. Plate ignores the scale. */
  size?: TextSize;
  tone?: TextTone;
  italic?: boolean;
  /** Cap the line length at the reading measure. */
  measure?: boolean;
  /** Tabular numerals for figures that change in place. */
  nums?: boolean;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}

export type TextProps = TextOwnProps & Omit<ComponentPropsWithoutRef<"p">, keyof TextOwnProps>;

/**
 * The three type roles as one component. Working is the default; Engraved is for
 * names and claims and never a paragraph over three lines; Plate is for labels on
 * objects and never a sentence.
 */
export function Text({
  as,
  face = "working",
  size,
  tone,
  italic,
  measure,
  nums,
  className,
  children,
  ...rest
}: TextProps) {
  const Tag: ElementType = as ?? "p";
  return (
    <Tag
      className={cx("ww-text", className)}
      data-face={face}
      data-size={size}
      data-tone={tone}
      data-italic={flag(italic)}
      data-measure={flag(measure)}
      data-nums={flag(nums)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
