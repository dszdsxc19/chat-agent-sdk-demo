import { isZodLike } from './utils';

export interface ToolDefinition<T = any> {
  name: string;
  description?: string;
  parameters: any; // We use any because we support multiple Zod versions via duck typing
  execute: (args: T) => Promise<any>;
}

export interface MountOptions {
  container?: HTMLElement;
  runtime?: any; // For passing the runtime instance for testing or advanced scenarios
}

export class BridgeSDK {
  private static instance: BridgeSDK;
  private tools: Map<string, ToolDefinition> = new Map();
  private listeners: Set<() => void> = new Set();
  private widgetElement: HTMLElement | null = null;

  public static getInstance(): BridgeSDK {
    if (!BridgeSDK.instance) {
      BridgeSDK.instance = new BridgeSDK();
      (window as any).__ToolAgentSDK__ = BridgeSDK.instance;
    }
    return BridgeSDK.instance;
  }

  public registerTool<T>(tool: ToolDefinition<T>) {
    // 1. Loose validation: Just check if it looks like Zod
    if (!isZodLike(tool.parameters)) {
      console.warn(`[SDK] Tool ${tool.name} parameters do not look like a Zod schema.`);
    }

    this.tools.set(tool.name, tool);
    this.notify();
  }

  public getTools() {
    return Array.from(this.tools.values());
  }

  public async executeTool(name: string, args: any) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);

    // 2. Runtime call: Use the passed object's method
    let safeArgs = args;
    if (isZodLike(tool.parameters)) {
      safeArgs = tool.parameters.parse(args);
    }

    return await tool.execute(safeArgs);
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Mounts the Agent Widget to the DOM.
   * Assumes the <agent-widget> custom element is registered.
   */
  public mount(options: MountOptions = {}) {
    if (this.widgetElement) {
      console.warn('[SDK] Widget is already mounted.');
      return;
    }

    const tagName = 'agent-widget';
    if (!customElements.get(tagName)) {
      console.warn(`[SDK] Custom element <${tagName}> is not defined. Make sure to import the web component package.`);
    }

    this.widgetElement = document.createElement(tagName);

    if (options.runtime) {
      (this.widgetElement as any).runtime = options.runtime;
    }

    const container = options.container || document.body;
    container.appendChild(this.widgetElement);
  }

  /**
   * Unmounts the Agent Widget from the DOM.
   */
  public unmount() {
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
    }
    this.widgetElement = null;
  }
}
