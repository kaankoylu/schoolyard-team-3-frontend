<script>
	import DashboardNavigationCard from '$lib/components/DashboardNavigationCard.svelte';
	import ProfilePicture from '$lib/components/ProfilePicture.svelte';
	import DesigningIcon from '$lib/components/DesigningIcon.svelte';
</script>

<img
	src="/dashboard/playcarpet.jpg"
	alt="Play Carpet"
	class="pointer-events-none absolute inset-0 z-0 mt-16 h-full w-full object-cover opacity-20"
/>
<div class="z-10 rounded-lg bg-green-400">
	<div class="flex w-full p-6">
		<div class="flex w-full flex-col items-center gap-4">
			<ProfilePicture></ProfilePicture>

			<h2 class="text-xl font-semibold">Welcome</h2>
		</div>
		<div class="flex w-full flex-col items-center gap-4">
			<a
				href="/dashboard/student/design"
				aria-label="Start Designing"
				class="group relative block h-40 w-60 transform overflow-hidden rounded-4xl shadow-lg transition hover:scale-105 focus:ring-4 focus:ring-sky-300 focus:outline-none active:scale-95 md:h-56 md:w-90"
			>
				<DesigningIcon />
				<div class="absolute bottom-2 w-full text-center">
					<span class="text-md font-semibold text-white drop-shadow-md md:text-base"
						>Start met ontwerpen</span
					>
				</div>
			</a>
		</div>
	</div>
	<div class="grid w-full grid-cols-2 gap-6 p-6">
		<DashboardNavigationCard
			description="Geef feedback op een andere student zijn ontwerp"
			title="Feed"
			buttonName="Feedback geven"
			href="/dashboard/student/feed"
			imagePath="/dashboard/like.png"
			style="kids"
		/>
	</div>
</div>
