import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ToolWidget } from './ToolWidget';
import styles from './styles.css?inline';

export class AgentWidgetElement extends HTMLElement {
  private root: Root | null = null;
  private _runtime: any = null;
  private _displayMode: any = null;
  private _open: boolean = false;

  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.root) {
      this.attachShadow({ mode: 'open' });

      const styleTag = document.createElement('style');
      styleTag.textContent = styles;
      this.shadowRoot!.appendChild(styleTag);

      const container = document.createElement('div');
      container.style.height = '100%';
      container.style.width = '100%';
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

  // Allow setting runtime programmatically
  set runtime(value: any) {
    this._runtime = value;
    this.render();
  }

  get runtime() {
    return this._runtime;
  }

  set displayMode(value: any) {
    this._displayMode = value;
    this.render();
  }

  get displayMode() {
    return this._displayMode;
  }

  set open(value: boolean) {
    this._open = value;
    this.render();
  }

  get open() {
    return this._open;
  }

  private handleClose = () => {
    // Dispatch a custom event so the SDK or host can listen to it
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private render() {
    if (this.root) {
      this.root.render(
        <React.StrictMode>
          <ToolWidget
            runtime={this._runtime}
            displayMode={this._displayMode}
            onClose={this.handleClose}
          />
        </React.StrictMode>
      );
    }
  }
}

// Check if already defined to avoid errors in HMR
if (!customElements.get('agent-widget')) {
  customElements.define('agent-widget', AgentWidgetElement);
}
