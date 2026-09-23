import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Stack } from "../Stack/Stack.js";
import { Surface } from "../Surface/Surface.js";
import { Text } from "../Text/Text.js";
import { Button } from "./Button.js";

const meta = {
  title: "Controls/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { ww: { tier: "physics" } },
  args: { children: "Save changes", onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Quiet: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: "Save changes" });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
export const Ghost: Story = { args: { variant: "ghost", children: "Cancel" } };
export const Signature: Story = {
  args: { variant: "signature", children: "Inspect case" },
  render: (args) => (
    <Surface variant="stage" grid padding={6}>
      <Button {...args} />
    </Surface>
  ),
};
export const Pressed: Story = {
  args: { variant: "signature", children: "Inspect case", pressed: true },
};
export const Loading: Story = {
  args: {
    variant: "signature",
    loading: true,
    loadingLabel: "Surveying…",
    children: "Inspect case",
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeDisabled();
    await expect(button).toHaveTextContent("Surveying…");
  },
};
export const Disabled: Story = { args: { disabled: true } };

export const Keyboard: Story = {
  name: "Keyboard — focus ring and activation",
  args: { children: "Focus me with Tab" },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const OneSignaturePerScreen: Story = {
  name: "Pattern — one signature action per screen",
  render: () => (
    <Surface variant="quiet" padding={5}>
      <Stack gap={4}>
        <Text face="engraved" size={3} as="h3">
          Save this route?
        </Text>
        <Text size={0} tone="muted" measure>
          Quiet buttons for everything ordinary. Exactly one raised enamel action, on the thing this
          screen exists to do.
        </Text>
        <Stack direction="row" gap={3} wrap>
          <Button variant="signature">Record route</Button>
          <Button>Keep editing</Button>
          <Button variant="ghost">Discard</Button>
        </Stack>
      </Stack>
    </Surface>
  ),
};
