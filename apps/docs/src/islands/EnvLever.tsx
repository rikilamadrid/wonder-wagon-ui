import { EnvironmentSwitch } from "@wonder-wagon/ui";

/** The drafting room's own lever. Persists per browser; the attribute on <html> is the truth. */
export function EnvLever() {
  return <EnvironmentSwitch persistKey="ww-docs-env" aria-label="Night environment" />;
}
