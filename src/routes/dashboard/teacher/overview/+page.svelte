<script lang="ts">
	import { onMount } from 'svelte';

	const API_BASE = 'http://localhost';

	type PlacedAsset = {
		instanceId?: number;
		row?: number;
		col?: number;
		width?: number;
		height?: number;
		label?: string;
		asset?: {
			label?: string;
			width?: number;
			height?: number;
			image?: string;
		};
		[key: string]: any;
	};

	type Design = {
		id: number;
		rows?: number;
		cols?: number;
		backgroundImage?: string | null;
		created_at?: string;
		class_code?: string | null;
		student_name?: string | null;
		placedAssets?: PlacedAsset[];
		placed_assets?: PlacedAsset[]; // from backend
		feedback?: string | null;
		[key: string]: any;
	};

	let designs: Design[] = [];
	let loading = true;
	let error = '';

	// simple feedback state (per design)
	let feedbackByDesign: Record<number, string> = {};
	let savingFor: number | null = null;

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/designs`);

			if (!res.ok) {
				throw new Error(`Failed to load designs (${res.status})`);
			}

			const data = await res.json();

			const raw = Array.isArray(data) ? data : data.data ?? [];

			// normalize placedAssets + feedback
			designs = raw.map((d: Design) => ({
				...d,
				placedAssets: (d.placedAssets ?? d.placed_assets ?? []) as PlacedAsset[],
				feedback: d.feedback ?? null
			}));

			// preload existing feedback
			feedbackByDesign = designs.reduce<Record<number, string>>((acc, d) => {
				acc[d.id] = d.feedback ?? '';
				return acc;
			}, {});
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Could not load designs.';
		} finally {
			loading = false;
		}
	});

	function groupAssetsByLabel(items: PlacedAsset[]) {
		const map = new Map<string, number>();

		for (const item of items) {
			const label = item.label ?? item.asset?.label ?? 'Unknown';
			map.set(label, (map.get(label) ?? 0) + 1);
		}

		return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
	}

	async function submitFeedback(designId: number) {
		const text = feedbackByDesign[designId]?.trim();
		if (!text) return;

		savingFor = designId;

		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}/feedback`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ text })
			});

			if (!res.ok) {
				const body = await res.text();
				console.error('Feedback error', res.status, body);
				alert('Opslaan van feedback mislukt. Check de console.');
				return;
			}

			alert('Feedback opgeslagen 👍');

			// keep local copy in sync
			designs = designs.map((d) => (d.id === designId ? { ...d, feedback: text } : d));
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij opslaan van feedback.');
		} finally {
			savingFor = null;
		}
	}

	function shortDate(date?: string) {
		if (!date) return '';
		return new Date(date).toLocaleString();
	}
</script>

<div class="min-h-screen bg-slate-100/70 px-6 py-10">
	<div class="mx-auto max-w-6xl space-y-6">
		<header class="flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900">Student designs</h1>
				<p class="text-sm text-slate-600">
					Overview of all saved layouts. Select a card to leave feedback.
				</p>
			</div>

			<a href="/dashboard/teacher" class="text-xs text-slate-600 underline hover:text-slate-900">
				← Back to teacher dashboard
			</a>
		</header>

		{#if loading}
			<p class="text-sm text-slate-600">Loading designs…</p>
		{:else if error}
			<p class="text-sm text-red-600">{error}</p>
		{:else if designs.length === 0}
			<p class="text-sm text-slate-600">
				No designs found yet. Ask students to save their design first.
			</p>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each designs as design}
					<article
						class="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md"
					>
						<!-- Small visual preview with simple asset blocks -->
						<div class="h-32 bg-slate-200">
							<div
								class="relative h-full w-full overflow-hidden rounded-b-none bg-cover bg-center"
								style={`background-image: url('${
									design.backgroundImage ??
									'/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg'
								}')`}
							>
								{#if design.rows && design.cols}
									<div
										class="absolute inset-1 grid"
										style={`grid-template-columns: repeat(${design.cols}, 1fr); grid-template-rows: repeat(${design.rows}, 1fr); gap: 1px;`}
									>
										{#if design.placedAssets && design.placedAssets.length > 0}
											{#each design.placedAssets as item}
												<div
													class="rounded-[1px] bg-emerald-500/80 border border-emerald-900/40"
													title={item.label ?? item.asset?.label}
													style={`grid-column: ${(item.col ?? 0) + 1} / span ${
														item.width ?? item.asset?.width ?? 1
													}; grid-row: ${(item.row ?? 0) + 1} / span ${
														item.height ?? item.asset?.height ?? 1
													};`}
												></div>
											{/each}
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<div class="flex flex-col gap-3 p-4">
							<div class="flex items-center justify-between">
								<h2 class="text-sm font-semibold text-slate-900">
									Design #{design.id}
								</h2>
								{#if design.created_at}
									<span class="text-[11px] text-slate-500">
										{shortDate(design.created_at)}
									</span>
								{/if}
							</div>

							<!-- quick meta info -->
							<div class="space-y-0.5 text-[11px] text-slate-500">
								{#if design.rows && design.cols}
									<p>Grid: {design.rows} × {design.cols}</p>
								{/if}
								{#if design.class_code}
									<p>Class: {design.class_code}</p>
								{/if}
								{#if design.student_name}
									<p>Student: {design.student_name}</p>
								{/if}
								{#if design.placedAssets && design.placedAssets.length}
									<p>Items placed: {design.placedAssets.length}</p>
								{/if}
								{#if design.feedback}
									<p class="text-[10px] text-emerald-600">Has feedback ✔</p>
								{/if}
							</div>

							<!-- small chip list with asset labels + counts -->
							{#if design.placedAssets && design.placedAssets.length}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each groupAssetsByLabel(design.placedAssets) as group}
										<span
											class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700"
										>
											{group.label} × {group.count}
										</span>
									{/each}
                                </div>
							{/if}

							<!-- feedback box -->
							<div class="mt-2">
								<label class="mb-1 block text-xs font-medium text-slate-700">
									Teacher feedback
								</label>
								<textarea
									class="w-full resize-none rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
									rows="3"
									bind:value={feedbackByDesign[design.id]}
									placeholder="Write short, kid-friendly feedback…"
								></textarea>
							</div>

							<div class="mt-1 flex items-center justify-between">
								<button
									class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
									on:click={() => submitFeedback(design.id)}
									disabled={savingFor === design.id}
								>
									{savingFor === design.id ? 'Saving…' : 'Save feedback'}
								</button>

								<a
									href={`/dashboard/teacher/overview/${design.id}`}
									class="text-[11px] text-emerald-600 hover:underline"
								>
									Open design →
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>
