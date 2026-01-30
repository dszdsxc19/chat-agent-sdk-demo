import { useEffect, useRef, useState } from "react";
import { BridgeSDK, type OpenOptions } from "my-agent-sdk";
import "agent-widget"; // Import for side effects (custom element registration)
import { z } from "zod";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";

const sdk = BridgeSDK.getInstance();

// Register tool (Stage 1)
sdk.registerTool({
  name: "calculateSum",
  description: "Calculates the sum of two numbers",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }) => {
    console.log("Host: calculateSum executed with", { a, b });
    return { sum: a + b };
  },
});

sdk.registerTool({
  name: "reverseString",
  description: "Reverses a given string",
  parameters: z.object({
    input: z.string(),
  }),
  execute: async ({ input }) => {
    console.log("Host: reverseString executed with", { input });
    return { reversed: input.split("").reverse().join("") };
  },
});

const toolsInfo = sdk.listTools();
console.log("=== SDK Registered Tools ===");
console.log(`Total: ${toolsInfo.count} tools`);
console.table(toolsInfo.tools);
console.log("=============================");

type WidgetMode = 'closed' | 'fab_bottom_right' | 'fab_bottom_left' | 'sidebar_right' | 'sidebar_left' | 'sidebar_push' | 'container';

export default function App() {
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    tool: string;
    result: unknown;
    error?: string;
  } | null>(null);
  const [widgetMode, setWidgetMode] = useState<WidgetMode>('container');
  const [isMounted, setIsMounted] = useState(true);

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "http://localhost:4111/agent/weatherAgent",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  useEffect(() => {
    if (runtime) {
      // Mount widget using the SDK - initially closed
      sdk.mount({ runtime });

      console.log("\n=== Runtime Information ===");
      console.log("Runtime Type:", runtime.constructor.name);
      console.log("Runtime Object:", runtime);
      console.log("=== Tools + Runtime Combined ===");
      console.log(
        JSON.stringify(
          {
            runtime: {
              type: runtime.constructor.name,
              hasRuntime: !!runtime,
            },
            tools: toolsInfo.tools,
          },
          null,
          2,
        ),
      );
      console.log("=============================\n");

      return () => {
        sdk.unmount();
      };
    }
  }, [runtime]);

  // Update widget when mode changes
  useEffect(() => {
    if (!runtime) return;

    const options = getOpenOptions(widgetMode, embedContainerRef.current);
    if (options) {
      sdk.open(options);
    } else {
      sdk.close();
    }
  }, [widgetMode, runtime]);

  const getOpenOptions = (mode: WidgetMode, container: HTMLElement | null): OpenOptions | null => {
    switch (mode) {
      case 'closed':
        return null;
      case 'fab_bottom_right':
        return { mode: 'fab_modal', position: 'bottom-right' };
      case 'fab_bottom_left':
        return { mode: 'fab_modal', position: 'bottom-left' };
      case 'sidebar_right':
        return { mode: 'sidebar', side: 'right', layout: 'overlay' };
      case 'sidebar_left':
        return { mode: 'sidebar', side: 'left', layout: 'overlay' };
      case 'sidebar_push':
        return { mode: 'sidebar', side: 'right', layout: 'push', pushTarget: 'body' };
      case 'container':
        return container ? { mode: 'container', container } : null;
      default:
        return null;
    }
  };

  const executeTool = async (toolName: string, args: unknown) => {
    setActiveTool(toolName);
    setExecutionResult(null);

    try {
      console.log(`Executing ${toolName} with args:`, args);
      const result = await sdk.executeTool(toolName, args);
      console.log(`${toolName} result:`, result);
      setExecutionResult({
        tool: toolName,
        result,
      });
    } catch (error) {
      console.error(`${toolName} error:`, error);
      setExecutionResult({
        tool: toolName,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setActiveTool(null);
    }
  };

  const handleUnmount = () => {
    console.log('Unmounting widget...');
    sdk.unmount();
    setIsMounted(false);

    // Remount after 1 second
    setTimeout(() => {
      console.log('Remounting widget...');
      if (runtime) {
        sdk.mount({ runtime });
        setIsMounted(true);
        // Re-apply current mode
        const options = getOpenOptions(widgetMode, embedContainerRef.current);
        if (options) {
          sdk.open(options);
        }
      }
    }, 1000);
  };

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* Left Panel - Playground Controls */}
      <div
        style={{
          width: "320px",
          backgroundColor: "#f5f5f5",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
            🎮 Widget Controls
          </h1>
          <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
            {toolsInfo.count} tools registered
          </p>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          <h3 style={{ marginTop: 0, fontSize: "14px", marginBottom: "12px" }}>
            📍 Display Mode
          </h3>

          {/* FAB Modal */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
              FAB Modal
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button
                active={widgetMode === 'fab_bottom_right'}
                onClick={() => setWidgetMode('fab_bottom_right')}
              >
                Bottom Right
              </Button>
              <Button
                active={widgetMode === 'fab_bottom_left'}
                onClick={() => setWidgetMode('fab_bottom_left')}
              >
                Bottom Left
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
              Sidebar (Overlay)
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button
                active={widgetMode === 'sidebar_right'}
                onClick={() => setWidgetMode('sidebar_right')}
              >
                Right
              </Button>
              <Button
                active={widgetMode === 'sidebar_left'}
                onClick={() => setWidgetMode('sidebar_left')}
              >
                Left
              </Button>
            </div>
          </div>

          {/* Sidebar Push */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
              Sidebar (Push Body)
            </p>
            <Button
              active={widgetMode === 'sidebar_push'}
              onClick={() => setWidgetMode('sidebar_push')}
            >
              Right Push
            </Button>
          </div>

          {/* Container */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
              Container (Embedded)
            </p>
            <Button
              active={widgetMode === 'container'}
              onClick={() => setWidgetMode('container')}
            >
              Embed in Panel
            </Button>
          </div>

          {/* Close */}
          <div style={{ marginBottom: "16px" }}>
            <Button
              active={widgetMode === 'closed'}
              onClick={() => setWidgetMode('closed')}
              variant="danger"
            >
              Close Widget
            </Button>
          </div>

          {/* Unmount */}
          <div style={{ marginBottom: "24px" }}>
            <Button
              active={!isMounted}
              onClick={handleUnmount}
              variant="danger"
            >
              {!isMounted ? 'Unmounting...' : 'Unmount & Remount'}
            </Button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "20px 0" }} />

          <h3 style={{ marginTop: 0, fontSize: "14px", marginBottom: "12px" }}>
            📋 Tool List
          </h3>

          {toolsInfo.tools.map((tool, index) => (
            <div
              key={tool.name}
              style={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </span>
                <strong style={{ fontSize: "13px" }}>{tool.name}</strong>
              </div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                {tool.description}
              </p>

              <button
                onClick={() => {
                  let mockArgs: unknown;
                  if (tool.name === "calculateSum") {
                    mockArgs = { a: 10, b: 20 };
                  } else if (tool.name === "reverseString") {
                    mockArgs = { input: "Hello World" };
                  } else {
                    mockArgs = {};
                  }
                  executeTool(tool.name, mockArgs);
                }}
                disabled={activeTool === tool.name}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  backgroundColor:
                    activeTool === tool.name ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: activeTool === tool.name ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {activeTool === tool.name ? "Executing..." : "🚀 Execute"}
              </button>
            </div>
          ))}

          {/* Execution Result */}
          {executionResult && (
            <div
              style={{
                backgroundColor: executionResult.error ? "#fff3f3" : "#f0fff4",
                border: `1px solid ${executionResult.error ? "#ffcdd2" : "#c3e6cb"}`,
                borderRadius: "8px",
                padding: "12px",
                marginTop: "16px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
                {executionResult.error
                  ? "❌ Execution Failed"
                  : "✅ Execution Result"}
              </h4>
              <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}>
                <strong>Tool:</strong> {executionResult.tool}
              </p>
              {executionResult.error ? (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "12px",
                    color: "#d32f2f",
                  }}
                >
                  <strong>Error:</strong> {executionResult.error}
                </p>
              ) : (
                <pre
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "11px",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    padding: "6px",
                    borderRadius: "4px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(executionResult.result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel - Chat UI */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #ddd",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px" }}>💬 Chat UI (Container Mode)</h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>
            Widget appears here when "Embed in Panel" is selected
          </p>
        </div>
        <div
          ref={embedContainerRef}
          id="chat-container"
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#fafafa",
            minHeight: 0,
          }}
        />
      </div>

      {/* Right Panel - Status */}
      <div
        style={{
          width: "280px",
          backgroundColor: "#f9f9f9",
          borderLeft: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
          <h2 style={{ margin: 0, fontSize: "16px" }}>📊 Status</h2>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "20px", fontSize: "13px" }}>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "12px" }}>Current Mode:</p>
            <p style={{ margin: 0, color: "#007bff", fontFamily: "monospace" }}>
              {widgetMode}
            </p>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "12px" }}>Runtime:</p>
            <p style={{ margin: 0, color: "#28a745" }}>
              {runtime ? "✅ Connected" : "⏳ Loading..."}
            </p>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "12px" }}>Tools:</p>
            <p style={{ margin: 0 }}>{toolsInfo.count} registered</p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />

          <div>
            <p style={{ margin: "0 0 8px", fontWeight: "bold", fontSize: "12px" }}>Instructions:</p>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#666", lineHeight: "1.6" }}>
              <li>Click a display mode to position the widget</li>
              <li>FAB shows floating button in corner</li>
              <li>Sidebar slides in from side</li>
              <li>Container embeds in center panel</li>
              <li>Execute tools to test functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function Button({ children, active, onClick, variant = 'default' }: ButtonProps) {
  const colors = variant === 'danger'
    ? { bg: active ? '#d32f2f' : '#f44336', hover: '#e53935' }
    : { bg: active ? '#0056b3' : '#007bff', hover: '#0056b3' };

  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        backgroundColor: colors.bg,
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = colors.hover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = colors.bg;
      }}
    >
      {children}
    </button>
  );
}
