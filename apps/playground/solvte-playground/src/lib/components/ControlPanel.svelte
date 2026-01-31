<script lang="ts">
	import Button from './Button.svelte';

	let {
		widgetMode = $bindable(),
		toolsInfo,
		activeTool,
		executeTool,
		executionResult,
		isMounted,
		handleUnmount
	} = $props();

	function handleToolClick(toolName: string) {
		let mockArgs: unknown;
		if (toolName === 'calculateSum') {
			mockArgs = { a: 10, b: 20 };
		} else if (toolName === 'reverseString') {
			mockArgs = { input: 'Hello World' };
		} else {
			mockArgs = {};
		}
		executeTool(toolName, mockArgs);
	}
</script>

<div class="flex w-80 flex-col overflow-hidden border-r border-gray-200 bg-gray-100">
	<div class="border-b border-gray-200 p-5">
		<h1 class="m-0 mb-2 text-lg font-bold">🎮 Widget Controls</h1>
		<p class="m-0 text-xs text-gray-500">
			{toolsInfo.count} tools registered
		</p>
	</div>

	<div class="flex-1 overflow-auto p-5">
		<h3 class="mb-3 mt-0 text-sm font-bold">📍 Display Mode</h3>

		<!-- FAB Modal -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-bold text-gray-500">FAB Modal</p>
			<div class="flex flex-wrap gap-2">
				<Button
					active={widgetMode === 'fab_bottom_right'}
					onclick={() => (widgetMode = 'fab_bottom_right')}
				>
					Bottom Right
				</Button>
				<Button
					active={widgetMode === 'fab_bottom_left'}
					onclick={() => (widgetMode = 'fab_bottom_left')}
				>
					Bottom Left
				</Button>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-bold text-gray-500">Sidebar (Overlay)</p>
			<div class="flex flex-wrap gap-2">
				<Button
					active={widgetMode === 'sidebar_right'}
					onclick={() => (widgetMode = 'sidebar_right')}
				>
					Right
				</Button>
				<Button
					active={widgetMode === 'sidebar_left'}
					onclick={() => (widgetMode = 'sidebar_left')}
				>
					Left
				</Button>
			</div>
		</div>

		<!-- Sidebar Push -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-bold text-gray-500">Sidebar (Push Body)</p>
			<Button
				active={widgetMode === 'sidebar_push'}
				onclick={() => (widgetMode = 'sidebar_push')}
			>
				Right Push
			</Button>
		</div>

		<!-- Container -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-bold text-gray-500">Container (Embedded)</p>
			<Button active={widgetMode === 'container'} onclick={() => (widgetMode = 'container')}>
				Embed in Panel
			</Button>
		</div>

		<!-- Close -->
		<div class="mb-4">
			<Button
				active={widgetMode === 'closed'}
				onclick={() => (widgetMode = 'closed')}
				variant="danger"
			>
				Close Widget
			</Button>
		</div>

		<!-- Unmount -->
		<div class="mb-6">
			<Button active={!isMounted} onclick={handleUnmount} variant="danger">
				{!isMounted ? 'Unmounting...' : 'Unmount & Remount'}
			</Button>
		</div>

		<hr class="my-5 border-none border-t border-gray-200" />

		<h3 class="mb-3 mt-0 text-sm font-bold">📋 Tool List</h3>

		{#each toolsInfo.tools as tool, index (tool.name)}
			<div class="mb-2.5 rounded-lg border border-gray-200 bg-white p-3">
				<div class="mb-1.5 flex items-center gap-1.5">
					<span
						class="rounded-[10px] bg-blue-500 px-1.5 py-0.5 text-[11px] font-bold text-white"
					>
						{index + 1}
					</span>
					<strong class="text-[13px]">{tool.name}</strong>
				</div>
				<p class="mb-2 text-xs text-gray-500">
					{tool.description}
				</p>

				<button
					onclick={() => handleToolClick(tool.name)}
					disabled={activeTool === tool.name}
					class="w-full cursor-pointer rounded border-none px-2.5 py-1.5 text-xs font-medium text-white transition-colors
                        {activeTool === tool.name
						? 'cursor-not-allowed bg-gray-300'
						: 'bg-green-600 hover:bg-green-700'}"
				>
					{activeTool === tool.name ? 'Executing...' : '🚀 Execute'}
				</button>
			</div>
		{/each}

		<!-- Execution Result -->
		{#if executionResult}
			<div
				class="mt-4 rounded-lg border p-3"
				class:bg-red-50={executionResult.error}
				class:border-red-200={executionResult.error}
				class:bg-green-50={!executionResult.error}
				class:border-green-200={!executionResult.error}
			>
				<h4 class="m-0 mb-2 text-[13px]">
					{executionResult.error ? '❌ Execution Failed' : '✅ Execution Result'}
				</h4>
				<p class="m-0 mb-1 text-xs">
					<strong>Tool:</strong> {executionResult.tool}
				</p>
				{#if executionResult.error}
					<p class="mt-1 text-xs text-red-700">
						<strong>Error:</strong> {executionResult.error}
					</p>
				{:else}
					<pre
						class="mt-1 overflow-auto rounded bg-black/5 p-1.5 text-[11px]">{JSON.stringify(
							executionResult.result,
							null,
							2
						)}</pre>
				{/if}
			</div>
		{/if}
	</div>
</div>
