import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Stack } from "../Stack/Stack.js";
import { Surface } from "../Surface/Surface.js";
import { Text } from "../Text/Text.js";
import { EnvironmentSwitch } from "./EnvironmentSwitch.js";
import { Switch } from "./Switch.js";

const meta = {
  title: "Controls/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { ww: { tier: "physics" } },
  args: { label: "Orchestrator mode", onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const TwoSeats: Story = {
  name: "Two seated positions",
  args: {
    label: undefined,
    labels: { off: "Human in the loop", on: "Orchestrator" },
    "aria-label": "Execution mode",
  },
};
export const PlateLabels: Story = {
  args: {
    label: undefined,
    labels: { off: "Day", on: "Night" },
    plate: true,
    "aria-label": "Environment",
  },
};

export const Keyboard: Story = {
  name: "Keyboard — Space and Enter throw the lever",
  play: async ({ canvasElement, args }) => {
    const lever = within(canvasElement).getByRole("switch", { name: "Orchestrator mode" });
    await expect(lever).toHaveAttribute("aria-checked", "false");
    await userEvent.tab();
    await expect(lever).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(lever).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Enter}");
    await expect(lever).toHaveAttribute("aria-checked", "false");
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
  },
};

export const Environment: Story = {
  name: "EnvironmentSwitch — re-scopes a panel",
  render: () => {
    const id = "env-panel";
    return (
      <Surface id={id} variant="stage" padding={5}>
        <Stack gap={4}>
          <EnvironmentSwitch target={() => document.getElementById(id)} />
          <Text size={0}>
            This panel flips its own environment; the page keeps its own. Every token inside — ink,
            ring, enamel — follows.
          </Text>
        </Stack>
      </Surface>
    );
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("#env-panel") as HTMLElement;
    const lever = await within(canvasElement).findByRole("switch");
    await expect(lever).toBeEnabled();
    const before = panel.getAttribute("data-ww-env");
    await userEvent.click(lever);
    await expect(panel.getAttribute("data-ww-env")).not.toBe(before);
  },
};
