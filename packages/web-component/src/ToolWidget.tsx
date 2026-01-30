/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import {
  BridgeSDK,
  type ToolDefinition,
  type OpenOptions,
} from "my-agent-sdk";
import {
  makeAssistantTool,
  AssistantRuntimeProvider,
  type AssistantRuntime,
} from "@assistant-ui/react";
import { Thread } from "@assistant-ui/react-ui";
import {
  FabModalShell,
  SidebarShell,
  EmbeddedShell,
} from "./components/Shells";

interface ToolWidgetProps {
  runtime: AssistantRuntime;
  displayMode?: OpenOptions | null;
  onClose?: () => void;
}

export const ToolWidget = ({
  runtime,
  displayMode,
  onClose = () => {},
}: ToolWidgetProps) => {
  const sdk = BridgeSDK.getInstance();
  const [tools, setTools] = useState<ToolDefinition[]>(sdk.getTools());

  useEffect(() => {
    const unsubscribe = sdk.subscribe(() => setTools(sdk.getTools()));
    return () => {
      unsubscribe();
    };
  }, [sdk]);

  const ToolComponents = useMemo(() => {
    return tools.map((tool) => {
      const ToolComponent = makeAssistantTool({
        toolName: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        execute: async (args: unknown) => {
          return await sdk.executeTool(tool.name, args);
        },
      });
      return <ToolComponent key={tool.name} />;
    });
  }, [tools]);

  if (!runtime) {
    return <div style={{ padding: 20 }}>Waiting for runtime...</div>;
  }

  const content = (
    <AssistantRuntimeProvider runtime={runtime}>
      {ToolComponents}
      <Thread />
    </AssistantRuntimeProvider>
  );

  const resolvedDisplayMode: OpenOptions =
    displayMode ?? ({ mode: "container", container: "body" } as OpenOptions);

  if (resolvedDisplayMode.mode === "fab_modal") {
    return (
      <FabModalShell displayMode={resolvedDisplayMode} onClose={onClose}>
        {content}
      </FabModalShell>
    );
  }

  if (resolvedDisplayMode.mode === "sidebar") {
    return (
      <SidebarShell displayMode={resolvedDisplayMode} onClose={onClose}>
        {content}
      </SidebarShell>
    );
  }

  return (
    <EmbeddedShell displayMode={resolvedDisplayMode} onClose={onClose}>
      {content}
    </EmbeddedShell>
  );
};
