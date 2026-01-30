import { useEffect, useState, useMemo } from 'react';
import { BridgeSDK, type ToolDefinition, type OpenOptions } from 'my-agent-sdk';
import { makeAssistantTool, AssistantRuntimeProvider } from '@assistant-ui/react';
import { Thread } from '@assistant-ui/react-ui';
import { FabModalShell, SidebarShell, EmbeddedShell } from './components/Shells';

interface ToolWidgetProps {
  runtime: any;
  displayMode?: OpenOptions;
  onClose?: () => void;
}

export const ToolWidget = ({ runtime, displayMode, onClose = () => {} }: ToolWidgetProps) => {
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

  const content = runtime ? (
     <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AssistantRuntimeProvider runtime={runtime}>
          {ToolComponents}
          <Thread />
        </AssistantRuntimeProvider>
     </div>
  ) : (
     <div style={{ padding: 20, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
        Waiting for runtime...
     </div>
  );

  // If no displayMode is set yet, render nothing or a loading state?
  // Or just render embedded by default?
  if (!displayMode) return content;

  switch (displayMode.mode) {
    case 'fab_modal':
      return <FabModalShell displayMode={displayMode} onClose={onClose}>{content}</FabModalShell>;
    case 'sidebar':
      return <SidebarShell displayMode={displayMode} onClose={onClose}>{content}</SidebarShell>;
    case 'container':
      return <EmbeddedShell displayMode={displayMode} onClose={onClose}>{content}</EmbeddedShell>;
    default:
      return <EmbeddedShell displayMode={displayMode} onClose={onClose}>{content}</EmbeddedShell>;
  }
};
