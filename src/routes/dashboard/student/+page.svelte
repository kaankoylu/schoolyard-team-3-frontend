<script>
    import DashboardNavigationCard from "$lib/components/DashboardNavigationCard.svelte";
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
	import RegularButton from "$lib/components/RegularButton.svelte";
</script>
<div class="bg-green-200">
    <div class="w-full flex p-6">
            <div class="w-full flex flex-col items-center gap-4">
                <ProfilePicture></ProfilePicture>

                <h2 class="text-xl font-semibold">Marilin Monroe</h2>
            </div>
            <div class="w-full flex flex-col items-center gap-4">
                <RegularButton name="Start Designing" href="/dashboard/student/design"></RegularButton>
            </div>
    </div>
    <div class="w-full grid grid-cols-2 gird-columns-2 p-6 gap-6">
        <DashboardNavigationCard 
        description="View the student's feedback on assets and designs" 
        title="Give Feedback" 
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