<script lang="ts">
	let { embedContainerRef = $bindable() } = $props();
</script>

<div class="flex min-w-0 flex-1 flex-col">
	<div class="border-b border-gray-200 bg-white px-5 py-4">
		<h2 class="m-0 text-base font-bold">💬 Chat UI (Container Mode)</h2>
		<p class="m-0 mt-1 text-xs text-gray-500">
			Widget appears here when "Embed in Panel" is selected
		</p>
	</div>
	<div
		bind:this={embedContainerRef}
		id="chat-container"
		class="relative min-h-0 flex-1 bg-neutral-50"
	></div>
</div>
