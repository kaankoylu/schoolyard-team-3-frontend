<script>
	let props = $props();
</script>

{#if props.style === 'kids'}
	<a
		href={props.href}
		class="rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 px-4 py-2 text-center !text-white hover:from-purple-500 hover:to-pink-500"
	>
		{props.name}
	</a>
{:else}
	<a
		href={props.href}
		class="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-center !text-white text-white hover:bg-green-700"
	>
		{props.name}
	</a>
{/if}
