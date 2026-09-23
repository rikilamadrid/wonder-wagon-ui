import { Button, Field, Input, Stack, Surface, Switch, Text } from "@wonder-wagon/ui";
import { useState } from "react";

/** Ten lines of the library, doing a real job: the six Phase A components on one quiet card. */
export function FirstScreen() {
  const [orchestrator, setOrchestrator] = useState(false);
  const [host, setHost] = useState("");
  const invalid = host.length > 0 && !/^https?:\/\//.test(host);
  return (
    <Surface variant="quiet" padding={5}>
      <Stack gap={5}>
        <Stack gap={1}>
          <Text face="tag" as="span">
            Connect a runtime
          </Text>
          <Text face="engraved" size={3} as="h3">
            Where does Forge run?
          </Text>
        </Stack>
        <Field.Root hint error invalid={invalid}>
          <Field.Label>Ollama host</Field.Label>
          <Input
            placeholder="http://localhost:11434"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <Field.Hint>Reachable over HTTP from this machine.</Field.Hint>
          <Field.Error>Add the scheme: http://localhost:11434</Field.Error>
        </Field.Root>
        <Stack direction="row" justify="between" gap={3} wrap>
          <Text size={0}>Orchestrator mode</Text>
          <Switch
            checked={orchestrator}
            onCheckedChange={setOrchestrator}
            aria-label="Orchestrator mode"
            labels={{ off: "Human", on: "Orchestrator" }}
          />
        </Stack>
        <Stack direction="row" gap={3} wrap>
          <Button variant="signature" disabled={invalid || host.length === 0}>
            Connect
          </Button>
          <Button variant="ghost" onClick={() => setHost("")}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
