import { useEffect, useRef, useState } from "react";
import { BridgeSDK } from "my-agent-sdk";
import "agent-widget"; // Import for side effects (custom element registration)
import { z } from "zod";
// import '@assistant-ui/react/styles/index.css';

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

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    tool: string;
    result: unknown;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Mount widget using the SDK
      sdk.mount({
        container: containerRef.current,
        api: "http://localhost:4111/agent/weatherAgent",
      });

      console.log("=== Tools + Runtime Combined ===");
      console.log(
        JSON.stringify(
          {
            runtime: {
              type: "web-component",
              hasRuntime: true,
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
  }, []);

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

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* Left Panel - Playground */}
      <div
        style={{
          width: "50%",
          backgroundColor: "#f5f5f5",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>
            🎮 Playground
          </h1>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            {toolsInfo.count} tools registered
          </p>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          <h3 style={{ marginTop: 0, fontSize: "16px" }}>📋 Tool List</h3>

          {toolsInfo.tools.map((tool, index) => (
            <div
              key={tool.name}
              style={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </span>
                <strong style={{ fontSize: "14px" }}>{tool.name}</strong>
              </div>
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                {tool.description}
              </p>

              {/* Mock Execute Button */}
              <button
                onClick={() => {
                  // Generate mock args based on tool name
                  let mockArgs: unknown;
                  if (tool.name === "calculateSum") {
                    mockArgs = { a: 10, b: 20 };
                  } else {
                    mockArgs = {};
                  }
                  executeTool(tool.name, mockArgs);
                }}
                disabled={activeTool === tool.name}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor:
                    activeTool === tool.name ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: activeTool === tool.name ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                {activeTool === tool.name ? "Executing..." : "🚀 Mock Execute"}
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
                padding: "15px",
                marginTop: "20px",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
                {executionResult.error
                  ? "❌ Execution Failed"
                  : "✅ Execution Result"}
              </h4>
              <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                <strong>Tool:</strong> {executionResult.tool}
              </p>
              {executionResult.error ? (
                <p
                  style={{
                    margin: "5px 0 0 0",
                    fontSize: "13px",
                    color: "#d32f2f",
                  }}
                >
                  <strong>Error:</strong> {executionResult.error}
                </p>
              ) : (
                <pre
                  style={{
                    margin: "5px 0 0 0",
                    fontSize: "12px",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    padding: "8px",
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

      {/* Right Panel - Chat UI */}
      <div style={{ width: "50%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #ddd",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px" }}>💬 Chat UI</h2>
        </div>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#fafafa",
            minHeight: 0,
          }}
        />
      </div>
    </div>
  );
}
