import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Stack } from "../Stack/Stack.js";
import { Text } from "./Text.js";

const meta = {
  title: "Primitives/Text",
  component: Text,
  tags: ["autodocs"],
  args: { children: "Every tool has already lived a life." },
  parameters: { ww: { tier: "physics" } },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Working: Story = {};
export const Engraved: Story = {
  args: {
    face: "engraved",
    size: 4,
    as: "h2",
    children: "Reference objects for a family of tools",
  },
};
export const Plate: Story = {
  args: { face: "plate", as: "span", children: "Button · Signature · WW-047" },
};
export const Tag: Story = { args: { face: "tag", as: "span", children: "Quiet metadata" } };

export const Scale: Story = {
  render: () => (
    <Stack gap={3}>
      <Text face="engraved" size={5} as="h1" italic>
        The bench, in italics
      </Text>
      <Text face="engraved" size={4} as="h2">
        Engraved carries names
      </Text>
      <Text face="engraved" size={3} as="h3">
        Section titles stay Engraved
      </Text>
      <Text size={2}>Lede in Working sans, one step up from body.</Text>
      <Text size={1} measure>
        Body copy is Working sans at 16px with 1.6 leading. It stays on the quiet ground and never
        sits on enamel or metal. The measure caps at 68 characters so a paragraph never runs across
        the whole bench.
      </Text>
      <Text size={0} tone="muted">
        Secondary text at 14px.
      </Text>
      <Text size={-1} tone="muted">
        Fine print at 12px, still 4.5:1.
      </Text>
      <Text face="plate" as="span">
        Plate · 11px · outside the scale
      </Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const h1 = canvasElement.querySelector("h1");
    await expect(h1).not.toBeNull();
    await expect(getComputedStyle(h1 as Element).fontStyle).toBe("italic");
  },
};

export const Tones: Story = {
  render: () => (
    <Stack gap={2}>
      <Text tone="ink">Ink is the default.</Text>
      <Text tone="muted">Muted for secondary text.</Text>
      <Text tone="link">Link tone, without being a link.</Text>
      <Text tone="ok">Ok — always beside a word or a shape, never alone.</Text>
      <Text tone="warn">Warn.</Text>
      <Text tone="no">No.</Text>
    </Stack>
  ),
};
