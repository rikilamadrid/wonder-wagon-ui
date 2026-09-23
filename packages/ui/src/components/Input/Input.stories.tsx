import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./Input.js";

const meta = {
  title: "Controls/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { ww: { tier: "quiet" } },
  args: { "aria-label": "Search the bench", placeholder: "Search…" },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Search the bench" });
    await userEvent.type(input, "gauge");
    await expect(input).toHaveValue("gauge");
  },
};
export const Invalid: Story = { args: { invalid: true, defaultValue: "not a url" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "read only" } };
