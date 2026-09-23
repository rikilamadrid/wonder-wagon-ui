import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../docs/**/*.mdx", "../../../packages/ui/src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  staticDirs: ["../public"],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  docs: { defaultName: "Docs" },
};
export default config;
