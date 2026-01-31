<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { BridgeSDK, type OpenOptions } from "my-agent-sdk";
import "agent-widget"; // Side effects
import { z } from "zod";
import BaseButton from './components/BaseButton.vue';

// Types
type WidgetMode = 'closed' | 'fab_bottom_right' | 'fab_bottom_left' | 'sidebar_right' | 'sidebar_left' | 'sidebar_push' | 'container';

// State
const sdk = BridgeSDK.getInstance();
const embedContainerRef = ref<HTMLDivElement | null>(null);
const activeTool = ref<string | null>(null);
const executionResult = ref<{
  tool: string;
  result: unknown;
  error?: string;
} | null>(null);
const widgetMode = ref<WidgetMode>('container');
const isMounted = ref(true);
const toolsInfo = ref(sdk.listTools());

// Register tools
// We can do this outside or inside setup. React did it outside.
// To ensure it happens only once, outside is fine, or check if already registered.
// Since SDK is singleton, outside is fine.

if (sdk.listTools().count === 0) {
  sdk.registerTool({
    name: "calculateSum",
    description: "Calculates the sum of two numbers",
    parameters: z.object({
      a: z.number(),
      b: z.number(),
    }),
    execute: async ({ a, b }: { a: number, b: number }) => {
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
    execute: async ({ input }: { input: string }) => {
      console.log("Host: reverseString executed with", { input });
      return { reversed: input.split("").reverse().join("") };
    },
  });
}
// Update tools info
toolsInfo.value = sdk.listTools();

// Logic
const API_ENDPOINT = "http://localhost:4111/agent/weatherAgent";

const mountWidget = () => {
  if (!isMounted.value) return;
  sdk.mount({
    apiEndpoint: API_ENDPOINT
  });
  updateWidgetMode();
};

const updateWidgetMode = () => {
  const options = getOpenOptions(widgetMode.value, embedContainerRef.value);
  if (options) {
    sdk.open(options);
  } else {
    sdk.close();
  }
};

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

const handleUnmount = () => {
  console.log('Unmounting widget...');
  sdk.unmount();
  isMounted.value = false;

  // Remount after 1 second
  setTimeout(() => {
    console.log('Remounting widget...');
    isMounted.value = true;
    mountWidget();
  }, 1000);
};

// Watchers and Hooks
onMounted(() => {
  mountWidget();
});

watch(widgetMode, () => {
  updateWidgetMode();
});

onUnmounted(() => {
  sdk.unmount();
});

</script>

<template>
  <div style="height: 100vh; display: flex; overflow: hidden">
    <!-- Left Panel - Playground Controls -->
    <div
      style="
        width: 320px;
        background-color: #f5f5f5;
        border-right: 1px solid #ddd;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      "
    >
      <div style="padding: 20px; border-bottom: 1px solid #ddd">
        <h1 style="margin: 0 0 10px 0; font-size: 18px">
          🎮 Widget Controls
        </h1>
        <p style="margin: 0; color: #666; font-size: 12px">
          {{ toolsInfo.count }} tools registered
        </p>
      </div>

      <div style="flex: 1; overflow: auto; padding: 20px">
        <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 12px">
          📍 Display Mode
        </h3>

        <!-- FAB Modal -->
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 8px; font-size: 12px; color: #666; font-weight: bold">
            FAB Modal
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <BaseButton
              :active="widgetMode === 'fab_bottom_right'"
              @click="widgetMode = 'fab_bottom_right'"
            >
              Bottom Right
            </BaseButton>
            <BaseButton
              :active="widgetMode === 'fab_bottom_left'"
              @click="widgetMode = 'fab_bottom_left'"
            >
              Bottom Left
            </BaseButton>
          </div>
        </div>

        <!-- Sidebar -->
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 8px; font-size: 12px; color: #666; font-weight: bold">
            Sidebar (Overlay)
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
             <BaseButton
              :active="widgetMode === 'sidebar_right'"
              @click="widgetMode = 'sidebar_right'"
            >
              Right
            </BaseButton>
             <BaseButton
              :active="widgetMode === 'sidebar_left'"
              @click="widgetMode = 'sidebar_left'"
            >
              Left
            </BaseButton>
          </div>
        </div>

        <!-- Sidebar Push -->
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 8px; font-size: 12px; color: #666; font-weight: bold">
            Sidebar (Push Body)
          </p>
           <BaseButton
              :active="widgetMode === 'sidebar_push'"
              @click="widgetMode = 'sidebar_push'"
            >
            Right Push
          </BaseButton>
        </div>

        <!-- Container -->
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 8px; font-size: 12px; color: #666; font-weight: bold">
            Container (Embedded)
          </p>
          <BaseButton
              :active="widgetMode === 'container'"
              @click="widgetMode = 'container'"
            >
            Embed in Panel
          </BaseButton>
        </div>

        <!-- Close -->
        <div style="margin-bottom: 16px">
          <BaseButton
              :active="widgetMode === 'closed'"
              @click="widgetMode = 'closed'"
              variant="danger"
            >
            Close Widget
          </BaseButton>
        </div>

        <!-- Unmount -->
        <div style="margin-bottom: 24px">
           <BaseButton
              :active="!isMounted"
              @click="handleUnmount"
              variant="danger"
            >
            {{ !isMounted ? 'Unmounting...' : 'Unmount & Remount' }}
          </BaseButton>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0" />

        <h3 style="margin-top: 0; font-size: 14px; margin-bottom: 12px">
          📋 Tool List
        </h3>

        <div
          v-for="(tool, index) in toolsInfo.tools"
          :key="tool.name"
          style="
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 6px;
            "
          >
            <span
              style="
                background-color: #007bff;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
              "
            >
              {{ index + 1 }}
            </span>
            <strong style="font-size: 13px">{{ tool.name }}</strong>
          </div>
          <p
            style="
              margin: 0 0 8px 0;
              font-size: 12px;
              color: #666;
            "
          >
            {{ tool.description }}
          </p>

          <button
            @click="() => {
              let mockArgs;
              if (tool.name === 'calculateSum') {
                mockArgs = { a: 10, b: 20 };
              } else if (tool.name === 'reverseString') {
                mockArgs = { input: 'Hello World' };
              } else {
                mockArgs = {};
              }
              executeTool(tool.name, mockArgs);
            }"
            :disabled="activeTool === tool.name"
            :style="{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: activeTool === tool.name ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: activeTool === tool.name ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '500',
            }"
          >
            {{ activeTool === tool.name ? "Executing..." : "🚀 Execute" }}
          </button>
        </div>

        <!-- Execution Result -->
        <div
          v-if="executionResult"
          :style="{
            backgroundColor: executionResult.error ? '#fff3f3' : '#f0fff4',
            border: `1px solid ${executionResult.error ? '#ffcdd2' : '#c3e6cb'}`,
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
          }"
        >
          <h4 style="margin: 0 0 8px 0; font-size: 13px">
            {{ executionResult.error ? "❌ Execution Failed" : "✅ Execution Result" }}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px">
            <strong>Tool:</strong> {{ executionResult.tool }}
          </p>
          <p
            v-if="executionResult.error"
            style="
              margin: 4px 0 0 0;
              font-size: 12px;
              color: #d32f2f;
            "
          >
            <strong>Error:</strong> {{ executionResult.error }}
          </p>
          <pre
            v-else
            style="
              margin: 4px 0 0 0;
              font-size: 11px;
              background-color: rgba(0,0,0,0.05);
              padding: 6px;
              border-radius: 4px;
              overflow: auto;
            "
          >{{ JSON.stringify(executionResult.result, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Center Panel - Chat UI -->
    <div style="flex: 1; display: flex; flex-direction: column; min-width: 0">
      <div
        style="
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          background-color: #fff;
        "
      >
        <h2 style="margin: 0; font-size: 16px">💬 Chat UI (Container Mode)</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666">
          Widget appears here when "Embed in Panel" is selected
        </p>
      </div>
      <div
        ref="embedContainerRef"
        id="chat-container"
        style="
          flex: 1;
          position: relative;
          background-color: #fafafa;
          min-height: 0;
        "
      />
    </div>

    <!-- Right Panel - Status -->
    <div
      style="
        width: 280px;
        background-color: #f9f9f9;
        border-left: 1px solid #ddd;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      "
    >
      <div style="padding: 20px; border-bottom: 1px solid #ddd">
        <h2 style="margin: 0; font-size: 16px">📊 Status</h2>
      </div>
      <div style="flex: 1; overflow: auto; padding: 20px; font-size: 13px">
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 4px; font-weight: bold; font-size: 12px">Current Mode:</p>
          <p style="margin: 0; color: #007bff; font-family: monospace">
            {{ widgetMode }}
          </p>
        </div>
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 4px; font-weight: bold; font-size: 12px">Runtime:</p>
          <p style="margin: 0; color: #28a745">
            {{ isMounted ? "✅ Connected" : "⏳ Loading..." }}
          </p>
        </div>
        <div style="margin-bottom: 16px">
          <p style="margin: 0 0 4px; font-weight: bold; font-size: 12px">Tools:</p>
          <p style="margin: 0">{{ toolsInfo.count }} registered</p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0" />

        <div>
          <p style="margin: 0 0 8px; font-weight: bold; font-size: 12px">Instructions:</p>
          <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6">
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
</template>

<style scoped>
/* Scoped styles if needed, but we used inline styles */
</style>
