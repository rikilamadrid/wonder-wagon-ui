import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";
import { cx } from "../../lib/cx.js";
import { flag } from "../../lib/data.js";

export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface StackOwnProps {
  as?: ElementType;
  /** Gap as a step on the space scale. Default `4` (1rem). */
  gap?: SpaceStep;
  /** Column by default. A row wraps when asked to. */
  direction?: "column" | "row";
  wrap?: boolean;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  inline?: boolean;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}
export type StackProps = StackOwnProps & Omit<ComponentPropsWithoutRef<"div">, keyof StackOwnProps>;

/** Layout without utilities: a flex column (or row) whose gap comes from the space scale. */
export function Stack({
  as,
  gap = 4,
  direction = "column",
  wrap,
  align,
  justify,
  inline,
  className,
  children,
  ...rest
}: StackProps) {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cx("ww-stack", className)}
      data-gap={gap}
      data-direction={direction}
      data-wrap={flag(wrap)}
      data-align={align}
      data-justify={justify}
      data-inline={flag(inline)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
