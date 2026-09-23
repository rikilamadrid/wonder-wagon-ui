/** Render a boolean prop as a presence-only data attribute: `data-x=""` when true, absent when false. */
export function flag(value: boolean | undefined): "" | undefined {
  return value ? "" : undefined;
}
