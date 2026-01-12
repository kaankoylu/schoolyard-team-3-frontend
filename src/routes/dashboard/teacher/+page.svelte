<script>
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
    import DashboardNavigationCard from "$lib/components/DashboardNavigationCard.svelte";
    import GenerateCodeCard from "$lib/components/GenerateCodeCard.svelte";
</script>

<div class="bg-green-200">
    <div class="w-full flex p-6">
        <div class="w-1/2 flex flex-col items-center gap-4">
            <ProfilePicture />
            <h2 class="text-xl font-semibold">Marilin Monroe</h2>
        </div>

        <GenerateCodeCard />
    </div>

    <div class="w-full grid grid-cols-2 gird-columns-2 p-6 gap-6">
        <DashboardNavigationCard 
            description="View the assets or add more" 
            title="Asset overview" 
            buttonName="To asset overview" 
            href="/dashboard/teacher/assets"   
        />

        <DashboardNavigationCard 
            description="View the student's feedback on assets and designs" 
            title="Print Layout" 
            buttonName="To print layout" 
            href="fcgv"
        />

        <DashboardNavigationCard 
            description="View the student's feedback on assets and designs" 
            title="Student Designs" 
            buttonName="To student designs" 
            href="/dashboard/teacher/overview"
        />
    </div>
</div>
