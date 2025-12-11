<script>
    let props = $props()
</script>

{#if props.style === "kids"}
<a href={props.href} class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 !text-white text-center">
	{props.name}
</a>
{:else}
<a href={props.href} class="px-4 py-2 rounded-lg bg-green-600 text-white cursor-pointer hover:bg-green-700 w-full !text-white text-center">
	{props.name}
</a>
{/if}