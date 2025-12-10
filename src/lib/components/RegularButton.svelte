<script>
    let props = $props()
</script>

<a href={props.href} class="px-4 py-2 rounded-lg bg-green-600 text-white cursor-pointer hover:bg-green-700 w-full !text-white text-center">
	{props.name}
</a>