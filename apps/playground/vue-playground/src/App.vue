<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { BridgeSDK } from 'my-agent-sdk';
import 'agent-widget'; // Import for side effects (custom element registration)
import { z } from 'zod';
// import '@assistant-ui/react/styles/index.css';

const sdk = BridgeSDK.getInstance();

// Register tool (Stage 1)
sdk.registerTool({
  name: 'calculateSum',
  description: 'Calculates the sum of two numbers',
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }: { a: number; b: number }) => {
    console.log('Host: calculateSum executed with', { a, b });
    return { sum: a + b };
  },
});

sdk.registerTool({
  name: 'reverseString',
  description: 'Reverses a given string',
  parameters: z.object({
    input: z.string(),
  }),
  execute: async ({ input }: { input: string }) => {
    console.log('Host: reverseString executed with', { input });
    return { reversed: input.split('').reverse().join('') };
  },
});

const toolsInfo = sdk.listTools();
console.log('=== SDK Registered Tools ===');
console.log(`Total: ${toolsInfo.count} tools`);
console.table(toolsInfo.tools);
console.log('=============================');

// Reactive state
const containerRef = ref<HTMLDivElement | null>(null);
const activeTool = ref<string | null>(null);
const executionResult = ref<{
  tool: string;
  result: unknown;
  error?: string;
} | null>(null);

onMounted(() => {
  if (containerRef.value) {
    // Mount widget using the SDK
    sdk.mount({
      container: containerRef.value,
      api: 'http://localhost:4111/agent/weatherAgent',
    });

    console.log('=== Tools + Runtime Combined ===');
    console.log(
      JSON.stringify(
        {
          runtime: {
            type: 'web-component',
            hasRuntime: true,
          },
          tools: toolsInfo.tools,
        },
        null,
        2
      )
    );
    console.log('=============================\n');
  }
});

onUnmounted(() => {
  sdk.unmount();
});

const executeTool = async (toolName: string, args: unknown) => {
  activeTool.value = toolName;
  executionResult.value = null;

  try {
    console.log(`Executing ${toolName} with args:`, args);
    const result = await sdk.executeTool(toolName, args);
    console.log(`${toolName} result:`, result);
    executionResult.value = {
      tool: toolName,
      result,
    };
  } catch (error) {
    console.error(`${toolName} error:`, error);
    executionResult.value = {
      tool: toolName,
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    activeTool.value = null;
  }
};

const getMockArgs = (toolName: string): unknown => {
  if (toolName === 'calculateSum') {
    return { a: 10, b: 20 };
  } else if (toolName === 'reverseString') {
    return { input: 'Hello World' };
  }
  return {};
};
</script>

<template>
  <div
    style="
      height: 100vh;
      display: flex;
      overflow: hidden;
    "
  >
    <!-- Left Panel - Playground -->
    <div
      style="
        width: 50%;
        background-color: #f5f5f5;
        border-right: 1px solid #ddd;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      "
    >
      <div style="padding: 20px; border-bottom: 1px solid #ddd">
        <h1 style="margin: 0 0 10px 0; font-size: 20px">
          🎮 Playground
        </h1>
        <p style="margin: 0; color: #666; font-size: 14px">
          {{ toolsInfo.count }} tools registered
        </p>
      </div>

      <div style="flex: 1; overflow: auto; padding: 20px">
        <h3 style="margin-top: 0; font-size: 16px">📋 Tool List</h3>

        <div
          v-for="(tool, index) in toolsInfo.tools"
          :key="tool.name"
          style="
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            "
          >
            <span
              style="
                background-color: #007bff;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
              "
            >
              {{ index + 1 }}
            </span>
            <strong style="font-size: 14px">{{ tool.name }}</strong>
          </div>
          <p
            style="
              margin: 0 0 10px 0;
              font-size: 13px;
              color: #666;
            "
          >
            {{ tool.description }}
          </p>

          <!-- Mock Execute Button -->
          <button
            @click="executeTool(tool.name, getMockArgs(tool.name))"
            :disabled="activeTool === tool.name"
            style="
              width: 100%;
              padding: 8px 12px;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
            "
            :style="{
              backgroundColor: activeTool === tool.name ? '#ccc' : '#28a745',
              cursor: activeTool === tool.name ? 'not-allowed' : 'pointer',
            }"
          >
            {{ activeTool === tool.name ? 'Executing...' : '🚀 Mock Execute' }}
          </button>
        </div>

        <!-- Execution Result -->
        <div
          v-if="executionResult"
          :style="{
            backgroundColor: executionResult.error ? '#fff3f3' : '#f0fff4',
            border: `1px solid ${executionResult.error ? '#ffcdd2' : '#c3e6cb'}`,
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
          }"
        >
          <h4 style="margin: 0 0 10px 0; font-size: 14px">
            {{ executionResult.error
              ? '❌ Execution Failed'
              : '✅ Execution Result' }}
          </h4>
          <p style="margin: 0 0 5px 0; font-size: 13px">
            <strong>Tool:</strong> {{ executionResult.tool }}
          </p>
          <p
            v-if="executionResult.error"
            style="
              margin: 5px 0 0 0;
              font-size: 13px;
              color: #d32f2f;
            "
          >
            <strong>Error:</strong> {{ executionResult.error }}
          </p>
          <pre
            v-else
            style="
              margin: 5px 0 0 0;
              font-size: 12px;
              background-color: rgba(0, 0, 0, 0.05);
              padding: 8px;
              border-radius: 4px;
              overflow: auto;
            "
          >{{ JSON.stringify(executionResult.result, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Right Panel - Chat UI -->
    <div style="width: 50%; display: flex; flex-direction: column">
      <div
        style="
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          background-color: #fff;
        "
      >
        <h2 style="margin: 0; font-size: 18px">💬 Chat UI</h2>
      </div>
      <div
        ref="containerRef"
        style="
          flex: 1;
          position: relative;
          background-color: #fafafa;
          min-height: 0;
        "
      />
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
