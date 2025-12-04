<script>
	// later you can replace this with real data from the backend
	const studentName = 'shiven';
</script>

<section class="min-h-screen bg-[#f5f6fb] px-6 py-10">
	<div class="max-w-6xl mx-auto space-y-8">
		<!-- Header -->
		<header>
			<h1 class="text-3xl font-semibold text-gray-900">
				Welcome to Your Dashboard
			</h1>
			<p class="mt-1 text-sm text-gray-500">
				Quick access to all your tools and features
			</p>
		</header>

		<!-- Big gradient hero card -->
		<div
			class="rounded-3xl px-8 py-7 shadow-lg bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-white flex items-center justify-between gap-6"
		>
			<div class="flex items-start gap-4">
				<div
					class="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-md"
				>
					<span class="text-2xl">🎨</span>
				</div>

				<div>
					<h2 class="text-2xl font-semibold">
						Let's Create Something Amazing!
					</h2>
					<p class="mt-1 text-sm text-white/90">
						Your imagination is the only limit.
						Start designing your dream playground.
					</p>
				</div>
			</div>

			<a
				href="/dashboard/student/design"
				class="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-fuchsia-600 shadow hover:bg-white transition"
			>
				Start Designing
				<span>➜</span>
			</a>
		</div>

		<!-- Lower cards row -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- My Playground Designs -->
			<a
				href="/dashboard/student/design"
				class="group rounded-3xl border border-fuchsia-200 bg-white/80 p-6 shadow-sm hover:shadow-md hover:border-fuchsia-300 transition flex flex-col gap-4"
			>
				<div class="flex items-center gap-4">
					<div
						class="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-purple-400 flex items-center justify-center shadow"
					>
						<span class="text-2xl text-white">✏️</span>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<span>✨ My Playground Designs</span>
						</h3>
						<p class="text-sm text-gray-500">
							Create your dream playground – drag, drop, and design.
						</p>
					</div>
				</div>

				<div class="mt-2 flex items-center justify-between text-xs text-gray-400">
					<span>Continue where you left off</span>
					<span class="group-hover:text-fuchsia-500 transition">Open ➜</span>
				</div>
			</a>

			<!-- Help & Tips -->
			<div
				class="rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-sm flex flex-col gap-4"
			>
				<div class="flex items-center gap-4">
					<div
						class="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow"
					>
						<span class="text-2xl text-white">📘</span>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">
							Help &amp; Tips
						</h3>
						<p class="text-sm text-gray-500">
							Learn tricks for designing, see examples, and get help when you need it.
						</p>
					</div>
				</div>

				<ul class="mt-2 text-xs text-gray-500 space-y-1 list-disc list-inside">
					<li>How to place items on the grid</li>
					<li>Ideas for making your playground greener</li>
					<li>Shortcuts &amp; controls overview</li>
				</ul>
			</div>
		</div>

		<!-- Tiny bottom-right welcome badge (optional) -->
		<div class="fixed bottom-4 right-4 max-w-xs">
			<div class="flex items-center gap-2 rounded-2xl bg-white shadow-md px-4 py-2 text-xs text-gray-600">
				<span class="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
					✔
				</span>
				<span>Welcome {studentName}!</span>
			</div>
		</div>
	</div>
</section>
