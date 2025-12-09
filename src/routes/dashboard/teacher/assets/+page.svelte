<script lang="ts">
	import { onMount } from 'svelte';

	const API_BASE = 'http://localhost';
	const ASSET_BASE = API_BASE;

	type Asset = {
		id: number;
		slug: string;
		label: string;
		image_url: string;
		width: number;
		height: number;
		is_available?: boolean;
	};

	let assets: Asset[] = [];
	let loading = true;
	let error = '';

	// form state
	let newLabel = '';
	let newSlug = '';
	let newWidth = 1;
	let newHeight = 1;
	let newIsAvailable = true;
	let newImageFile: File | null = null;
	let newImagePreview: string | null = null;

	let creating = false;
	let togglingId: number | null = null;

	const MAX_GRID = 10;

	// Auto-generate slug from label
	$: newSlug = newLabel
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_]/g, '');

	function selectGrid(w: number, h: number) {
		newWidth = w;
		newHeight = h;
	}

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		newImageFile = file;
		newImagePreview = file ? URL.createObjectURL(file) : null;
	}

	async function loadAssets() {
		loading = true;
		error = '';

		try {
			const res = await fetch(`${API_BASE}/api/assets`);
			if (!res.ok) throw new Error(`Failed to load assets (${res.status})`);

			const data = await res.json();
			assets = Array.isArray(data) ? data : data.data ?? [];
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Could not load assets.';
		} finally {
			loading = false;
		}
	}

	onMount(loadAssets);

	async function createAsset() {
		if (!newLabel.trim()) {
			alert('Label is required.');
			return;
		}
		if (!newImageFile) {
			alert('Choose an image.');
			return;
		}

		creating = true;

		try {
			const form = new FormData();
			form.append('slug', newSlug);
			form.append('label', newLabel.trim());
			form.append('width', String(newWidth));
			form.append('height', String(newHeight));
			form.append('is_available', newIsAvailable ? '1' : '0');
			form.append('image', newImageFile);

			const res = await fetch(`${API_BASE}/api/assets`, {
				method: 'POST',
				body: form
			});

			if (!res.ok) {
				console.error('Create error:', await res.text());
				alert('Error creating asset.');
				return;
			}

			const item = await res.json();
			assets = [...assets, item];

			// Reset form
			newLabel = '';
			newImageFile = null;
			newImagePreview = null;
			newWidth = 1;
			newHeight = 1;
			newIsAvailable = true;

		} catch (err) {
			console.error(err);
			alert('Network error.');
		} finally {
			creating = false;
		}
	}

	async function toggleAvailability(asset: Asset) {
		const newValue = !(asset.is_available ?? true);
		togglingId = asset.id;

		try {
			const res = await fetch(`${API_BASE}/api/assets/${asset.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ is_available: newValue ? 1 : 0 })
			});

			if (!res.ok) {
				console.error("Toggle error:", await res.text());
				alert("Could not update availability.");
				return;
			}

			const updated = await res.json();
			assets = assets.map(a => a.id === asset.id ? updated : a);

		} catch (err) {
			console.error(err);
			alert("Network error.");
		} finally {
			togglingId = null;
		}
	}
</script>

<div class="min-h-screen bg-slate-100/70 px-6 py-10">
	<div class="mx-auto max-w-6xl space-y-6">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold">Asset Overview</h1>
			<a href="/dashboard/teacher" class="text-sm underline">← Back</a>
		</header>

		<!-- CREATE ASSET -->
		<section class="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
			<h2 class="font-semibold text-sm">Add Asset</h2>

			<!-- Grid Picker (OLD SYSTEM RESTORED 100%) -->
			<div class="space-y-2 text-xs">
				<p class="font-medium text-slate-700">
					Size: {newWidth} × {newHeight}
				</p>

				<div class="inline-block rounded border bg-slate-50 p-2 relative">
					{#each Array(MAX_GRID) as _, row}
						<div class="flex">
							{#each Array(MAX_GRID) as _, col}
								<div
									class="h-6 w-6 border border-slate-200 cursor-pointer"
									class:bg-emerald-300={col + 1 <= newWidth && row + 1 <= newHeight}
									on:click={() => selectGrid(col + 1, row + 1)}
								></div>
							{/each}
						</div>
					{/each}

					{#if newImagePreview}
						<div
							class="absolute top-0 left-0 pointer-events-none overflow-hidden rounded-sm"
							style={`width: ${(newWidth / MAX_GRID) * 100}%; height: ${(newHeight / MAX_GRID) * 100}%`}
						>
							<img src={newImagePreview} alt="preview" class="h-full w-full object-cover" />
						</div>
					{/if}
				</div>
			</div>

			<!-- Form fields -->
			<div class="grid gap-3 text-xs md:grid-cols-2 lg:grid-cols-3">
				<div>
					<label class="font-medium">Label</label>
					<input class="input" bind:value={newLabel} />
					<p class="text-[10px] text-slate-500">Slug: {newSlug}</p>
				</div>

				<div>
					<label class="font-medium">Image</label>
					<input type="file" accept="image/*" class="text-xs" on:change={handleFileChange} />
					{#if newImagePreview}
						<img src={newImagePreview} class="mt-1 h-16 w-16 rounded border object-cover" />
					{/if}
				</div>

				<div>
					<label class="font-medium">Width</label>
					<input class="input" readonly bind:value={newWidth} />
				</div>

				<div>
					<label class="font-medium">Height</label>
					<input class="input" readonly bind:value={newHeight} />
				</div>

				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={newIsAvailable} />
					Available for students
				</label>
			</div>

			<button class="btn" on:click={createAsset} disabled={creating}>
				{creating ? 'Saving…' : 'Add Asset'}
			</button>
		</section>

		<!-- ASSET LIST -->
		<section class="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
			<h2 class="font-semibold text-sm">Existing Assets</h2>

			{#if loading}
				<p class="text-xs">Loading…</p>
			{:else if error}
				<p class="text-xs text-red-500">{error}</p>
			{:else}
				<table class="min-w-full text-xs border-separate border-spacing-y-1">
					<thead>
						<tr class="text-left text-[11px] text-slate-500 uppercase">
							<th class="px-2 py-1">Preview</th>
							<th class="px-2 py-1">Label</th>
							<th class="px-2 py-1">Slug</th>
							<th class="px-2 py-1">Size</th>
							<th class="px-2 py-1">Available</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each assets as item}
							<tr class="bg-slate-50">
								<td class="px-2 py-1">
									<div class="h-10 w-10 rounded border overflow-hidden">
										<img src={`${ASSET_BASE}${item.image_url}`} class="h-full w-full object-cover" />
									</div>
								</td>

								<td class="px-2 py-1">{item.label}</td>
								<td class="px-2 py-1">{item.slug}</td>
								<td class="px-2 py-1">{item.width}×{item.height}</td>

								<td class="px-2 py-1">
									<span class={`px-2 py-[2px] rounded-full text-[10px] ${
										item.is_available
											? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
											: 'bg-slate-100 text-slate-500 border border-slate-200'
									}`}>
										{item.is_available ? 'Available' : 'Hidden'}
									</span>
								</td>

								<td class="px-2 py-1">
									<button
										class="px-2 py-1 rounded border text-[11px]"
										on:click={() => toggleAvailability(item)}
										disabled={togglingId === item.id}
									>
										{togglingId === item.id
											? 'Saving…'
											: item.is_available ? 'Hide' : 'Show'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>
	</div>
</div>

<style>
	.input {
		width: 100%;
		padding: 6px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		font-size: 12px;
	}
	.btn {
		padding: 6px 12px;
		background: #10b981;
		color: white;
		border-radius: 6px;
		font-size: 12px;
	}
</style>
