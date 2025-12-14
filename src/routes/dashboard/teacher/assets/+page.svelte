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

	// ✅ NEW: delete state
	let deletingId: number | null = null;

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
				console.error('Toggle error:', await res.text());
				alert('Could not update availability.');
				return;
			}

			const updated = await res.json();
			assets = assets.map((a) => (a.id === asset.id ? updated : a));
		} catch (err) {
			console.error(err);
			alert('Network error.');
		} finally {
			togglingId = null;
		}
	}

	// ✅ NEW: delete asset
	async function deleteAsset(asset: Asset) {
		const ok = confirm(`Delete "${asset.label}" permanently?\nThis will remove the image too.`);
		if (!ok) return;

		deletingId = asset.id;

		try {
			const res = await fetch(`${API_BASE}/api/assets/${asset.id}`, {
				method: 'DELETE',
				headers: { Accept: 'application/json' }
			});

			if (!res.ok) {
				console.error('Delete error:', await res.text());
				alert('Could not delete asset.');
				return;
			}

			assets = assets.filter((a) => a.id !== asset.id);
		} catch (err) {
			console.error(err);
			alert('Network error.');
		} finally {
			deletingId = null;
		}
	}
</script>

<div class="page">
	<div class="container">
		<header class="topbar">
			<div>
				<h1 class="title">Asset Overview</h1>
				<p class="subtitle">Upload new objects and manage what students can use.</p>
			</div>

			<a href="/dashboard/teacher" class="backlink">← Back</a>
		</header>

		<!-- CREATE ASSET -->
		<section class="card">
			<div class="cardHeader">
				<h2 class="cardTitle">Add Asset</h2>
				<p class="cardHint">Pick a size on the grid, then upload an image.</p>
			</div>

			<div class="createLayout">
				<!-- Grid Picker -->
				<div class="gridPicker">
					<div class="gridMeta">
						<span class="gridLabel">Size</span>
						<span class="gridValue">{newWidth} × {newHeight}</span>
					</div>

					<div class="gridBox" role="group" aria-label="Select asset size">
						{#each Array(MAX_GRID) as _, row}
							<div class="gridRow">
								{#each Array(MAX_GRID) as _, col}
									<button
										type="button"
										class="gridCell"
										class:isSelected={col + 1 <= newWidth && row + 1 <= newHeight}
										on:click={() => selectGrid(col + 1, row + 1)}
										aria-label={`Select size ${col + 1} by ${row + 1}`}
									></button>
								{/each}
							</div>
						{/each}

						{#if newImagePreview}
							<div
								class="gridPreview"
								style={`width: ${(newWidth / MAX_GRID) * 100}%; height: ${(newHeight / MAX_GRID) * 100}%`}
							>
								<img src={newImagePreview} alt="preview" class="previewImg" />
							</div>
						{/if}
					</div>
				</div>

				<!-- Form fields -->
				<div class="form">
					<div class="field">
						<label class="label">Label</label>
						<input class="input" bind:value={newLabel} placeholder="e.g. Tree, Bench, Slide" />
					</div>

					<div class="field">
						<label class="label">Image</label>
						<input type="file" accept="image/*" class="file" on:change={handleFileChange} />
						{#if newImagePreview}
							<div class="thumbRow">
								<img src={newImagePreview} class="thumb" alt="Selected image preview" />
								<div class="thumbMeta">
									<div class="thumbTitle">Preview</div>
									<div class="thumbSub">This is how it’ll look in the toolbox.</div>
								</div>
							</div>
						{/if}
					</div>

					<div class="fieldRow">
						<div class="field">
							<label class="label">Width</label>
							<input class="input" readonly bind:value={newWidth} />
						</div>

						<div class="field">
							<label class="label">Height</label>
							<input class="input" readonly bind:value={newHeight} />
						</div>
					</div>

					<label class="toggle">
						<input type="checkbox" bind:checked={newIsAvailable} />
						<span class="toggleText">Available for students</span>
					</label>

					<div class="actions">
						<button class="btnPrimary" on:click={createAsset} disabled={creating}>
							{creating ? 'Saving…' : 'Add Asset'}
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- ASSET LIST -->
		<section class="card">
			<div class="cardHeader">
				<h2 class="cardTitle">Existing Assets</h2>
				<p class="cardHint">Quickly hide/show assets without deleting them.</p>
			</div>

			{#if loading}
				<div class="state">
					<div class="skeleton"></div>
					<div class="skeleton"></div>
					<div class="skeleton"></div>
				</div>
			{:else if error}
				<div class="state error">{error}</div>
			{:else}
				<div class="tableWrap">
					<table class="table">
						<thead>
							<tr>
								<th>Preview</th>
								<th>Label</th>
								<th>Size</th>
								<th>Available</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each assets as item}
								<tr>
									<td>
										<div class="imgBox">
											<img src={`${ASSET_BASE}${item.image_url}`} class="img" alt={item.label} />
										</div>
									</td>

									<td class="strong">{item.label}</td>
									<td class="mono">{item.width}×{item.height}</td>

									<td>
										<span class={`pill ${item.is_available ? 'pillOn' : 'pillOff'}`}>
											{item.is_available ? 'Available' : 'Hidden'}
										</span>
									</td>

									<td class="right">
										<div class="rowActions">
											<button
												class="btnGhost"
												on:click={() => toggleAvailability(item)}
												disabled={togglingId === item.id || deletingId === item.id}
											>
												{togglingId === item.id ? 'Saving…' : item.is_available ? 'Hide' : 'Show'}
											</button>

											<button
												class="btnDanger"
												on:click={() => deleteAsset(item)}
												disabled={deletingId === item.id || togglingId === item.id}
											>
												{deletingId === item.id ? 'Deleting…' : 'Delete'}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		padding: 28px 16px 44px;
		background:
			radial-gradient(900px 500px at 15% 10%, rgba(59, 130, 246, 0.10), transparent 55%),
			radial-gradient(900px 500px at 90% 0%, rgba(34, 197, 94, 0.10), transparent 55%),
			linear-gradient(180deg, rgba(241, 245, 249, 0.65) 0%, rgba(248, 250, 252, 1) 55%, rgba(241, 245, 249, 0.7) 100%);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		gap: 16px;
	}

	.topbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	.title {
		margin: 0;
		font-size: 22px;
		letter-spacing: -0.02em;
		font-weight: 800;
		color: #0f172a;
	}

	.subtitle {
		margin: 6px 0 0;
		font-size: 13px;
		color: rgba(15, 23, 42, 0.66);
	}

	.backlink {
		font-size: 13px;
		color: rgba(15, 23, 42, 0.7);
		text-decoration: none;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transition: transform 120ms ease, background-color 160ms ease;
	}
	.backlink:hover { background: rgba(255, 255, 255, 0.9); transform: translateY(-1px); }
	.backlink:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); }

	.card {
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		padding: 14px;
	}

	.cardHeader { display: grid; gap: 4px; margin-bottom: 12px; }
	.cardTitle { margin: 0; font-size: 13px; letter-spacing: 0.02em; text-transform: uppercase; color: rgba(15, 23, 42, 0.75); font-weight: 800; }
	.cardHint { margin: 0; font-size: 12px; color: rgba(15, 23, 42, 0.55); }

	.createLayout { display: grid; gap: 14px; grid-template-columns: 320px 1fr; align-items: start; }
	.gridPicker { display: grid; gap: 10px; }
	.gridMeta { display: flex; align-items: baseline; gap: 10px; }
	.gridLabel { font-size: 12px; color: rgba(15, 23, 42, 0.60); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
	.gridValue { font-size: 14px; font-weight: 900; color: #0f172a; }

	.gridBox {
		position: relative;
		display: inline-block;
		padding: 10px;
		border-radius: 14px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(248, 250, 252, 0.9);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
		overflow: hidden;
	}
	.gridRow { display: flex; }
	.gridCell {
		height: 22px; width: 22px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		background: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: transform 90ms ease, background-color 140ms ease, border-color 140ms ease;
		border-radius: 6px;
		margin: 2px;
	}
	.gridCell:hover { border-color: rgba(16, 185, 129, 0.35); transform: translateY(-1px); }
	.gridCell:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.22); }
	.gridCell.isSelected { background: rgba(16, 185, 129, 0.35); border-color: rgba(16, 185, 129, 0.35); }

	.gridPreview {
		position: absolute;
		top: 10px;
		left: 10px;
		pointer-events: none;
		overflow: hidden;
		border-radius: 10px;
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.10);
	}
	.previewImg { height: 100%; width: 100%; object-fit: cover; }

	.form { display: grid; gap: 10px; }
	.field { display: grid; gap: 6px; }
	.fieldRow { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
	.label { font-size: 12px; font-weight: 800; color: rgba(15, 23, 42, 0.75); }

	.input {
		width: 100%;
		padding: 10px 10px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: 12px;
		font-size: 13px;
		background: rgba(255, 255, 255, 0.9);
		transition: border-color 140ms ease, box-shadow 140ms ease, transform 90ms ease;
	}
	.input:focus { outline: none; border-color: rgba(59, 130, 246, 0.45); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.20); }
	.input[readonly] { background: rgba(248, 250, 252, 1); color: rgba(15, 23, 42, 0.75); }

	.file { font-size: 12px; }

	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 12px;
	}

	.thumbRow {
		display: flex; align-items: center; gap: 10px;
		margin-top: 6px; padding: 10px;
		border-radius: 14px; border: 1px solid rgba(15, 23, 42, 0.08);
		background: rgba(248, 250, 252, 0.85);
	}
	.thumb { height: 54px; width: 54px; border-radius: 12px; border: 1px solid rgba(15, 23, 42, 0.10); object-fit: cover; background: #fff; }
	.thumbMeta { display: grid; gap: 2px; }
	.thumbTitle { font-weight: 900; font-size: 12px; color: rgba(15, 23, 42, 0.8); }
	.thumbSub { font-size: 11px; color: rgba(15, 23, 42, 0.55); }

	.toggle {
		display: flex; align-items: center; gap: 10px;
		padding: 10px 12px; border-radius: 14px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		background: rgba(248, 250, 252, 0.7);
		width: fit-content;
	}
	.toggleText { font-size: 12px; font-weight: 800; color: rgba(15, 23, 42, 0.72); }

	.actions { display: flex; justify-content: flex-end; margin-top: 4px; }

	.btnPrimary {
		padding: 10px 14px;
		border-radius: 14px;
		border: 1px solid rgba(16, 185, 129, 0.45);
		background: rgba(16, 185, 129, 0.95);
		color: #fff;
		font-size: 13px;
		font-weight: 900;
		cursor: pointer;
		transition: transform 120ms ease, filter 160ms ease, box-shadow 160ms ease;
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.25);
	}
	.btnPrimary:hover { filter: brightness(1.02); transform: translateY(-1px); }
	.btnPrimary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

	.tableWrap { overflow: auto; border-radius: 14px; border: 1px solid rgba(15, 23, 42, 0.08); }
	.table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
	.table thead th {
		text-align: left;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(15, 23, 42, 0.55);
		background: rgba(248, 250, 252, 0.9);
		padding: 10px 12px;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
		position: sticky;
		top: 0;
		z-index: 1;
	}
	.table tbody td {
		padding: 10px 12px;
		border-bottom: 1px solid rgba(15, 23, 42, 0.06);
		background: rgba(255, 255, 255, 0.9);
		vertical-align: middle;
	}
	.table tbody tr:hover td { background: rgba(248, 250, 252, 1); }

	.right { text-align: right; white-space: nowrap; }
	.strong { font-weight: 900; color: rgba(15, 23, 42, 0.85); }

	.imgBox {
		height: 44px; width: 44px;
		border-radius: 12px; border: 1px solid rgba(15, 23, 42, 0.10);
		overflow: hidden; background: #fff;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}
	.img { height: 100%; width: 100%; object-fit: cover; }

	.pill {
		display: inline-flex; align-items: center; gap: 6px;
		padding: 4px 10px; border-radius: 999px;
		font-size: 11px; font-weight: 900;
		border: 1px solid transparent;
	}
	.pillOn { background: rgba(16, 185, 129, 0.10); color: rgba(4, 120, 87, 1); border-color: rgba(16, 185, 129, 0.22); }
	.pillOff { background: rgba(15, 23, 42, 0.06); color: rgba(15, 23, 42, 0.55); border-color: rgba(15, 23, 42, 0.10); }

	.btnGhost {
		padding: 8px 10px;
		border-radius: 12px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.75);
		transition: transform 120ms ease, background-color 160ms ease, box-shadow 160ms ease;
	}
	.btnGhost:hover { background: rgba(255, 255, 255, 1); transform: translateY(-1px); box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08); }
	.btnGhost:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

	/* ✅ NEW: row actions layout */
	.rowActions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		justify-content: flex-end;
	}

	/* ✅ NEW: delete button styling */
	.btnDanger {
		padding: 8px 10px;
		border-radius: 12px;
		border: 1px solid rgba(239, 68, 68, 0.28);
		background: rgba(254, 226, 226, 0.75);
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		color: rgba(153, 27, 27, 1);
		transition: transform 120ms ease, background-color 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
	}
	.btnDanger:hover {
		background: rgba(254, 202, 202, 0.85);
		border-color: rgba(239, 68, 68, 0.36);
		transform: translateY(-1px);
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.10);
	}
	.btnDanger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		box-shadow: none;
		transform: none;
	}

	.state {
		padding: 12px;
		border-radius: 14px;
		border: 1px dashed rgba(15, 23, 42, 0.18);
		background: rgba(248, 250, 252, 0.85);
		display: grid;
		gap: 10px;
	}
	.state.error {
		border-style: solid;
		border-color: rgba(239, 68, 68, 0.22);
		background: rgba(239, 68, 68, 0.06);
		color: rgba(185, 28, 28, 1);
		font-weight: 800;
	}

	.skeleton {
		height: 12px;
		border-radius: 999px;
		background: linear-gradient(90deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.10), rgba(15, 23, 42, 0.06));
		background-size: 200% 100%;
		animation: shimmer 1.1s infinite linear;
	}
	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@media (max-width: 980px) {
		.createLayout { grid-template-columns: 1fr; }
		.actions { justify-content: stretch; }
		.btnPrimary { width: 100%; }
	}
	@media (max-width: 420px) {
		.gridCell { height: 20px; width: 20px; }
		.fieldRow { grid-template-columns: 1fr; }
	}
</style>
