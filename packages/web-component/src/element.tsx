import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ToolWidget } from './ToolWidget';

export class AgentWidgetElement extends HTMLElement {
  private root: Root | null = null;
  private _runtime: any = null;

  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.root) {
      this.root = createRoot(this);
      this.render();
    }
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
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

  private render() {
    if (this.root) {
      this.root.render(
        <React.StrictMode>
          <ToolWidget runtime={this._runtime} />
        </React.StrictMode>
      );
    }
  }
}

// Check if already defined to avoid errors in HMR
if (!customElements.get('agent-widget')) {
  customElements.define('agent-widget', AgentWidgetElement);
}
