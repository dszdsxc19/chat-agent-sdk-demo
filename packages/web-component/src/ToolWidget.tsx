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
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Thread } from "@assistant-ui/react-ui";
import {
  FabModalShell,
  SidebarShell,
  EmbeddedShell,
} from "./components/Shells";

interface ToolWidgetProps {
  runtime?: AssistantRuntime;
  apiEndpoint?: string | null;
  displayMode?: OpenOptions | null;
  onClose?: () => void;
}

export const ToolWidget = (props: ToolWidgetProps) => {
  if (props.runtime) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return <ToolWidgetContent runtime={props.runtime!} {...props} />;
  }
  if (props.apiEndpoint) {
    return (
      <ToolWidgetWithRuntimeCreation
        apiEndpoint={props.apiEndpoint}
        {...props}
      />
    );
  }
  return (
    <div style={{ padding: 20 }}>Waiting for runtime or API endpoint...</div>
  );
};

const ToolWidgetWithRuntimeCreation = ({
  apiEndpoint,
  ...props
}: ToolWidgetProps & { apiEndpoint: string }) => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: apiEndpoint,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return <ToolWidgetContent runtime={runtime} {...props} />;
};

interface ToolWidgetContentProps extends ToolWidgetProps {
  runtime: AssistantRuntime;
}

const ToolWidgetContent = ({
  runtime,
  apiEndpoint,
  displayMode,
  onClose = () => {},
}: ToolWidgetProps) => {
  if (runtime) {
    return (
      <InnerToolWidget
        runtime={runtime}
        displayMode={displayMode}
        onClose={onClose}
      />
    );
  }

  if (apiEndpoint) {
    return (
      <AutomaticRuntimeWidget
        apiEndpoint={apiEndpoint}
        displayMode={displayMode}
        onClose={onClose}
      />
    );
  }

  return <div style={{ padding: 20 }}>Waiting for runtime...</div>;
};

const AutomaticRuntimeWidget = ({
  apiEndpoint,
  displayMode,
  onClose,
}: {
  apiEndpoint: string;
  displayMode?: OpenOptions | null;
  onClose: () => void;
}) => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: apiEndpoint,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return (
    <InnerToolWidget
      runtime={runtime}
      displayMode={displayMode}
      onClose={onClose}
    />
  );
};

interface InnerToolWidgetProps {
  runtime: AssistantRuntime;
  displayMode?: OpenOptions | null;
  onClose: () => void;
}

const InnerToolWidget = ({
  runtime,
  displayMode,
  onClose,
}: InnerToolWidgetProps) => {
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
