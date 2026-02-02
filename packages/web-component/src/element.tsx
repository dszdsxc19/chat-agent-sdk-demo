import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { ToolWidget, ToolWidgetWithRuntime } from "./ToolWidget";
import styles from "./styles.css?inline";

export class AgentWidgetElement extends HTMLElement {
  private root: Root | null = null;
  private _runtime: any = null;
  private _api: string | undefined;

  constructor() {
    super();
  }

  static get observedAttributes() {
    return ["api"];
  }

  connectedCallback() {
    if (!this.root) {
      this.attachShadow({ mode: "open" });

      const styleTag = document.createElement("style");
      styleTag.textContent = styles;
      this.shadowRoot!.appendChild(styleTag);

      const container = document.createElement("div");
      container.style.height = "100%";
      container.style.width = "100%";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      this.shadowRoot!.appendChild(container);

      this.root = createRoot(container);
      this.render();
    }
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "api" && oldValue !== newValue) {
      this._api = newValue ?? undefined;
      this.render();
    }
  }

  // Allow setting runtime programmatically
  set runtime(value: any) {
    this._runtime = value;
    this.render();
  }

  get runtime() {
    return this._runtime;
  }

  set api(value: string | null) {
    if (value === null || value === undefined) {
      if (this.hasAttribute("api")) {
        this.removeAttribute("api");
      }
    } else if (this.getAttribute("api") !== value) {
      this.setAttribute("api", value);
    }
  }

  get api() {
    return this._api;
  }

  private render() {
    if (this.root) {
      const runtime = this._runtime;
      const api = this._api;
      this.root.render(
        <React.StrictMode>
          {runtime ? (
            <ToolWidget runtime={runtime} />
          ) : (
            <ToolWidgetWithRuntime api={api} />
          )}
        </React.StrictMode>,
      );
    }
  }
}

// Check if already defined to avoid errors in HMR
if (!customElements.get("agent-widget")) {
  customElements.define("agent-widget", AgentWidgetElement);
}
