<script lang="ts">
	import { onMount } from 'svelte';
	import { BridgeSDK, type OpenOptions } from 'my-agent-sdk';
	import 'agent-widget';
	import { registerTools } from '$lib/tools';

	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import StatusPanel from '$lib/components/StatusPanel.svelte';

	const sdk = BridgeSDK.getInstance();
	registerTools();

	// Types
	type WidgetMode =
		| 'closed'
		| 'fab_bottom_right'
		| 'fab_bottom_left'
		| 'sidebar_right'
		| 'sidebar_left'
		| 'sidebar_push'
		| 'container';

	let widgetMode = $state<WidgetMode>('container');
	let activeTool = $state<string | null>(null);
	let executionResult = $state<{ tool: string; result: unknown; error?: string } | null>(null);
	let isMounted = $state(true);

	// In Svelte with apiEndpoint, we consider it connected if mounted
	let runtimeConnected = $derived(isMounted);

	let embedContainerRef: HTMLDivElement | undefined = $state();

	let toolsInfo = $state(sdk.listTools());

	onMount(() => {
		const unsubscribe = sdk.subscribe(() => {
			toolsInfo = sdk.listTools();
		});

		mountWidget();

		return () => {
			unsubscribe();
			sdk.unmount();
		};
	});

	function mountWidget() {
		const apiEndpoint = 'http://localhost:4111/agent/weatherAgent';
		console.log('Mounting widget with apiEndpoint:', apiEndpoint);
		sdk.mount({ apiEndpoint });

		// Force update after mount
		updateWidgetMode();
	}

	function handleUnmount() {
		console.log('Unmounting widget...');
		sdk.unmount();
		isMounted = false;

		setTimeout(() => {
			console.log('Remounting widget...');
			mountWidget();
			isMounted = true;
		}, 1000);
	}

	function updateWidgetMode() {
		if (!isMounted) return;

		const options = getOpenOptions(widgetMode, embedContainerRef);
		if (options) {
			sdk.open(options);
		} else {
			sdk.close();
		}
	}

	// Watch for changes and update widget
	$effect(() => {
		// Access dependencies to register them
		const mode = widgetMode;
		const container = embedContainerRef;
		const mounted = isMounted;

		if (mounted) {
			updateWidgetMode();
		}
	});

	function getOpenOptions(
		mode: string,
		container: HTMLDivElement | undefined
	): OpenOptions | null {
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
	}

	async function executeTool(toolName: string, args: unknown) {
		activeTool = toolName;
		executionResult = null;

		try {
			console.log(`Executing ${toolName} with args:`, args);
			const result = await sdk.executeTool(toolName, args);
			console.log(`${toolName} result:`, result);
			executionResult = { tool: toolName, result };
		} catch (error) {
			console.error(`${toolName} error:`, error);
			executionResult = {
				tool: toolName,
				result: null,
				error: error instanceof Error ? error.message : String(error)
			};
		} finally {
			activeTool = null;
		}
	}
</script>

<div class="flex h-screen overflow-hidden">
	<ControlPanel
		bind:widgetMode
		{toolsInfo}
		{activeTool}
		{executeTool}
		{executionResult}
		{isMounted}
		{handleUnmount}
	/>

	<ChatPanel bind:embedContainerRef />

	<StatusPanel {widgetMode} runtime={runtimeConnected} {toolsInfo} />
</div>
