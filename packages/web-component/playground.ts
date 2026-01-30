import { BridgeSDK } from '../sdk/src/index';
// Import web component registration
import './src/index';

console.log('Initializing Playground...');

const sdk = BridgeSDK.getInstance();

// Mount with null runtime to see the "Waiting for runtime..." message inside the shells.
// This confirms the shell is rendering correctly around the content.
sdk.mount({ runtime: null });

// Register dummy tool to verify tool registration works (even if runtime is missing)
sdk.registerTool({
  name: 'hello_world',
  description: 'Says hello',
  parameters: { }, // Mock duck typing
  execute: async () => 'Hello World!'
});

// Bind buttons
document.getElementById('btn-fab-br')?.addEventListener('click', () => {
    console.log('Opening FAB Bottom Right');
    sdk.open({ mode: 'fab_modal', position: 'bottom-right' });
});

document.getElementById('btn-fab-bl')?.addEventListener('click', () => {
    console.log('Opening FAB Bottom Left');
    sdk.open({ mode: 'fab_modal', position: 'bottom-left' });
});

document.getElementById('btn-sidebar-right')?.addEventListener('click', () => {
    console.log('Opening Sidebar Right Overlay');
    sdk.open({ mode: 'sidebar', side: 'right', layout: 'overlay' });
});

document.getElementById('btn-sidebar-left')?.addEventListener('click', () => {
    console.log('Opening Sidebar Left Overlay');
    sdk.open({ mode: 'sidebar', side: 'left', layout: 'overlay' });
});

document.getElementById('btn-sidebar-push')?.addEventListener('click', () => {
    console.log('Opening Sidebar Right Push');
    sdk.open({
        mode: 'sidebar',
        side: 'right',
        layout: 'push',
        pushTarget: 'body'
    });
});

document.getElementById('btn-container')?.addEventListener('click', () => {
    console.log('Opening Container');
    const container = document.getElementById('embed-target');
    if (container) container.innerHTML = '';
    sdk.open({ mode: 'container', container: '#embed-target' });
});

document.getElementById('btn-close')?.addEventListener('click', () => {
    console.log('Closing');
    sdk.close();
});

document.getElementById('btn-unmount')?.addEventListener('click', () => {
    console.log('Unmounting');
    sdk.unmount();

    // Remount after 1s to allow testing cycle
    setTimeout(() => {
        console.log('Remounting...');
        sdk.mount({ runtime: null });
    }, 1000);
});
