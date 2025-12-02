<script>
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
    import RegularButton from "$lib/components/RegularButton.svelte";
	import DashboardNavigationCard from "$lib/components/DashboardNavigationCard.svelte";

	const links = [
		{ name: "Manage Classes", href: "/dashboard" },
		{ name: "Manage Layouts", href: "/projects" },
	];
	
</script>
<div class="bg-green-300">
	<div class="w-full flex p-6">
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
	<div class="w-full grid grid-cols-2 gird-columns-2 p-6 gap-6">
		<DashboardNavigationCard 
		description="View the student's feedback on assets and designs" 
		title="Student Feedback" 
		buttonName="to Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="View the student's feedback on assets and designs" 
		title="Print Layout" 
		buttonName="to Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="View the student's feedback on assets and designs" 
		title="Student Designs" 
		buttonName="to Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="View the student's feedback on assets and designs" 
		title="Wiki" 
		buttonName="to Student feedback" 
		href="fcgv"
		/>
	</div>
</div>