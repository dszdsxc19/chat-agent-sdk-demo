import { useEffect, useState, useMemo } from "react";
import { BridgeSDK, type ToolDefinition } from "my-agent-sdk";
import {
  makeAssistantTool,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { Thread } from "@assistant-ui/react-ui";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";

const DEFAULT_API = "http://localhost:4111/agent/weatherAgent";

export const ToolWidget = ({ runtime }: { runtime: any }) => {
  const sdk = BridgeSDK.getInstance();
  const [tools, setTools] = useState<ToolDefinition[]>(sdk.getTools());

  useEffect(() => {
    const unsubscribe = sdk.subscribe(() => setTools(sdk.getTools()));
    return () => {
      unsubscribe();
    };
  }, []);

  const ToolComponents = useMemo(() => {
    return tools.map((tool) => {
      const ToolComponent = makeAssistantTool({
        toolName: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        execute: async (args: any) => {
          return await sdk.executeTool(tool.name, args);
        },
      });
      return <ToolComponent key={tool.name} />;
    });
  }, [tools]);

  if (!runtime)
    return <div style={{ padding: 20, height: "100%" }}>Waiting for runtime...</div>;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {ToolComponents}
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
};

export const ToolWidgetWithRuntime = ({ api }: { api?: string }) => {
  const transport = useMemo(
    () => new AssistantChatTransport({ api: api ?? DEFAULT_API }),
    [api],
  );

  const runtime = useChatRuntime({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return <ToolWidget runtime={runtime} />;
};
