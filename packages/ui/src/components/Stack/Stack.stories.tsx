import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Surface } from "../Surface/Surface.js";
import { Text } from "../Text/Text.js";
import { Stack } from "./Stack.js";

const Block = ({ children }: { children: string }) => (
  <Surface variant="quiet" padding={3}>
    <Text size={0}>{children}</Text>
  </Surface>
);

const meta = {
  title: "Primitives/Stack",
  component: Stack,
  tags: ["autodocs"],
  parameters: { ww: { tier: "quiet" } },
  render: (args) => (
    <Stack {...args}>
      <Block>One</Block>
      <Block>Two</Block>
      <Block>Three</Block>
    </Stack>
  ),
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = { args: { gap: 4 } };
export const Row: Story = { args: { direction: "row", gap: 3, wrap: true } };
export const Tight: Story = { args: { gap: 1 } };
export const Loose: Story = {
  args: { gap: 8 },
  play: async ({ canvasElement }) => {
    const stack = canvasElement.querySelector(".ww-stack") as HTMLElement;
    await expect(getComputedStyle(stack).gap).toBe("64px");
  },
};
