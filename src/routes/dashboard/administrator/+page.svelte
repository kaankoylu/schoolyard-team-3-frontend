<script>
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
    import RegularButton from "$lib/components/RegularButton.svelte";
	// Example: your navigation links
	
	
	const links = [
		{ name: "Create Design", href: "/dashboard" },
		{ name: "Give Feedback", href: "/projects" },
		{ name: "See Wiki", href: "/settings" },
		{ name: "Leaderboard", href: "/contact" }
	];
	
</script>

<div class="w-full flex p-6 bg-green-200">
	<div class="w-1/2 flex flex-col items-center gap-4">
		<ProfilePicture></ProfilePicture>

		<h2 class="text-xl font-semibold">Marilin Monroe</h2>
	</div>

	<div class="w-1/2 flex-1 flex flex-col justify-center items-start pl-16 gap-4">
		{#each links as link}
			<RegularButton href={link.href} name={link.name}></RegularButton>
		{/each}
	</div>
</div>