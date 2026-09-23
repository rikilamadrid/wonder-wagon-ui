import { themes } from "@wonder-wagon/themes";
import {
  breakpoints,
  code,
  depth,
  type Env,
  material,
  motion,
  radius,
  ratio,
  semanticColor,
  semanticValues,
  space,
  type as typeTokens,
} from "@wonder-wagon/tokens";
import { Button, Stack, Surface, Switch, Text } from "@wonder-wagon/ui";
import { useState } from "react";

const label = (s: string) => (
  <Text face="plate" as="span" tone="muted" style={{ fontSize: "0.625rem" }}>
    {s}
  </Text>
);

/** Colour in context: every semantic role placed on the ground it is measured against, both environments side by side. */
export function ColorSpecimen() {
  const rows: Array<[string, string]> = [
    ["ink", "ground"],
    ["ink-muted", "ground"],
    ["ink", "surface"],
    ["link", "ground"],
    ["status-ok", "surface"],
    ["status-warn", "surface"],
    ["status-no", "surface"],
    ["accent-ink", "accent"],
    ["metal", "ground"],
    ["focus", "ground"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
        gap: "var(--ww-space-4)",
      }}
    >
      {(["day", "night"] as Env[]).map((env) => {
        const v = semanticValues(env);
        return (
          <div
            key={env}
            data-ww-env={env}
            style={{
              background: "var(--ww-ground)",
              padding: "var(--ww-space-4)",
              borderRadius: "var(--ww-radius-md)",
              border: "1px solid var(--ww-hairline)",
            }}
          >
            <Stack gap={2}>
              {label(`${env} · ground ${v.ground}`)}
              {rows.map(([fg, on]) => (
                <div
                  key={`${fg}-${on}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "var(--ww-space-3)",
                    alignItems: "center",
                    padding: "var(--ww-space-2) var(--ww-space-3)",
                    background: `var(--ww-${on})`,
                    borderRadius: "var(--ww-radius-sm)",
                    border: on === "ground" ? "1px dashed var(--ww-hairline)" : undefined,
                  }}
                >
                  <span
                    style={{
                      color: fg === "focus" ? "var(--ww-ink)" : `var(--ww-${fg})`,
                      fontFamily: "var(--ww-font-working)",
                      fontSize: "var(--ww-text-0)",
                      outline: fg === "focus" ? "3px solid var(--ww-focus)" : undefined,
                      outlineOffset: fg === "focus" ? "3px" : undefined,
                      width: "fit-content",
                    }}
                  >
                    {fg} on {on}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ww-font-plate)",
                      fontSize: "0.625rem",
                      color: "var(--ww-ink-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {v[fg] && v[on] && /^#/.test(v[fg] as string) && /^#/.test(v[on] as string)
                      ? ratio(v[fg] as string, v[on] as string).toFixed(2)
                      : "—"}
                  </span>
                </div>
              ))}
            </Stack>
          </div>
        );
      })}
    </div>
  );
}

/** Material chips: the things you could hold, as enamel swatches with a brass ring. */
export function MaterialSpecimen() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ww-space-3)" }}>
      {Object.entries(material).map(([name, hex]) => (
        <div
          key={name}
          style={{
            display: "grid",
            gap: "var(--ww-space-1)",
            justifyItems: "center",
            width: "5.5rem",
          }}
        >
          <span
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "50%",
              background: hex,
              boxShadow:
                "var(--ww-depth-rim), inset 0 -2px 0 rgb(0 0 0 / 0.3), 0 0 0 3px var(--ww-metal), var(--ww-depth-cast-contact)",
            }}
          />
          <Text
            face="plate"
            as="span"
            tone="muted"
            style={{ fontSize: "0.5625rem", textAlign: "center" }}
          >
            {name}
          </Text>
          <Text
            as="span"
            size={-1}
            nums
            tone="muted"
            style={{ fontFamily: "var(--ww-font-plate)" }}
          >
            {hex}
          </Text>
        </div>
      ))}
    </div>
  );
}

/** The type ladder as a specimen, not a table. */
export function TypeSpecimen() {
  const steps: Array<[string, number]> = [
    ["text-5", 5],
    ["text-4", 4],
    ["text-3", 3],
    ["text-2", 2],
    ["text-1", 1],
    ["text-0", 0],
    ["text--1", -1],
  ];
  return (
    <Stack gap={0}>
      {steps.map(([name, size]) => (
        <div
          key={name}
          style={{
            display: "grid",
            gridTemplateColumns: "6rem 1fr",
            gap: "var(--ww-space-4)",
            alignItems: "baseline",
            padding: "var(--ww-space-2) 0",
            borderBottom: "1px dashed var(--ww-hairline)",
          }}
        >
          {label(`${name} · ${typeTokens[name as keyof typeof typeTokens].value}`)}
          <Text
            face={size >= 3 ? "engraved" : "working"}
            size={size as -1 | 0 | 1 | 2 | 3 | 4 | 5}
            italic={size === 5}
            tone={size <= 0 ? "muted" : "ink"}
          >
            {size >= 3
              ? "Reference objects for a family of tools"
              : "Body copy stays on the quiet ground and never sits on enamel or metal."}
          </Text>
        </div>
      ))}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "6rem 1fr",
          gap: "var(--ww-space-4)",
          alignItems: "baseline",
          padding: "var(--ww-space-2) 0",
        }}
      >
        {label("plate · 11px")}
        <Text face="plate" as="span">
          Labels on objects · WW-047 · never a sentence
        </Text>
      </div>
    </Stack>
  );
}

/** Spacing drawn as a caliper rule: bars to scale with one another. */
export function SpaceSpecimen() {
  return (
    <Stack gap={2}>
      {Object.entries(space).map(([name, value]) => (
        <div
          key={name}
          style={{
            display: "grid",
            gridTemplateColumns: "5rem 1fr 4rem",
            gap: "var(--ww-space-3)",
            alignItems: "center",
          }}
        >
          {label(name)}
          <span
            style={{
              height: "0.6rem",
              width: `calc(${value} * 6)`,
              maxWidth: "100%",
              borderRadius: "2px",
              background:
                "linear-gradient(160deg, var(--ww-metal-lit), var(--ww-metal) 55%, var(--ww-metal-shade))",
              boxShadow: "var(--ww-depth-rim), var(--ww-depth-cast-contact)",
            }}
          />
          <Text as="span" size={-1} nums tone="muted">
            {value}
          </Text>
        </div>
      ))}
    </Stack>
  );
}

/** Radii: the quiet set beside every product's asymmetric object set. */
export function RadiusSpecimen() {
  return (
    <Stack gap={4}>
      <div style={{ display: "flex", gap: "var(--ww-space-4)", flexWrap: "wrap" }}>
        {Object.entries(radius).map(([name, value]) => (
          <div
            key={name}
            style={{ display: "grid", gap: "var(--ww-space-1)", justifyItems: "center" }}
          >
            <span
              style={{
                width: "4rem",
                height: "3rem",
                borderRadius: value,
                background: "var(--ww-surface)",
                border: "1px solid var(--ww-hairline-strong)",
              }}
            />
            {label(`${name} · ${value}`)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "var(--ww-space-4)", flexWrap: "wrap" }}>
        {Object.values(themes).map((t) => (
          <div
            key={t.id}
            style={{ display: "grid", gap: "var(--ww-space-1)", justifyItems: "center" }}
          >
            <span
              style={{
                width: "4.5rem",
                height: "3.25rem",
                borderRadius: t.radiusObject,
                background: `linear-gradient(160deg, ${t.enamel.night}, ${t.enamel.day})`,
                boxShadow:
                  "var(--ww-depth-rim), 0 0 0 2px var(--ww-metal), var(--ww-depth-cast-contact)",
              }}
            />
            {label(`${t.serial} · ${t.radiusObject}`)}
          </div>
        ))}
      </div>
    </Stack>
  );
}

/** Depth: every stack shipped whole, applied to the same tile so they can be compared. */
export function DepthSpecimen() {
  const names = [
    "rim",
    "quiet",
    "key",
    "recess-quiet",
    "recess-object",
    "cast",
    "raised-rest",
    "raised-hover",
    "raised-press",
    "stamp",
  ] as const;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "var(--ww-space-5)",
        padding: "var(--ww-space-4) 0",
      }}
    >
      {names.map((name) => (
        <div
          key={name}
          style={{ display: "grid", gap: "var(--ww-space-2)", justifyItems: "start" }}
        >
          <span
            style={{
              display: "block",
              width: "100%",
              height: "4rem",
              borderRadius: "var(--ww-radius-sm)",
              background: name.startsWith("raised")
                ? "linear-gradient(160deg, color-mix(in srgb, var(--ww-accent) 78%, white), var(--ww-accent) 45%, color-mix(in srgb, var(--ww-accent) 72%, black))"
                : name === "recess-object"
                  ? "var(--ww-ground-code)"
                  : "var(--ww-surface)",
              boxShadow: `var(--ww-depth-${name})`,
              transform:
                name === "raised-hover"
                  ? "translateY(-2px)"
                  : name === "raised-press"
                    ? "translateY(2px)"
                    : undefined,
            }}
          />
          {label(`depth-${name}`)}
          <Text as="span" size={-1} tone="muted">
            {(depth as Record<string, { about: string }>)[name]?.about}
          </Text>
        </div>
      ))}
    </div>
  );
}

const DETENTS = Array.from({ length: 12 }, (_, i) => i);

/** Motion: throw the levers and step the detent; reduced motion is honoured by the tokens themselves. */
export function MotionSpecimen() {
  const [on, setOn] = useState(false);
  const [step, setStep] = useState(0);
  return (
    <Stack gap={4}>
      <Stack direction="row" gap={3} wrap>
        <Button onClick={() => setOn((v) => !v)}>Throw the lever</Button>
        <Button onClick={() => setStep((s) => (s + 1) % 12)}>Advance detent</Button>
        <Text as="span" size={0} nums tone="muted">
          Detent {step + 1} of 12 · throw {motion["motion-throw"]} · {motion["ease-throw"]}
        </Text>
      </Stack>
      <Switch
        checked={on}
        onCheckedChange={setOn}
        labels={{ off: "Seated", on: "Thrown" }}
        plate
        aria-label="Motion specimen lever"
      />
      <div
        style={{ display: "inline-grid", gridTemplateColumns: "repeat(12, 0.6rem)", gap: "0.3rem" }}
        aria-hidden="true"
      >
        {DETENTS.map((i) => (
          <span
            key={`detent-${i}`}
            style={{
              height: "1rem",
              borderRadius: "2px",
              background: i <= step ? "var(--ww-accent)" : "var(--ww-hairline)",
              transition: `background-color ${motion["motion-throw"]} steps(1)`,
            }}
          />
        ))}
      </div>
      <Text size={0} tone="muted" measure>
        Mechanical, not bouncy: a lever throws and seats; a counter detents. Under
        prefers-reduced-motion the tokens set every duration to 1ms and the state is still read from
        text and aria-checked.
      </Text>
    </Stack>
  );
}

/** Focus: the ring on every ground, including a dark panel in day. */
export function FocusSpecimen() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        gap: "var(--ww-space-4)",
      }}
    >
      {[
        { env: "day", variant: "quiet" as const, title: "Day · quiet card · ink ring" },
        {
          env: "day",
          variant: "well" as const,
          depth: "object" as const,
          title: "Day · dark panel · pale ring",
        },
        { env: "night", variant: "quiet" as const, title: "Night · quiet card · pale ring" },
      ].map((c) => (
        <div
          key={c.title}
          data-ww-env={c.env}
          style={{
            background: "var(--ww-ground)",
            padding: "var(--ww-space-4)",
            borderRadius: "var(--ww-radius-md)",
          }}
        >
          <Surface variant={c.variant} {...(c.depth ? { depth: c.depth } : {})} padding={4}>
            <Stack gap={3}>
              {label(c.title)}
              <Button style={{ outline: "3px solid var(--ww-focus)", outlineOffset: "3px" }}>
                Focused control
              </Button>
            </Stack>
          </Surface>
        </div>
      ))}
    </div>
  );
}

/** Breakpoints as a rule. */
export function BreakpointSpecimen() {
  return (
    <Stack gap={2}>
      {Object.entries(breakpoints).map(([name, value]) => (
        <div
          key={name}
          style={{
            display: "grid",
            gridTemplateColumns: "3rem 1fr 4rem",
            gap: "var(--ww-space-3)",
            alignItems: "center",
          }}
        >
          {label(name)}
          <span
            style={{
              height: "0.4rem",
              width: `calc(${value} / 1.6)`,
              maxWidth: "100%",
              background: "var(--ww-hairline-strong)",
              borderRadius: "2px",
            }}
          />
          <Text as="span" size={-1} nums tone="muted">
            {value}
          </Text>
        </div>
      ))}
      <Text size={0} tone="muted">
        The floor is 320px: no horizontal document overflow at any width.
      </Text>
    </Stack>
  );
}

/** The syntax palette on its own ground, both environments. */
export function CodeSpecimen() {
  const sample: Array<[string, string]> = [
    ["code-keyword", "import"],
    ["code-name", "{ Button }"],
    ["code-muted", "from"],
    ["code-string", '"@wonder-wagon/ui"'],
    ["code-fn", "createForge"],
    ["code-constant", "0.1.0"],
    ["code-invalid", "unknown"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "var(--ww-space-4)",
      }}
    >
      {(["day", "night"] as Env[]).map((env) => (
        <pre
          key={env}
          data-ww-env={env}
          style={{
            margin: 0,
            padding: "var(--ww-space-4)",
            background: "var(--ww-code-bg)",
            color: "var(--ww-code-fg)",
            borderRadius: "var(--ww-radius-sm)",
            border: "1px solid var(--ww-hairline)",
            fontFamily: "var(--ww-font-plate)",
            fontSize: "var(--ww-text-0)",
            lineHeight: 1.7,
            overflowX: "auto",
          }}
        >
          {sample.map(([role, word]) => (
            <span key={role} style={{ color: `var(--ww-${role})` }}>
              {word}{" "}
            </span>
          ))}
          {"\n"}
          <span
            style={{ color: "var(--ww-code-muted)" }}
          >{`// ${env}: lowest pair ${env === "day" ? "5.78" : "6.32"}:1 — ${Object.keys(code).length} roles, no cool hue`}</span>
        </pre>
      ))}
    </div>
  );
}

/** The object/quiet split in one frame. */
export function ObjectQuietSpecimen() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "var(--ww-space-4)",
      }}
    >
      <Surface variant="quiet" padding={4}>
        <Stack gap={3}>
          <Text face="tag" as="span">
            Quiet · settings
          </Text>
          <Stack direction="row" justify="between" gap={3}>
            <Text size={0}>Execution mode</Text>
            <Text size={0} tone="muted">
              orchestrator
            </Text>
          </Stack>
          <Stack direction="row" justify="between" gap={3}>
            <Text size={0}>Night environment</Text>
            <Switch aria-label="Night environment" />
          </Stack>
          <Stack direction="row" gap={2}>
            <Button>Cancel</Button>
            <Button>Save</Button>
          </Stack>
        </Stack>
      </Surface>
      <Surface variant="stage" padding={4}>
        <Stack gap={3} align="start">
          <Text face="tag" as="span">
            Object · one per viewport
          </Text>
          <Surface variant="well" depth="object" padding={3}>
            <Text face="plate" as="span" tone="muted">
              Gauge · tolerance
            </Text>
            <Text size={3} nums as="div">
              1.000 <span style={{ color: "var(--ww-worn)" }}>±0.002</span>
            </Text>
          </Surface>
          <Button variant="signature">Inspect case</Button>
          <Text face="plate" as="span" tone="muted" style={{ fontSize: "0.625rem" }}>
            WW-047
          </Text>
        </Stack>
      </Surface>
    </div>
  );
}

/** Semantic roles table, from the source, for the parts list at the end of the Color page. */
export function SemanticTable() {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--ww-text-0)" }}>
        <thead>
          <tr>
            {["Role", "Day", "Night", "About"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "var(--ww-space-2)",
                  borderBottom: "1px solid var(--ww-hairline)",
                  fontFamily: "var(--ww-font-plate)",
                  fontSize: "0.625rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ww-ink-muted)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(semanticColor).map(([name, t]) => (
            <tr key={name}>
              <td
                style={{
                  padding: "var(--ww-space-2)",
                  borderBottom: "1px solid var(--ww-hairline)",
                  fontFamily: "var(--ww-font-plate)",
                  fontSize: "var(--ww-text--1)",
                }}
              >
                --ww-{name}
              </td>
              <td
                style={{
                  padding: "var(--ww-space-2)",
                  borderBottom: "1px solid var(--ww-hairline)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "0.9rem",
                    height: "0.9rem",
                    background: t.value.day,
                    borderRadius: "3px",
                    verticalAlign: "middle",
                    marginRight: "0.4rem",
                    border: "1px solid var(--ww-hairline)",
                  }}
                />
                {t.value.day}
              </td>
              <td
                style={{
                  padding: "var(--ww-space-2)",
                  borderBottom: "1px solid var(--ww-hairline)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "0.9rem",
                    height: "0.9rem",
                    background: t.value.night,
                    borderRadius: "3px",
                    verticalAlign: "middle",
                    marginRight: "0.4rem",
                    border: "1px solid var(--ww-hairline)",
                  }}
                />
                {t.value.night}
              </td>
              <td
                style={{
                  padding: "var(--ww-space-2)",
                  borderBottom: "1px solid var(--ww-hairline)",
                  color: "var(--ww-ink-muted)",
                }}
              >
                {t.about}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Every product theme, rendered as the same composite so the family reads as siblings, never a template. */
export function ProductsSpecimen() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
        gap: "var(--ww-space-4)",
      }}
    >
      {Object.values(themes).map((t) => (
        <div
          key={t.id}
          style={
            {
              ["--ww-accent" as string]: t.accent.night,
              ["--ww-accent-ink" as string]: t.accentInk.night,
              ["--ww-accent-low" as string]: t.accentLow.night,
              ["--ww-link" as string]: t.link.night,
              ["--ww-signal" as string]: t.signal.night,
              ["--ww-signal-edge" as string]: t.signalEdge.night,
              ["--ww-radius-object" as string]: t.radiusObject,
            } as React.CSSProperties
          }
        >
          <Surface variant="quiet" padding={4}>
            <Stack gap={3} align="start">
              <Stack direction="row" gap={2} align="center">
                <span
                  style={{
                    width: "1.1rem",
                    height: "1.1rem",
                    borderRadius: "var(--ww-radius-object)",
                    background: `linear-gradient(160deg, ${t.enamel.night}, ${t.enamel.day})`,
                    boxShadow: "0 0 0 2px var(--ww-metal)",
                  }}
                />
                <Text face="engraved" size={2} as="h3">
                  {t.name}
                </Text>
              </Stack>
              <Text face="plate" as="span" tone="muted" style={{ fontSize: "0.625rem" }}>
                {t.serial}-047 · {t.status}
              </Text>
              <Text size={0} tone="muted">
                {t.product}
              </Text>
              <Button variant="signature">Signature</Button>
              <Text size={0}>
                <a href="#products" style={{ color: "var(--ww-link)" }}>
                  A link in the product's own colour
                </a>
                , with a{" "}
                <span
                  style={{
                    display: "inline-block",
                    width: ".5rem",
                    height: ".5rem",
                    borderRadius: "50%",
                    background: "var(--ww-signal)",
                    boxShadow: "0 0 0 1px var(--ww-signal-edge)",
                  }}
                />{" "}
                signal.
              </Text>
            </Stack>
          </Surface>
        </div>
      ))}
    </div>
  );
}
