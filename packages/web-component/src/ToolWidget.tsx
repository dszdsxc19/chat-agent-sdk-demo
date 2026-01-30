import { useEffect, useState, useMemo } from 'react';
import { BridgeSDK, type ToolDefinition } from 'my-agent-sdk';
import { makeAssistantTool, AssistantRuntimeProvider } from '@assistant-ui/react';
import { Thread } from '@assistant-ui/react-ui';

export const ToolWidget = ({ runtime }: { runtime: any }) => {
  const sdk = BridgeSDK.getInstance();
  const [tools, setTools] = useState<ToolDefinition[]>(sdk.getTools());

  useEffect(() => {
    const unsubscribe = sdk.subscribe(() => setTools(sdk.getTools()));
    return () => { unsubscribe(); };
  }, []);

  const ToolComponents = useMemo(() => {
    return tools.map(tool => {
      const ToolComponent = makeAssistantTool({
        toolName: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        execute: async (args: any) => {
          return await sdk.executeTool(tool.name, args);
        }
      });
      return <ToolComponent key={tool.name} />;
    });
  }, [tools]);

  if (!runtime) return <div style={{ padding: 20 }}>Waiting for runtime...</div>;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
       {ToolComponents}
       <Thread />
    </AssistantRuntimeProvider>
  );
};
