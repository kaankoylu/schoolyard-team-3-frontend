<script lang="ts">
	import { onMount } from "svelte";

	const API_BASE = "http://localhost";
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
	let error = "";

	let newLabel = "";
	let newSlug = "";
	let newWidth = 1;
	let newHeight = 1;
	let newIsAvailable = true;
	let newImageFile: File | null = null;
	let newImagePreview: string | null = null;

	let creating = false;
	let togglingId: number | null = null;

	const MAX_GRID = 10;

	// Auto-generate slug
	$: newSlug = newLabel
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_]/g, "");

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
		try {
			const res = await fetch(`${API_BASE}/api/assets`);
			if (!res.ok) throw new Error("Failed to load assets.");
			const data = await res.json();
			assets = Array.isArray(data) ? data : data.data ?? [];
		} catch (e: any) {
			error = e?.message ?? "Failed to load assets.";
		} finally {
			loading = false;
		}
	}

	onMount(loadAssets);

	async function createAsset() {
		if (!newLabel.trim()) {
			alert("Label is required.");
			return;
		}
		if (!newImageFile) {
			alert("Select an image.");
			return;
		}

		creating = true;

		try {
			const form = new FormData();
			form.append("slug", newSlug);
			form.append("label", newLabel.trim());
			form.append("width", String(newWidth));
			form.append("height", String(newHeight));
			form.append("is_available", newIsAvailable ? "1" : "0");
			form.append("image", newImageFile);

			const res = await fetch(`${API_BASE}/api/assets`, {
				method: "POST",
				body: form
			});

			if (!res.ok) {
				console.error(await res.text());
				alert("Create asset failed.");
				return;
			}

			const created = await res.json();
			assets = [...assets, created];

			newLabel = "";
			newWidth = 1;
			newHeight = 1;
			newIsAvailable = true;
			newImageFile = null;
			newImagePreview = null;
		} finally {
			creating = false;
		}
	}

	async function toggleAvailability(asset: Asset) {
		const newValue = !asset.is_available;
		togglingId = asset.id;

		try {
			const res = await fetch(`${API_BASE}/api/assets/${asset.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_available: newValue })
			});

			if (!res.ok) {
				console.error(await res.text());
				alert("Failed to update availability.");
				return;
			}

			const updated = await res.json();
			assets = assets.map((a) => (a.id === asset.id ? updated : a));
		} finally {
			togglingId = null;
		}
	}
</script>

<div class="min-h-screen bg-slate-100/70 px-6 py-10">
	<div class="mx-auto max-w-6xl space-y-6">
		<header class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold">Asset overview</h1>
				<p class="text-sm text-slate-600">
					Manage which playground assets are available.
				</p>
			</div>

			<a href="/dashboard/teacher" class="text-xs underline">
				← Back
			</a>
		</header>

		<!-- CREATE ASSET -->
		<section class="rounded-xl border bg-white p-4 shadow space-y-4">
			<h2 class="text-sm font-semibold">Add new asset</h2>

			<!-- GRID PICKER WITH OVERLAY -->
			<div class="text-xs space-y-2">
				<p class="font-medium">
					Size: {newWidth} × {newHeight} cells
				</p>

				<div class="inline-block border rounded-lg p-2 bg-slate-50">
					<div class="relative">
						<!-- Grid squares -->
						{#each Array(MAX_GRID) as _, row}
							<div class="flex">
								{#each Array(MAX_GRID) as _, col}
									<div
										class="h-6 w-6 border cursor-pointer"
										class:bg-emerald-300={col + 1 <= newWidth && row + 1 <= newHeight}
										class:border-emerald-500={col + 1 <= newWidth && row + 1 <= newHeight}
										on:click={() => selectGrid(col + 1, row + 1)}
									/>
								{/each}
							</div>
						{/each}

						<!-- SINGLE IMAGE OVERLAY -->
						{#if newImagePreview}
							<div
								class="absolute top-0 left-0 pointer-events-none overflow-hidden rounded-sm"
								style={`width:${(newWidth / MAX_GRID) * 100}%; height:${(newHeight / MAX_GRID) * 100}%;`}
							>
								<img src={newImagePreview} class="w-full h-full object-cover" />
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- FORM FIELDS -->
			<div class="grid gap-3 text-xs md:grid-cols-2 lg:grid-cols-3">
				<div>
					<label>Label</label>
					<input
						bind:value={newLabel}
						placeholder="e.g. Groot klimrek"
						class="w-full border rounded px-2 py-1.5"
					/>
					<p class="text-[10px] text-slate-500">
						Slug (auto): <span class="font-mono">{newSlug}</span>
					</p>
				</div>

				<div>
					<label>Image file</label>
					<input type="file" accept="image/*" on:change={handleFileChange} />

					{#if newImagePreview}
						<div class="mt-1 w-16 h-16 border rounded overflow-hidden">
							<img src={newImagePreview} class="object-cover w-full h-full" />
						</div>
					{/if}
				</div>

				<div>
					<label>Width</label>
					<input type="number" readonly bind:value={newWidth} class="w-full border rounded bg-slate-50 px-2 py-1.5" />
				</div>

				<div>
					<label>Height</label>
					<input type="number" readonly bind:value={newHeight} class="w-full border rounded bg-slate-50 px-2 py-1.5" />
				</div>

				<div class="flex items-end">
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={newIsAvailable} />
						Available
					</label>
				</div>
			</div>

			<button
				class="bg-emerald-500 text-white rounded px-3 py-1.5 text-xs"
				on:click={createAsset}
				disabled={creating}
			>
				{creating ? "Saving…" : "Add asset"}
			</button>
		</section>

		<!-- ASSET LIST -->
		<section class="rounded-xl border bg-white p-4 shadow space-y-3">
			<h2 class="text-sm font-semibold">Existing assets</h2>

			{#if loading}
				<p>Loading…</p>
			{:else if error}
				<p class="text-red-600">{error}</p>
			{:else}
				<table class="min-w-full text-xs border-separate border-spacing-y-1">
					<thead>
						<tr class="uppercase text-[11px] text-slate-500">
							<th>Preview</th>
							<th>Label</th>
							<th>Slug</th>
							<th>Size</th>
							<th>Status</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each assets as asset}
							<tr class="bg-slate-50">
								<td class="px-2 py-1">
									<div class="w-10 h-10 border rounded overflow-hidden">
										<img src={`${ASSET_BASE}${asset.image_url}`} class="object-cover w-full h-full" />
									</div>
								</td>
								<td>{asset.label}</td>
								<td>{asset.slug}</td>
								<td>{asset.width} × {asset.height}</td>
								<td>
									<span class={asset.is_available ? "text-emerald-600" : "text-slate-500"}>
										{asset.is_available ? "Available" : "Hidden"}
									</span>
								</td>
								<td>
									<button
										on:click={() => toggleAvailability(asset)}
										disabled={togglingId === asset.id}
										class="border rounded px-2 py-1 text-[11px]"
									>
										{togglingId === asset.id ? "Saving…" :
											asset.is_available ? "Hide" : "Show"}
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
