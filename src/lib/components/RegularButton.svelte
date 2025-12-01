<script>
    let props = $props()
</script>

<a 
	href={props.href}
	class="px-6 py-3 bg-green-600 !text-black rounded-xl shadow 
			hover:bg-green-700 transition font-medium"
	>
	{props.name}
</a>