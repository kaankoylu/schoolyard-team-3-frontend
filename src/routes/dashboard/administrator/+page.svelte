<script>
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
    import RegularButton from "$lib/components/RegularButton.svelte";
	import DashboardNavigationCard from "$lib/components/DashboardNavigationCard.svelte";
	import GenerateCodeCard from "$lib/components/GenerateCodeCard.svelte";

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
		<GenerateCodeCard></GenerateCodeCard>
	</div>
	<div class="w-full grid grid-cols-2 gird-columns-2 p-6 gap-6">
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen" 
		title="Student Feedback" 
		buttonName="Naar student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen" 
		title="Layout uitprinten" 
		buttonName="Naar Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen"
		title="Student ontwerp" 
		buttonName="Naar Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen"
		title="Wiki" 
		buttonName="Naar Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen" 
		title="Assets bewerken" 
		buttonName="Naar Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen" 
		title="Layouts bewerken" 
		buttonName="Naar Student feedback" 
		href="fcgv"
		/>
		<DashboardNavigationCard 
		description="Bekijk de studenten hun feedback op de assets en ontwerpen"
		title="Klassen bewerken" 
		buttonName="Naar Student feedback" 
		href="fcgv"
		/>
	</div>

	<!-- <div class="w-1/2 flex-1 flex flex-col justify-center items-start pl-16 gap-4">
			{#each links as link}
				<RegularButton href={link.href} name={link.name}></RegularButton>
			{/each}
		</div> -->
</div>