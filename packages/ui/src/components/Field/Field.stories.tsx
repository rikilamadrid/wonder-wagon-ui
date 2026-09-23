import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "../Button/Button.js";
import { Input } from "../Input/Input.js";
import { Stack } from "../Stack/Stack.js";
import { Field } from "./Field.js";

const meta = {
  title: "Controls/Field",
  component: Field.Root,
  tags: ["autodocs"],
  parameters: { ww: { tier: "quiet" } },
} satisfies Meta<typeof Field.Root>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithHint: Story = {
  render: () => (
    <Field.Root hint>
      <Field.Label>Model</Field.Label>
      <Input placeholder="qwen3:8b" />
      <Field.Hint>The model already pulled on your Ollama server.</Field.Hint>
    </Field.Root>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Model");
    await expect(input).toHaveAccessibleDescription(
      "The model already pulled on your Ollama server.",
    );
  },
};

export const Invalid: Story = {
  render: () => (
    <Field.Root hint error invalid>
      <Field.Label>Ollama host</Field.Label>
      <Input defaultValue="localhost" />
      <Field.Hint>A base URL, including the scheme.</Field.Hint>
      <Field.Error>Add the scheme and port: http://localhost:11434</Field.Error>
    </Field.Root>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("Ollama host");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(/scheme.*http:\/\/localhost:11434/s);
  },
};

export const Required: Story = {
  render: () => (
    <Field.Root required>
      <Field.Label>Prompt</Field.Label>
      <Input />
    </Field.Root>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText(/Prompt/);
    await expect(input).toBeRequired();
  },
};

export const Disabled: Story = {
  render: () => (
    <Field.Root disabled hint>
      <Field.Label>Timeout</Field.Label>
      <Input defaultValue="30000" />
      <Field.Hint>Milliseconds. Set by the environment.</Field.Hint>
    </Field.Root>
  ),
};

export const InAForm: Story = {
  name: "Pattern — a quiet form",
  render: () => (
    <form onSubmit={(e) => e.preventDefault()}>
      <Stack gap={5}>
        <Field.Root hint>
          <Field.Label>Ollama host</Field.Label>
          <Input placeholder="http://localhost:11434" />
          <Field.Hint>Reachable over HTTP from this machine.</Field.Hint>
        </Field.Root>
        <Field.Root required>
          <Field.Label>Model</Field.Label>
          <Input placeholder="qwen3:8b" />
        </Field.Root>
        <Stack direction="row" gap={3}>
          <Button variant="signature" type="submit">
            Connect
          </Button>
          <Button type="reset">Clear</Button>
        </Stack>
      </Stack>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByLabelText("Ollama host");
    await userEvent.type(host, "http://127.0.0.1:11434");
    await expect(host).toHaveValue("http://127.0.0.1:11434");
    await userEvent.tab();
    await expect(within(canvasElement).getByLabelText(/Model/)).toHaveFocus();
  },
};
