import { isZodLike } from "./utils";

type InferSchemaInput<TResult> = TResult extends {
  parse: (...args: any[]) => infer Output;
}
  ? Output
  : unknown;

export interface ToolDefinition<TParameters = any> {
  name: string;
  description?: string;
  parameters: TParameters;
  execute: (args: InferSchemaInput<TParameters>) => Promise<any>;
}

export interface MountOptions {
  container?: HTMLElement; // Initial container, defaults to body if not provided
  runtime?: any;
  apiEndpoint?: string;
}

export type WidgetMode = 'fab_modal' | 'sidebar' | 'container';

export interface FabModalOptions {
  mode: 'fab_modal';
  position?: 'bottom-right' | 'bottom-left';
  offset?: { x: number; y: number };
  zIndex?: number;
}

export interface SidebarOptions {
  mode: 'sidebar';
  side?: 'right' | 'left';
  width?: string;
  layout?: 'overlay' | 'push';
  pushTarget?: HTMLElement | string;
  overlayMask?: boolean;
  zIndex?: number;
}

export interface ContainerOptions {
  mode: 'container';
  container: HTMLElement | string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
}

export type OpenOptions = FabModalOptions | SidebarOptions | ContainerOptions;

export class BridgeSDK {
  private static instance: BridgeSDK;
  private tools: Map<string, ToolDefinition> = new Map();
  private listeners: Set<() => void> = new Set();
  private widgetElement: HTMLElement | null = null;

  // State tracking
  private pushCleanup: (() => void) | null = null;

  public static getInstance(): BridgeSDK {
    if (!BridgeSDK.instance) {
      BridgeSDK.instance = new BridgeSDK();
      (window as any).__ToolAgentSDK__ = BridgeSDK.instance;
    }
    return BridgeSDK.instance;
  }

  public registerTool<TParameters>(tool: ToolDefinition<TParameters>) {
    // 1. Loose validation: Just check if it looks like Zod
    if (!isZodLike(tool.parameters)) {
      console.warn(
        `[SDK] Tool ${tool.name} parameters do not look like a Zod schema.`,
      );
    }

    this.tools.set(tool.name, tool);
    this.notify();
  }

  public getTools() {
    return Array.from(this.tools.values());
  }

  public listTools() {
    const tools = Array.from(this.tools.values());
    return {
      count: tools.length,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description || "No description",
        parametersType: tool.parameters?.constructor?.name || "Unknown",
        hasZodSchema: isZodLike(tool.parameters),
        execute: typeof tool.execute === "function",
      })),
    };
  }

  public async executeTool(name: string, args: any) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);

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
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Initializes the widget instance (hidden).
   */
  public mount(options: MountOptions = {}) {
    this.ensureWidgetCreated(options.runtime, options.apiEndpoint);

    if (this.widgetElement && options.apiEndpoint) {
      (this.widgetElement as any).apiEndpoint = options.apiEndpoint;
    }

    // Mount to specified container or body
    const container = options.container || document.body;
    if (!this.widgetElement!.parentNode) {
      container.appendChild(this.widgetElement!);
    } else if (this.widgetElement!.parentNode !== container && options.container) {
      // If already mounted but a specific container was requested, move it
      container.appendChild(this.widgetElement!);
    }
  }

  /**
   * Opens the widget in the specified mode.
   */
  public open(options: OpenOptions) {
    const widget = this.ensureWidgetCreated();

    // 1. Clean up previous state if mode changing or re-opening
    this.revertPushLayout();

    // 2. Resolve container and append
    this.ensureRootForMode(options);

    // 3. Apply SDK-level styles (positioning, z-index)
    this.applySdkStyles(options);

    // 4. Update Widget Props
    (widget as any).displayMode = options;
    (widget as any).open = true;
    widget.style.display = 'block';

    // 5. Handle Push Logic (Side Effect)
    if (options.mode === 'sidebar' && options.layout === 'push') {
       this.applyPushLayout(options.pushTarget, options.width, options.side);
    }
  }

  public close() {
    if (!this.widgetElement) return;

    // Logic to hide the widget but keep instance
    (this.widgetElement as any).open = false;
    this.widgetElement.style.display = 'none';

    this.revertPushLayout();
  }

  public unmount() {
    this.close();
    if (this.widgetElement && this.widgetElement.parentNode) {
      this.widgetElement.parentNode.removeChild(this.widgetElement);
    }
    this.widgetElement = null;
  }

  // --- Internal Helpers ---

  private ensureWidgetCreated(runtime?: any, apiEndpoint?: string): HTMLElement {
    if (this.widgetElement) {
       if (runtime) (this.widgetElement as any).runtime = runtime;
       if (apiEndpoint) (this.widgetElement as any).apiEndpoint = apiEndpoint;
       return this.widgetElement;
    }

    const tagName = "agent-widget";
    if (!customElements.get(tagName)) {
      console.warn(
        `[SDK] Custom element <${tagName}> is not defined. Make sure to import the web component package.`,
      );
    }

    this.widgetElement = document.createElement(tagName);

    // Listen for close event from the component
    this.widgetElement.addEventListener('close', () => {
      this.close();
    });

    if (runtime) {
      (this.widgetElement as any).runtime = runtime;
    }
    if (apiEndpoint) {
      (this.widgetElement as any).apiEndpoint = apiEndpoint;
    }
    // Initially hidden
    this.widgetElement.style.display = 'none';

    return this.widgetElement;
  }

  private ensureRootForMode(options: OpenOptions) {
    if (!this.widgetElement) return;

    let targetContainer: HTMLElement = document.body;

    if (options.mode === 'container') {
      if (typeof options.container === 'string') {
        const el = document.querySelector(options.container);
        if (el) targetContainer = el as HTMLElement;
        else console.warn(`[SDK] Container ${options.container} not found, falling back to body`);
      } else {
        targetContainer = options.container;
      }
    }

    // Reparent if necessary
    if (this.widgetElement.parentNode !== targetContainer) {
      targetContainer.appendChild(this.widgetElement);
    }
  }

  private applySdkStyles(options: OpenOptions) {
    if (!this.widgetElement) return;
    const el = this.widgetElement;

    // Reset basic styles
    el.style.position = '';
    el.style.top = '';
    el.style.bottom = '';
    el.style.left = '';
    el.style.right = '';
    el.style.width = '';
    el.style.height = '';
    el.style.zIndex = '';
    el.style.margin = '';

    if (options.mode === 'fab_modal') {
      el.style.position = 'fixed';
      el.style.zIndex = (options.zIndex ?? 9999).toString();
      // FAB positioning is usually handled by the component's internal fixed button,
      // BUT if the shell expects the host to be the container, we might need to set bounds.
      // However, usually FAB is 0x0 size or overlays the whole screen pointer-events:none?
      // Let's assume the WebComponent Host is the "Wrapper".
      // For FAB, we might want the host to be a small box or cover the screen?
      // Actually, for a Shadow DOM component, if we want the modal to cover the screen,
      // the Host element usually needs to cover the screen or use fixed positioning inside.
      // Constraint: "SDK responsible for positioning".

      // Decision: For FAB, the Host element is a container for the FAB button.
      // We place it bottom-right.

      // If the component renders a Modal that covers the screen, the Host might need to be full screen?
      // Or the ShadowRoot has fixed elements.
      // If ShadowRoot has `position: fixed`, it works relative to viewport usually (unless host has transform).

      // Let's set the Host to be a layer covering the screen ONLY when modal is open?
      // Or keep it simple: Host is fixed bottom right for the button.
      // Wait, if the modal opens, it needs to center screen.
      // So the Host should probably be `position: fixed; inset: 0; pointer-events: none;`
      // And the inner elements enable pointer-events.

      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.pointerEvents = 'none'; // Let clicks pass through
      el.style.zIndex = (options.zIndex ?? 9999).toString();
    }
    else if (options.mode === 'sidebar') {
      // Sidebar now uses the same full-screen container strategy as FAB
      // to allow the component to render its own backdrop/mask.
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.pointerEvents = 'none';
      el.style.zIndex = (options.zIndex ?? 9999).toString();
    }
    else if (options.mode === 'container') {
       el.style.position = 'relative';
       el.style.width = '100%';
       el.style.height = '100%';
       if (options.style) {
         Object.assign(el.style, options.style);
       }
    }
  }

  private applyPushLayout(target: HTMLElement | string | undefined, width: string = '400px', side: 'left' | 'right' = 'right') {
    // 1. Find target
    let el: HTMLElement | null = null;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
      el = target;
    }

    if (!el) {
      console.warn('[SDK] Push target not found, skipping push layout.');
      return;
    }

    // 2. Save original style
    // We use a simple strategy: backup the inline style we are about to touch
    const prop = side === 'left' ? 'marginLeft' : 'marginRight';
    const originalValue = el.style[prop];

    // Store cleanup closure
    this.pushCleanup = () => {
      el!.style[prop] = originalValue;
    };

    // 3. Apply new style
    // We need to calculate current margin + width? Or just set it?
    // Assuming simple push: just add margin.
    // If it's already computed, parsing is hard.
    // Simplified: Set margin to width.
    el.style[prop] = width;

    // Smooth transition could be added here if desired
    el.style.transition = `margin 0.3s ease`;
  }

  private revertPushLayout() {
    if (this.pushCleanup) {
      this.pushCleanup();
      this.pushCleanup = null;
    }
  }
}
