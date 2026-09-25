import type { Decorator, Preview } from "@storybook/react-vite";
import "@wonder-wagon/tokens/css";
import "@wonder-wagon/ui/styles.css";
import "./bench.css";
import { themes } from "@wonder-wagon/themes";
import forgeCss from "@wonder-wagon/themes/forge.css?raw";
import lamaCss from "@wonder-wagon/themes/lama.css?raw";
import lorekeeperCss from "@wonder-wagon/themes/lorekeeper.css?raw";
import pathfinderCss from "@wonder-wagon/themes/pathfinder.css?raw";
import wonderWagonCss from "@wonder-wagon/themes/wonder-wagon.css?raw";
import { useEffect } from "react";

const THEME_CSS: Record<string, string> = {
  "wonder-wagon": wonderWagonCss,
  pathfinder: pathfinderCss,
  forge: forgeCss,
  lorekeeper: lorekeeperCss,
  lama: lamaCss,
};

/** Apply the chosen environment to the document and the chosen product theme as one <style>. */
const withBench: Decorator = (Story, context) => {
  const { env, product, ground } = context.globals as {
    env: string;
    product: string;
    ground: string;
  };
  useEffect(() => {
    document.documentElement.setAttribute("data-ww-env", env);
    let style = document.getElementById("ww-theme") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "ww-theme";
      document.head.appendChild(style);
    }
    style.textContent = THEME_CSS[product] ?? THEME_CSS["wonder-wagon"] ?? "";
  }, [env, product]);
  const theme = themes[product as keyof typeof themes] ?? themes["wonder-wagon"];
  const tier = (context.parameters as { ww?: { tier?: string } }).ww?.tier ?? "quiet";
  const serial =
    `${theme.serial}-047 · ${context.title.split("/").pop()} · ${context.name}`.toUpperCase();
  const isDocs = context.viewMode === "docs";
  return (
    <div className="sb-bench" data-ground={ground} data-docs={isDocs ? "" : undefined}>
      <div className="sb-tray" data-tier={tier}>
        <span className="sb-tray__plate" aria-hidden="true">
          {serial}
        </span>
        <div className="sb-tray__specimen">
          <Story />
        </div>
      </div>
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    env: {
      description: "Environment",
      toolbar: {
        title: "Environment",
        icon: "sun",
        items: [
          { value: "day", title: "Day" },
          { value: "night", title: "Night" },
          { value: "auto", title: "Auto (system)" },
        ],
        dynamicTitle: true,
      },
    },
    product: {
      description: "Product theme",
      toolbar: {
        title: "Product",
        icon: "paintbrush",
        items: [
          { value: "wonder-wagon", title: "Wonder Wagon · the bench" },
          { value: "pathfinder", title: "Pathfinder" },
          { value: "forge", title: "Forge" },
          { value: "lorekeeper", title: "Lorekeeper (pilot)" },
          { value: "lama", title: "Lama (draft)" },
        ],
        dynamicTitle: true,
      },
    },
    ground: {
      description: "Ground behind the specimen",
      toolbar: {
        title: "Ground",
        icon: "grid",
        items: [
          { value: "stage", title: "Stage (Field Paper)" },
          { value: "quiet", title: "Quiet (reading ground)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { env: "night", product: "wonder-wagon", ground: "stage" },
  decorators: [withBench],
  parameters: {
    layout: "fullscreen",
    backgrounds: { disable: true },
    a11y: { test: "error" },
    options: {
      storySort: {
        order: [
          "Workshop",
          ["Welcome", "Environment"],
          "Foundations",
          "Primitives",
          "Controls",
          "Patterns",
          "Accessibility",
          "Theming",
          "Products",
        ],
      },
    },
    docs: { toc: true },
  },
  tags: ["autodocs"],
};
export default preview;
