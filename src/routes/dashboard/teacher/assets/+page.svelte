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

	// create form
	let newLabel = '';
	let newSlug = '';
	let newWidth = 1;
	let newHeight = 1;
	let newIsAvailable = true;
	let newImageFile: File | null = null;
	let newImagePreview: string | null = null;
	let creating = false;

	// toggle availability
	let togglingId: number | null = null;

	// delete
	let deletingId: number | null = null;

	// edit modal
	let editing: Asset | null = null;
	let editLabel = '';
	let editWidth = 1;
	let editHeight = 1;
	let editIsAvailable = true;
	let editImageFile: File | null = null;
	let editImagePreview: string | null = null;
	let savingEdit = false;

	const MAX_GRID = 10;

	// auto-generate slug from label
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
		if (newWidth <= 0 || newHeight <= 0) {
			alert('Choose a valid grid size.');
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
				console.error('Create asset error:', res.status, await res.text());
				alert('Aanmaken van asset mislukt. Check de console.');
				return;
			}

			const created = await res.json();
			assets = [...assets, created];

			// reset form
			newLabel = '';
			newWidth = 1;
			newHeight = 1;
			newIsAvailable = true;
			newImageFile = null;
			newImagePreview = null;
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij aanmaken asset.');
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
				console.error('Toggle availability error:', res.status, await res.text());
				alert('Aanpassen van beschikbaarheid mislukt. Check de console.');
				return;
			}

			const updated = await res.json();
			assets = assets.map((a) => (a.id === asset.id ? updated : a));
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij aanpassen beschikbaarheid.');
		} finally {
			togglingId = null;
		}
	}

	async function deleteAsset(asset: Asset) {
		if (!confirm(`Weet je zeker dat je "${asset.label}" wilt verwijderen? Dit kan niet ongedaan worden.`)) {
			return;
		}

		deletingId = asset.id;

		try {
			const res = await fetch(`${API_BASE}/api/assets/${asset.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				console.error('Delete error:', res.status, await res.text());
				alert('Verwijderen mislukt. Check de console.');
				return;
			}

			assets = assets.filter((a) => a.id !== asset.id);
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij verwijderen asset.');
		} finally {
			deletingId = null;
		}
	}

	function openEdit(asset: Asset) {
		editing = asset;
		editLabel = asset.label;
		editWidth = asset.width;
		editHeight = asset.height;
		editIsAvailable = asset.is_available ?? true;
		editImageFile = null;
		editImagePreview = null;
	}

	function closeEdit() {
		editing = null;
	}

	function handleEditFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		editImageFile = file;
		editImagePreview = file ? URL.createObjectURL(file) : null;
	}

	async function saveEdit() {
		if (!editing) return;
		if (!editLabel.trim()) {
			alert('Label is required.');
			return;
		}
		if (editWidth <= 0 || editHeight <= 0) {
			alert('Width/height must be > 0.');
			return;
		}

		savingEdit = true;

		try {
			const form = new FormData();
			form.append('label', editLabel.trim());
			form.append('width', String(editWidth));
			form.append('height', String(editHeight));
			form.append('is_available', editIsAvailable ? '1' : '0');
			if (editImageFile) {
				form.append('image', editImageFile);
			}

			const res = await fetch(`${API_BASE}/api/assets/${editing.id}`, {
				method: 'PATCH',
				body: form
			});

			if (!res.ok) {
				console.error('Edit error:', res.status, await res.text());
				alert('Opslaan van wijzigingen mislukt. Check de console.');
				return;
			}

			const updated = await res.json();
			assets = assets.map((a) => (a.id === updated.id ? updated : a));
			editing = null;
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij opslaan wijzigingen.');
		} finally {
			savingEdit = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-100/70 px-6 py-10">
	<div class="mx-auto max-w-6xl space-y-6">
		<header class="flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900">Asset overview</h1>
				<p class="text-sm text-slate-600">Manage which playground assets are available in the student designer.</p>
			</div>

			<a href="/dashboard/teacher" class="text-xs text-slate-600 underline hover:text-slate-900">
				← Back to teacher dashboard
			</a>
		</header>

		<!-- CREATE NEW ASSET -->
		<section class="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="text-sm font-semibold text-slate-900">Add new asset</h2>

			<!-- grid picker -->
			<div class="space-y-2 text-xs">
				<p class="font-medium text-slate-700">
					Asset size: {newWidth} × {newHeight} cells
				</p>

				<div class="inline-block rounded-lg border border-slate-200 bg-slate-50 p-2">
					<div class="relative">
						{#each Array(MAX_GRID) as _, row}
							<div class="flex">
								{#each Array(MAX_GRID) as _, col}
									<div
										class="h-6 w-6 cursor-pointer border border-slate-200"
										class:bg-emerald-300={col + 1 <= newWidth && row + 1 <= newHeight}
										class:border-emerald-500={col + 1 <= newWidth && row + 1 <= newHeight}
										on:click={() => selectGrid(col + 1, row + 1)}
									/>
								{/each}
							</div>
						{/each}

						{#if newImagePreview}
							<div
								class="pointer-events-none absolute top-0 left-0 overflow-hidden rounded-sm"
								style={`width: ${(newWidth / MAX_GRID) * 100}%; height: ${(newHeight / MAX_GRID) * 100}%;`}
							>
								<img src={newImagePreview} alt="asset preview" class="h-full w-full object-cover" />
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="grid gap-3 text-xs md:grid-cols-2 lg:grid-cols-3">
				<div class="space-y-1">
					<label class="font-medium text-slate-700">Label</label>
					<input
						class="w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
						bind:value={newLabel}
						placeholder="e.g. Grote boom"
					/>
					<p class="text-[10px] text-slate-500">
						Slug (auto): <span class="font-mono">{newSlug}</span>
					</p>
				</div>

				<div class="space-y-1">
					<label class="font-medium text-slate-700">Image file</label>
					<input type="file" accept="image/*" class="w-full text-xs" on:change={handleFileChange} />

					{#if newImagePreview}
						<div class="mt-1 h-16 w-16 overflow-hidden rounded border border-slate-200">
							<img src={newImagePreview} alt="preview" class="h-full w-full object-cover" />
						</div>
					{/if}
				</div>

				<div class="space-y-1">
					<label class="font-medium text-slate-700">Width (cells)</label>
					<input
						type="number"
						min="1"
						class="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5"
						bind:value={newWidth}
						readonly
					/>
				</div>

				<div class="space-y-1">
					<label class="font-medium text-slate-700">Height (cells)</label>
					<input
						type="number"
						min="1"
						class="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5"
						bind:value={newHeight}
						readonly
					/>
				</div>

				<div class="flex items-end gap-2">
					<label class="inline-flex items-center gap-2 text-xs text-slate-700">
						<input
							type="checkbox"
							bind:checked={newIsAvailable}
							class="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
						/>
						Available for students
					</label>
				</div>
			</div>

			<div class="flex justify-end">
				<button
					class="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
					on:click={createAsset}
					disabled={creating}
				>
					{creating ? 'Saving…' : 'Add asset'}
				</button>
			</div>
		</section>

		<!-- EXISTING ASSETS LIST -->
		<section class="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="text-sm font-semibold text-slate-900">Existing assets</h2>

			{#if loading}
				<p class="text-xs text-slate-600">Loading assets…</p>
			{:else if error}
				<p class="text-xs text-red-600">{error}</p>
			{:else if assets.length === 0}
				<p class="text-xs text-slate-600">No assets found yet. Add your first asset above.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full border-separate border-spacing-y-1 text-xs">
						<thead>
							<tr class="text-left text-[11px] text-slate-500 uppercase">
								<th class="px-2 py-1">Preview</th>
								<th class="px-2 py-1">Label</th>
								<th class="px-2 py-1">Slug</th>
								<th class="px-2 py-1">Size</th>
								<th class="px-2 py-1">Available</th>
								<th class="px-2 py-1 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each assets as asset}
								<tr class="bg-slate-50">
									<td class="px-2 py-1">
										<div class="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
											{#if asset.image_url}
												<img
													src={`${ASSET_BASE}${asset.image_url}`}
													alt={asset.label}
													class="h-full w-full object-cover"
												/>
											{/if}
										</div>
									</td>
									<td class="px-2 py-1">
										<div class="font-medium text-slate-800">{asset.label}</div>
										<div class="text-[10px] text-slate-500">ID: {asset.id}</div>
									</td>
									<td class="px-2 py-1 text-[11px] text-slate-700">
										{asset.slug}
									</td>
									<td class="px-2 py-1 text-[11px] text-slate-700">
										{asset.width} × {asset.height}
									</td>
									<td class="px-2 py-1">
										<span
											class={`inline-flex items-center rounded-full px-2 py-[2px] text-[10px] ${
												asset.is_available
													? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
													: 'border border-slate-200 bg-slate-100 text-slate-500'
											}`}
										>
											{asset.is_available ? 'Available' : 'Hidden'}
										</span>
									</td>
									<td class="px-2 py-1 text-right space-x-1">
										<button
											class="inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
											on:click={() => toggleAvailability(asset)}
											disabled={togglingId === asset.id}
										>
											{togglingId === asset.id
												? 'Saving…'
												: asset.is_available
													? 'Hide'
													: 'Show'}
										</button>

										<button
											class="inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-medium hover:bg-slate-100"
											on:click={() => openEdit(asset)}
										>
											Edit
										</button>

										<button
											class="inline-flex items-center rounded-lg border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
											on:click={() => deleteAsset(asset)}
											disabled={deletingId === asset.id}
										>
											{deletingId === asset.id ? 'Deleting…' : 'Delete'}
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	</div>

	{#if editing}
		<!-- EDIT MODAL -->
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div class="w-full max-w-md rounded-xl bg-white p-4 shadow-lg space-y-3">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-semibold text-slate-900">Edit asset</h3>
					<button class="text-xs text-slate-500 hover:text-slate-800" on:click={closeEdit}>✕</button>
				</div>

				<div class="space-y-2 text-xs">
					<div class="space-y-1">
						<label class="font-medium text-slate-700">Label</label>
						<input
							class="w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
							bind:value={editLabel}
						/>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div class="space-y-1">
							<label class="font-medium text-slate-700">Width</label>
							<input
								type="number"
								min="1"
								class="w-full rounded-lg border border-slate-300 px-2 py-1.5"
								bind:value={editWidth}
							/>
						</div>
						<div class="space-y-1">
							<label class="font-medium text-slate-700">Height</label>
							<input
								type="number"
								min="1"
								class="w-full rounded-lg border border-slate-300 px-2 py-1.5"
								bind:value={editHeight}
							/>
						</div>
					</div>

					<div class="space-y-1">
						<label class="font-medium text-slate-700">Image (optional new)</label>
						<input type="file" accept="image/*" class="w-full text-xs" on:change={handleEditFileChange} />

						<div class="mt-1 flex gap-2">
							<div class="h-12 w-12 overflow-hidden rounded border border-slate-200 bg-slate-100">
								<img
									src={`${ASSET_BASE}${editing.image_url}`}
									alt={editing.label}
									class="h-full w-full object-cover"
								/>
							</div>

							{#if editImagePreview}
								<div class="h-12 w-12 overflow-hidden rounded border border-slate-200 bg-slate-100">
									<img src={editImagePreview} alt="new preview" class="h-full w-full object-cover" />
								</div>
							{/if}
						</div>
					</div>

					<label class="inline-flex items-center gap-2 text-xs text-slate-700">
						<input
							type="checkbox"
							bind:checked={editIsAvailable}
							class="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
						/>
						Available for students
					</label>
				</div>

				<div class="flex justify-end gap-2 pt-1">
					<button
						class="rounded-lg border px-3 py-1.5 text-xs"
						type="button"
						on:click={closeEdit}
						disabled={savingEdit}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
						type="button"
						on:click={saveEdit}
						disabled={savingEdit}
					>
						{savingEdit ? 'Saving…' : 'Save changes'}
					</button>
				</div>
			</div>
		</div>
	{/if}
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
