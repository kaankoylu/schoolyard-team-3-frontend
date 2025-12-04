<script>
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
    import DashboardNavigationCard from "$lib/components/DashboardNavigationCard.svelte";
    import GenerateCodeCard from "$lib/components/GenerateCodeCard.svelte";
</script>
<div class="bg-green-200">
    <div class="w-full flex p-6">
            <div class="w-1/2 flex flex-col items-center gap-4">
                <ProfilePicture></ProfilePicture>

                <h2 class="text-xl font-semibold">Marilin Monroe</h2>
            </div>

        <GenerateCodeCard></GenerateCodeCard>
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