<script>
    import DashboardNavigationCard from "$lib/components/DashboardNavigationCard.svelte";
    import ProfilePicture from "$lib/components/ProfilePicture.svelte";
    import DesigningIcon from "$lib/components/DesigningIcon.svelte";
	import RegularButton from "$lib/components/RegularButton.svelte";
</script>
<img src="/dashboard/playcarpet.jpg" 
         alt="Play Carpet" 
         class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0 mt-16" />
<div class="bg-green-400 z-10 rounded-lg">
    <div class="w-full flex p-6">
        <div class="w-full flex flex-col items-center gap-4">
            <ProfilePicture></ProfilePicture>

            <h2 class="text-xl font-semibold">Marilin Monroe</h2>
        </div>
        <div class="w-full flex flex-col items-center gap-4">
            <a href="/next-page" aria-label="Start Designing" class="relative block w-60 h-40 md:w-90 md:h-56 rounded-4xl overflow-hidden shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-300 group transform transition hover:scale-105 active:scale-95">
                <DesigningIcon />
                <div class="absolute bottom-2 w-full text-center">
                    <span class="text-white text-md md:text-base font-semibold drop-shadow-md">Start Designing</span>
                </div>

            </a>
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
