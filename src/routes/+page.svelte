<script>
	// in case of need, which is prob not needed
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Schoolplein ontwerper" />
</svelte:head>

<section
	class="relative right-1/2 left-1/2 -mx-[50vw] flex
	       min-h-[60vh] w-screen flex-col items-center
	       justify-center bg-cover bg-center bg-no-repeat pt-32 pb-24 text-center"
	style="background-image: url('/istockphoto-1182692791-2048x2048.jpg');"
>
	<div class="fade-in mx-auto max-w-3xl px-4" style="animation-delay: 0.1s;">
		<h1 class="text-4xl font-semibold text-blue-900 md:text-5xl">Ontwerp Jouw Droomspeelplaats</h1>

		<p class="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
			Een samenwerkingsplatform waar leerlingen hun ideale speelplaats kunnen ontwerpen, docenten
			projecten kunnen beheren en beheerders overzicht houden over plattegronden en beschikbare
			objecten.
		</p>

		<a
			href="/login"
			class="mt-8 inline-block rounded-md !bg-black px-8 py-3 !text-white shadow transition hover:!bg-neutral-800"
		>
			Aan de slag
		</a>
	</div>
</section>

<section class="w-full bg-white py-20">
	<h2 class="mb-16 text-center font-bold text-black" style="font-size: 35px">
		Functionaliteiten voor Iedereen
	</h2>

	<div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
		<!-- Students -->
		<div
			class="scroll-fade rounded-xl border p-8 shadow-sm transition hover:shadow-md"
			style="animation-delay: 0.1s;"
		>
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<path d="M20 21v-2a4 4 0 00-3-3.87"></path>
					<path d="M4 21v-2a4 4 0 013-3.87"></path>
					<circle cx="12" cy="7" r="4"></circle>
				</svg>
			</div>
			<h3 class="mb-2 text-xl font-semibold">Voor Leerlingen</h3>
			<p class="text-gray-600">
				Ontwerp en bewerk je eigen speelplaats met gebruiksvriendelijke tools en een grote selectie
				aan objecten.
			</p>
		</div>

		<!-- Teachers -->
		<div
			class="scroll-fade rounded-xl border p-8 shadow-sm transition hover:shadow-md"
			style="animation-delay: 0.3s;"
		>
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<path d="M12 2l9 4-9 4-9-4 9-4z"></path>
					<path d="M3 10v6a3 3 0 003 3h12a3 3 0 003-3v-6"></path>
					<path d="M12 22v-8"></path>
				</svg>
			</div>
			<h3 class="mb-2 text-xl font-semibold">Voor Docenten</h3>
			<p class="text-gray-600">
				Beheer klasprojecten, genereer toegangscodes, bekijk ontwerpen van leerlingen en verzamel
				feedback.
			</p>
		</div>

		<!-- Administrators -->
		<div
			class="scroll-fade rounded-xl border p-8 shadow-sm transition hover:shadow-md"
			style="animation-delay: 0.5s;"
		>
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<path d="M12 1v3"></path>
					<path d="M12 20v3"></path>
					<path d="M4.2 4.2l2.1 2.1"></path>
					<path d="M17.7 17.7l2.1 2.1"></path>
					<path d="M1 12h3"></path>
					<path d="M20 12h3"></path>
					<path d="M4.2 19.8l2.1-2.1"></path>
					<path d="M17.7 6.3l2.1-2.1"></path>
					<circle cx="12" cy="12" r="3"></circle>
				</svg>
			</div>
			<h3 class="mb-2 text-xl font-semibold">Voor Beheerders</h3>
			<p class="text-gray-600">
				Upload schoolplattegronden, beheer objecten en houd overzicht over het gehele systeem.
			</p>
		</div>
	</div>
</section>

<style>
	:global(body) {
		background: linear-gradient(180deg, #eef7ff 0%, #ffffff 50%);
		background-color: #eef7ff;
	}
	.fade-in {
		opacity: 0;
		transform: translateY(20px);
		animation: fadeUp 0.8s ease-out forwards;
	}

	/* Scroll-linked fade + slide */
	.scroll-fade {
		opacity: 0;
		transform: translateY(20px);

		animation-name: fadeUp;
		animation-duration: 600ms;
		animation-timing-function: ease-out;
		animation-fill-mode: both;

		/* Tie animation to scroll position */
		animation-timeline: view();
		animation-range: entry 0% cover 40%;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.designer-page {
		background: linear-gradient(180deg, #d4f8e2, #f2fff7);
		background-image: url('/bg-clouds.svg'), url('/bg-bushes.svg');
		background-repeat: no-repeat, no-repeat;
		background-position:
			top 20px left 10px,
			bottom -30px right -20px;
		background-size: 240px, 320px;
	}
</style>
