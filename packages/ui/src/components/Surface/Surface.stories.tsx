import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Button } from "../Button/Button.js";
import { Stack } from "../Stack/Stack.js";
import { Text } from "../Text/Text.js";
import { Surface } from "./Surface.js";

const meta = {
  title: "Primitives/Surface",
  component: Surface,
  tags: ["autodocs"],
  parameters: { ww: { tier: "physics" } },
  args: {
    padding: 4,
    children: <Text size={0}>The most-used surface in any real product is the quiet card.</Text>,
  },
} satisfies Meta<typeof Surface>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Quiet: Story = { args: { variant: "quiet" } };
export const Plate: Story = {
  args: {
    variant: "plate",
    padding: 2,
    children: (
      <Text face="plate" as="span">
        Section · Marker
      </Text>
    ),
  },
};
export const Well: Story = {
  args: {
    variant: "well",
    children: (
      <Text size={0} nums>
        1.000 ±0.002
      </Text>
    ),
  },
};
export const ObjectWell: Story = {
  name: "Well · object depth",
  args: {
    variant: "well",
    depth: "object",
    children: (
      <Text face="plate" as="span" tone="muted">
        Gauge · tolerance 1.000
      </Text>
    ),
  },
};
export const Stage: Story = {
  args: {
    variant: "stage",
    grid: true,
    padding: 6,
    children: <Button variant="signature">Inspect</Button>,
  },
};
export const Case: Story = {
  args: {
    variant: "case",
    padding: 5,
    children: (
      <Text face="engraved" size={3} as="h3">
        A ridged frame
      </Text>
    ),
  },
};

export const DarkPanelInDay: Story = {
  name: "Dark panel in day — the ring follows the ground",
  render: () => (
    <Stack gap={4}>
      <Surface variant="quiet" tone="light" padding={4}>
        <Stack gap={3}>
          <Text size={0}>
            On paper the focus ring is ink. This card is pinned to day whatever the page is.
          </Text>
          <Button>Quiet control</Button>
        </Stack>
      </Surface>
      <Surface variant="well" tone="dark" depth="object" padding={4}>
        <Stack gap={3}>
          <Text size={0}>
            Inside a dark panel the same control gets the pale ring, because the panel re-scoped the
            environment.
          </Text>
          <Button data-testid="dark-button">Quiet control</Button>
        </Stack>
      </Surface>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const dark = canvasElement.querySelector("[data-testid='dark-button']") as HTMLElement;
    const light = canvasElement.querySelectorAll(".ww-button")[0] as HTMLElement;
    const ringDark = getComputedStyle(dark).getPropertyValue("--ww-focus").trim();
    const ringLight = getComputedStyle(light).getPropertyValue("--ww-focus").trim();
    await expect(ringDark).not.toBe(ringLight);
  },
};
