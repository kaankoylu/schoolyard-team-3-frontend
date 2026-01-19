<script>
	import RegularButton from './RegularButton.svelte';
	let props = $props();
</script>

<div class="flex max-h-[300px] flex-col gap-4 rounded-xl bg-white p-6 shadow-md">
	<div class="flex items-center gap-12">
		<img src={props.imagePath} alt="test" class="h-8 w-8" />
		<p class="text-xl font-bold">{props.title}</p>
	</div>
	<RegularButton href={props.href} name={props.buttonName} style={props.style}></RegularButton>
	<p class="text-sm text-gray-600">
		{props.description}
	</p>
</div>
