<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

	const API_BASE = 'http://localhost';

	type PlacedAsset = {
		instanceId?: number;
		row?: number;
		col?: number;
		width?: number;
		height?: number;
		label?: string;
		rotation?: number;
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
		placedAssets?: PlacedAsset[];
		placed_assets?: PlacedAsset[];
		created_at?: string;
		class_code?: string | null;
		student_name?: string | null;
		feedback?: string | null;
		[key: string]: any;
	};

	let design: Design | null = null;
	let loading = true;
	let error = '';

	let feedbackText = '';
	let savingFeedback = false;

	let designId: number;

	// controls how “strong” the grid lines are
	let softGrid = false;

	onMount(async () => {
		const idFromRoute = Number(get(page).params.id);
		designId = idFromRoute;

		if (!designId || Number.isNaN(designId)) {
			error = 'Invalid design ID in URL.';
			loading = false;
			return;
		}

		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}`);

			if (!res.ok) {
				throw new Error(`Failed to load design (${res.status})`);
			}

			const data = await res.json();

			const normalized: Design = {
				...data,
				placedAssets: (data.placedAssets ?? data.placed_assets ?? []) as PlacedAsset[],
				feedback: data.feedback ?? null
			};

			design = normalized;
			feedbackText = normalized.feedback ?? '';
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Could not load this design.';
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

	function getRotatedSize(item: PlacedAsset) {
		const rotation = (((item.rotation ?? 0) % 360) + 360) % 360;
		const baseWidth = item.width ?? item.asset?.width ?? 1;
		const baseHeight = item.height ?? item.asset?.height ?? 1;

		if (rotation === 90 || rotation === 270) {
			return { width: baseHeight, height: baseWidth };
		}

		return { width: baseWidth, height: baseHeight };
	}

	async function saveFeedback() {
		const text = feedbackText.trim();
		if (!text) return;

		savingFeedback = true;

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

			if (design) {
				design = { ...design, feedback: text };
			}
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij opslaan van feedback.');
		} finally {
			savingFeedback = false;
		}
	}

	function shortDate(date?: string) {
		if (!date) return '';
		return new Date(date).toLocaleString();
	}
</script>

<div class="min-h-screen bg-slate-100/70 px-4 py-8">
	<div class="mx-auto max-w-6xl space-y-6">
		<!-- header -->
		<header class="flex items-center justify-between gap-4">
			<div class="space-y-1">
				<a
					href="/dashboard/teacher/overview"
					class="inline-flex items-center text-xs text-slate-600 hover:text-slate-900"
				>
					← Back to designs overview
				</a>

				<h1 class="text-2xl font-semibold text-slate-900">Student design #{designId}</h1>

				{#if design && design.created_at}
					<p class="text-xs text-slate-500">Saved at {shortDate(design.created_at)}</p>
				{/if}
			</div>
		</header>

		{#if loading}
			<p class="text-sm text-slate-600">Loading design…</p>
		{:else if error}
			<p class="text-sm text-red-600">{error}</p>
		{:else if !design}
			<p class="text-sm text-slate-600">Design not found.</p>
		{:else}
			<div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<!-- LEFT: read-only grid preview + info -->
				<section class="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-md">
					<!-- title + grid toggle -->
					<div class="mb-1 flex items-center justify-between gap-3">
						<h2 class="text-sm font-semibold text-slate-900">Layout preview</h2>

						<button
							type="button"
							class="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
							on:click={() => (softGrid = !softGrid)}
						>
							{softGrid ? 'Grid: strong' : 'Grid: translucent'}
						</button>
					</div>

					<div
						class="relative h-[420px] w-full overflow-hidden rounded-xl border border-emerald-300 bg-slate-200 shadow-inner"
					>
						<!-- background image -->
						<div
							class="absolute inset-0 bg-cover bg-center"
							style={`background-image: url('${
								design.backgroundImage ??
								'/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg'
							}')`}
						></div>

						{#if design.rows && design.cols}
							<!-- LOCKED GRID -->
							<div
								class="relative z-[1] m-3 grid h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]"
								style={`grid-template-columns: repeat(${design.cols}, minmax(0, 1fr)); grid-template-rows: repeat(${design.rows}, minmax(0, 1fr)); gap: 2px;`}
							>
								<!-- grid cells -->
								{#each Array.from({ length: design.rows * design.cols }) as _, i}
									<div
										class="rounded-[4px] border border-emerald-500/40 bg-emerald-100/25"
										style={`opacity: ${softGrid ? 0.25 : 0.9};`}
									/>
								{/each}

								<!-- placed assets, read-only -->
								{#if design.placedAssets && design.placedAssets.length > 0}
									{#each design.placedAssets as item (item.instanceId ?? `${item.row}-${item.col}-${item.label}`)}
										{@const size = getRotatedSize(item)}
										<div
											class="rounded-[4px] shadow-md"
											title={item.label ?? item.asset?.label}
											style={`grid-column: ${(item.col ?? 0) + 1} / span ${
												size.width
											}; grid-row: ${(item.row ?? 0) + 1} / span ${size.height}; background-image: url('${
												item.asset?.image ?? '/placeholder.png'
											}'); background-size: cover; background-position: center; transform: rotate(${
												item.rotation ?? 0
											}deg);`}
										/>
									{/each}
								{/if}
							</div>
						{/if}
					</div>

					<!-- meta info -->
					<div class="mt-2 grid gap-4 text-xs text-slate-600 sm:grid-cols-2">
						<div class="space-y-1">
							<p><span class="font-semibold">Design ID:</span> {design.id}</p>
							{#if design.rows && design.cols}
								<p>
									<span class="font-semibold">Grid:</span>
									{design.rows} × {design.cols}
								</p>
							{/if}
							{#if design.class_code}
								<p><span class="font-semibold">Class:</span> {design.class_code}</p>
							{/if}
							{#if design.student_name}
								<p><span class="font-semibold">Student:</span> {design.student_name}</p>
							{/if}
						</div>

						<div class="space-y-1">
							<p class="font-semibold text-slate-700">Asset overview</p>
							{#if design.placedAssets && design.placedAssets.length > 0}
								<p>Total placed items: {design.placedAssets.length}</p>
								<div class="mt-1 flex flex-wrap gap-1">
									{#each groupAssetsByLabel(design.placedAssets) as group}
										<span
											class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700"
										>
											{group.label} × {group.count}
										</span>
									{/each}
								</div>
							{:else}
								<p>No placed items stored in this design.</p>
							{/if}
						</div>
					</div>

					<!-- optional: raw JSON for debugging -->
					<details class="mt-3 text-xs">
						<summary class="cursor-pointer text-slate-500">
							Show raw design JSON (debug)
						</summary>
						<pre
							class="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[10px] text-slate-100"
						>
{JSON.stringify(design, null, 2)}
                        </pre>
					</details>
				</section>

				<!-- RIGHT: feedback panel -->
				<aside
					class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-md"
				>
					<h2 class="text-sm font-semibold text-slate-900">Teacher feedback</h2>

					<p class="text-xs text-slate-600">
						Give short, concrete feedback that a student can understand. For example:
						<em>"Nice use of trees in the corners, maybe add more benches near the field."</em>
					</p>

					<textarea
						class="w-full flex-1 resize-none rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
						rows="10"
						bind:value={feedbackText}
						placeholder="Write your feedback here…"
					></textarea>

					<button
						class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
						on:click={saveFeedback}
						disabled={savingFeedback}
					>
						{savingFeedback ? 'Saving…' : 'Save feedback'}
					</button>
				</aside>
			</div>
		{/if}
	</div>
</div>
