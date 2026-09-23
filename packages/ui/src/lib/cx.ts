/** Join class names, dropping falsy values. Tiny on purpose; no dependency. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
