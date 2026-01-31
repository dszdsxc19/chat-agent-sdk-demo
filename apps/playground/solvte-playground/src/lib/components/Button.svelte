<script lang="ts">
	let { children, active = false, onclick, variant = 'default' } = $props();

	const baseClasses =
		'px-3 py-2 text-white border-none rounded-md cursor-pointer text-xs font-medium transition-colors duration-200';

	let bgClass = $derived.by(() => {
		if (variant === 'danger') {
			return active ? 'bg-red-700' : 'bg-red-500 hover:bg-red-600';
		}
		return active ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
	});
</script>

<button class="{baseClasses} {bgClass}" {onclick}>
	{@render children()}
</button>
