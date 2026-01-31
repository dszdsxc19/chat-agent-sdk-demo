<script lang="ts">
	let { widgetMode, runtime, toolsInfo } = $props();
</script>

<div class="flex w-[280px] flex-col overflow-hidden border-l border-gray-200 bg-gray-50">
	<div class="border-b border-gray-200 p-5">
		<h2 class="m-0 text-base font-bold">📊 Status</h2>
	</div>
	<div class="flex-1 overflow-auto p-5 text-[13px]">
		<div class="mb-4">
			<p class="mb-1 text-xs font-bold">Current Mode:</p>
			<p class="m-0 font-mono text-blue-600">
				{widgetMode}
			</p>
		</div>
		<div class="mb-4">
			<p class="mb-1 text-xs font-bold">Runtime:</p>
			<p class="m-0 text-green-600">
				{runtime ? '✅ Connected' : '⏳ Loading...'}
			</p>
		</div>
		<div class="mb-4">
			<p class="mb-1 text-xs font-bold">Tools:</p>
			<p class="m-0">{toolsInfo.count} registered</p>
		</div>

		<hr class="my-4 border-none border-t border-gray-200" />

		<div>
			<p class="mb-2 text-xs font-bold">Instructions:</p>
			<ul class="m-0 pl-5 leading-relaxed text-gray-500">
				<li>Click a display mode to position the widget</li>
				<li>FAB shows floating button in corner</li>
				<li>Sidebar slides in from side</li>
				<li>Container embeds in center panel</li>
				<li>Execute tools to test functionality</li>
			</ul>
		</div>
	</div>
</div>
