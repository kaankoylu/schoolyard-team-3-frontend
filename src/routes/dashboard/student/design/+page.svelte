<script lang="ts">
	import { onMount } from 'svelte';

	// --- API base ---
	const API_BASE = 'http://localhost';
	const ASSET_BASE = API_BASE; // for images
	// --- ASSETS FROM BACKEND ---

	type Asset = {
		id: number;
		slug: string;
		label: string;
		image_url: string;
		width: number;
		height: number;
	};

	let assets: Asset[] = [];
	let assetsLoading = true;
	let assetsError = '';
	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/assets`);
			if (!res.ok) {
				throw new Error(`Failed to load assets (${res.status})`);
			}

			const data = await res.json();
			const allAssets = Array.isArray(data) ? data : [];

			assets = allAssets.filter((a) => a.is_available === true || a.is_available === 1);
		} catch (e: any) {
			console.error(e);
			assetsError = e?.message ?? 'Kon assets niet laden.';
		} finally {
			assetsLoading = false;
		}
	});

	// --- SAVE DESIGN: payload builder ---

	const rows = 18;
	const cols = 22;

	let backgroundImage: string =
		'/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg';

	type PlacedAsset = {
		instanceId: number;
		asset: Asset;
		row: number; // 0-based
		col: number; // 0-based
		rotation: number; // 0, 90, 180, 270
	};

	let placedAssets: PlacedAsset[] = [];
	let nextInstanceId = 1;

	function buildDesignPayload() {
		return {
			rows,
			cols,
			backgroundImage,
			placedAssets: placedAssets.map((p) => ({
				instanceId: p.instanceId,
				assetId: p.asset.id, // DB id
				label: p.asset.label,
				row: p.row,
				col: p.col,
				width: p.asset.width,
				height: p.asset.height,
				rotation: p.rotation
			}))
		};
	}

	function saveDesignToConsole() {
		const payload = buildDesignPayload();
		console.log('🎨 DESIGN PAYLOAD:', payload);
		alert('Design logged in de console (open DevTools → Console).');
	}

	/**
	 * Save current design to the Laravel backend.
	 */
	async function saveDesignToBackend() {
		const payload = buildDesignPayload();

		try {
			const response = await fetch(`${API_BASE}/api/designs`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
					// no Authorization yet, routes are public for now
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Backend error:', response.status, errorText);
				alert(`Opslaan mislukt (${response.status}). Check de console.`);
				return;
			}

			const data = await response.json();
			console.log('✅ Design saved:', data);
			alert(`Design opgeslagen met ID ${data.id}`);
		} catch (err) {
			console.error('Network / fetch error:', err);
			alert('Netwerkfout bij opslaan. Draait de backend nog?');
		}
	}

	// Tutorial state: mascot speech bubbles
	let showTutorial = false;

	type TutorialBubble = {
		title: string;
		text: string;
	};

	const mascotBubbles: TutorialBubble[] = [
		{
			title: 'Hoi, ik ben je gids!',
			text: 'Samen gaan we een supergroen speelplein maken. Sleep straks dingen uit de toolbox naar het rooster.'
		},
		{
			title: 'Stap 1 – Sleep spullen',
			text: 'Pak een boom, bankje of glijbaan vast en sleep het naar de plattegrond. Laat los om het neer te zetten.'
		},
		{
			title: 'Stap 2 – Verplaats en draai',
			text: 'Je kunt een geplaatst object weer vastpakken om het te verplaatsen. Dubbelklik erop om het te draaien.'
		},
		{
			title: 'Stap 3 – Opruimen en opnieuw',
			text: 'Met “Delete mode” kun je dingen wegklikken. Met “Reset” begin je helemaal opnieuw, en met “Undo” ga je één stap terug.'
		}
	];

	let currentBubble = 0;

	function nextBubble() {
		currentBubble = (currentBubble + 1) % mascotBubbles.length;
	}

	function prevBubble() {
		currentBubble = (currentBubble - 1 + mascotBubbles.length) % mascotBubbles.length;
	}

	// history for undo
	let history: PlacedAsset[][] = [];
	const MAX_HISTORY = 50;

	// delete mode toggle
	let deleteMode = false;

	// drag source type
	type DragSource = { type: 'palette'; asset: Asset } | { type: 'placed'; instanceId: number };

	let dragSource: DragSource | null = null;

	let gridEl: HTMLDivElement | null = null;

	// ===== helpers =====

	function pushHistory() {
		const snapshot = placedAssets.map((p) => ({ ...p }));
		history = [...history, snapshot];

		if (history.length > MAX_HISTORY) {
			history = history.slice(history.length - MAX_HISTORY);
		}
	}

	function clampPosition(row: number, col: number, asset: Asset, rotation: number) {
		const normalizedRotation = ((rotation % 360) + 360) % 360;
		const rotated =
			normalizedRotation === 90 || normalizedRotation === 270
				? { width: asset.height, height: asset.width }
				: { width: asset.width, height: asset.height };

		const maxRow = rows - rotated.height;
		const maxCol = cols - rotated.width;

		return {
			row: Math.max(0, Math.min(row, maxRow)),
			col: Math.max(0, Math.min(col, maxCol))
		};
	}

	function getRotatedSize(asset: Asset, rotation: number) {
		const normalizedRotation = ((rotation % 360) + 360) % 360;

		if (normalizedRotation === 90 || normalizedRotation === 270) {
			return {
				width: asset.height,
				height: asset.width
			};
		}

		return {
			width: asset.width,
			height: asset.height
		};
	}

	function countPlaced(assetId: number): number {
		return placedAssets.filter((p) => p.asset.id === assetId).length;
	}

	// ===== drag from palette =====

	function handlePaletteDragStart(asset: Asset) {
		dragSource = { type: 'palette', asset };
	}

	// ===== drag existing placed asset =====

	function handlePlacedDragStart(instanceId: number) {
		dragSource = { type: 'placed', instanceId };
	}

	function handleDragEnd() {
		dragSource = null;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	// Drop on the grid: compute row/col from mouse position
	function handleGridDrop(event: DragEvent) {
		event.preventDefault();

		const source = dragSource;
		if (!source || !gridEl) return;

		const rect = gridEl.getBoundingClientRect();

		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const cellWidth = rect.width / cols;
		const cellHeight = rect.height / rows;

		let baseCol = Math.floor(x / cellWidth);
		let baseRow = Math.floor(y / cellHeight);

		baseCol = Math.max(0, Math.min(baseCol, cols - 1));
		baseRow = Math.max(0, Math.min(baseRow, rows - 1));

		pushHistory();

		if (source.type === 'palette') {
			const asset = source.asset;
			const { row, col } = clampPosition(baseRow, baseCol, asset, 0);

			const placed: PlacedAsset = {
				instanceId: nextInstanceId++,
				asset,
				row,
				col,
				rotation: 0
			};

			placedAssets = [...placedAssets, placed];
		} else if (source.type === 'placed') {
			placedAssets = placedAssets.map((p) => {
				if (p.instanceId !== source.instanceId) return p;

				const { row, col } = clampPosition(baseRow, baseCol, p.asset, p.rotation);
				return { ...p, row, col };
			});
		}

		dragSource = null;
	}

	function handleAssetClick(instanceId: number) {
		if (!deleteMode) return;

		pushHistory();
		placedAssets = placedAssets.filter((p) => p.instanceId !== instanceId);
	}

	function rotateAsset(instanceId: number) {
		pushHistory();

		placedAssets = placedAssets.map((p) => {
			if (p.instanceId !== instanceId) return p;

			const newRotation = (p.rotation + 90) % 360;
			const { row, col } = clampPosition(p.row, p.col, p.asset, newRotation);

			return { ...p, rotation: newRotation, row, col };
		});
	}

	function resetGrid() {
		if (placedAssets.length === 0) return;

		pushHistory();
		placedAssets = [];
	}

	function undo() {
		if (history.length === 0) return;

		const prev = history[history.length - 1];
		history = history.slice(0, -1);
		placedAssets = prev;
	}

	function toggleDeleteMode() {
		deleteMode = !deleteMode;
	}
</script>

<div class="designer-page">
	<!-- SIDEBAR: assets -->
	<aside class="sidebar">
		<div class="sidebar-top">
			<h2 class="sidebar-title">Your Toolbox</h2>
			<p class="sidebar-subtitle">Sleep items naar het rooster. Dubbelklik om te draaien.</p>
		</div>

		{#if assetsLoading}
			<p class="px-2 text-xs text-slate-500">Assets worden geladen…</p>
		{:else if assetsError}
			<p class="px-2 text-xs text-red-600">{assetsError}</p>
		{:else}
			<div class="asset-list">
				{#each assets as asset}
					<div
						class="asset"
						draggable="true"
						on:dragstart={() => handlePaletteDragStart(asset)}
						on:dragend={handleDragEnd}
					>
						<div class="asset-main">
							<div class="asset-thumb">
								<img src={`${ASSET_BASE}${asset.image_url}`} alt={asset.label} />
							</div>

							<div class="asset-text">
								<span class="asset-label">{asset.label}</span>
								<span class="asset-size">{asset.width}×{asset.height}</span>
							</div>
						</div>

						<span class="asset-count" title="Aantal geplaatst">{countPlaced(asset.id)}</span>
					</div>
				{/each}
			</div>
		{/if}

		<div class="how-to">
			<h3>How to play</h3>
			<ul>
				<li>💡 Sleep een object naar het rooster</li>
				<li>🎯 Laat los om het te plaatsen</li>
				<li>✋ Sleep een geplaatst object om het te verplaatsen</li>
				<li>🔁 Dubbelklik op een object om te roteren</li>
				<li>🗑 Delete-modus + klik om te verwijderen</li>
			</ul>
		</div>
	</aside>

	<!-- MAIN: grid -->
	<main class="grid-wrapper">
		<div class="grid-header">
			<div>
				<h2 class="grid-title">Jouw ontwerp</h2>
				<p class="grid-subtitle">Bouw een groen en leuk speelplein. Alles wat je plaatst wordt opgeslagen.</p>
			</div>
		</div>

		{#if showTutorial}
			<div class="tutorial-backdrop">
				<div class="tutorial-card mascot-card">
					<div class="tutorial-header">
						<h3>Hoe werkt de ontwerptool?</h3>
						<button class="tutorial-close" type="button" on:click={() => (showTutorial = false)}>
							✕
						</button>
					</div>

					<div class="mascot-layout">
						<div class="mascot-col">
							<img src="/mascot-hedgehog.png" alt="Groene egel mascotte" class="mascot-image" />
						</div>

						<div class="bubble-col">
							<div class="speech-bubble">
								<h4>{mascotBubbles[currentBubble].title}</h4>
								<p>{mascotBubbles[currentBubble].text}</p>
							</div>

							<div class="bubble-controls">
								<button class="btn secondary" type="button" on:click={prevBubble}>
									← Vorige
								</button>

								<span class="bubble-counter">{currentBubble + 1} / {mascotBubbles.length}</span>

								<button class="btn secondary" type="button" on:click={nextBubble}>
									Volgende →
								</button>
							</div>

							<button
								type="button"
								class="btn primary mascot-start-btn"
								on:click={() => (showTutorial = false)}
							>
								Ik snap het, laten we ontwerpen! 🎨
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- control buttons -->
		<div class="toolbar">
			<div class="toolbar-left">
				<button class="btn secondary" type="button" on:click={() => (showTutorial = true)}>
					❓ Tutorial
				</button>

				<button
					type="button"
					class="btn secondary"
					on:click={toggleDeleteMode}
					class:active={deleteMode}
				>
					{deleteMode ? '❌ Exit delete mode' : '🗑 Delete mode'}
				</button>

				<button class="btn secondary" type="button" on:click={undo} disabled={history.length === 0}>
					↩️ Undo
				</button>

				<button class="btn secondary" type="button" on:click={resetGrid}>🧹 Reset</button>
			</div>

			<div class="toolbar-right">
				<button class="btn secondary" type="button" on:click={saveDesignToConsole}>
					💾 Console
				</button>

				<button class="btn primary" type="button" on:click={saveDesignToBackend}>
					📡 Save
				</button>
			</div>
		</div>

		<div
			class="design-area"
			style={`--rows: ${rows}; --cols: ${cols}; background-image: url('${backgroundImage}')`}
		>
			<div class="grid" bind:this={gridEl} on:dragover={handleDragOver} on:drop={handleGridDrop}>
				{#each Array.from({ length: rows * cols }) as _}
					<div class="grid-cell"></div>
				{/each}

				{#each placedAssets as placed (placed.instanceId)}
					<div
						class="placed-asset"
						draggable="true"
						on:dragstart={() => handlePlacedDragStart(placed.instanceId)}
						on:dragend={handleDragEnd}
						style={`grid-column: ${placed.col + 1} / span ${
							getRotatedSize(placed.asset, placed.rotation).width
						}; grid-row: ${placed.row + 1} / span ${
							getRotatedSize(placed.asset, placed.rotation).height
						}; background-image: url('${ASSET_BASE}${placed.asset.image_url}'); transform: rotate(${placed.rotation}deg);`}
						title={placed.asset.label}
						on:click={() => handleAssetClick(placed.instanceId)}
						on:dblclick|stopPropagation={() => rotateAsset(placed.instanceId)}
					></div>
				{/each}
			</div>

			{#if deleteMode}
				<div class="delete-banner">Delete mode is aan — klik op een object om het te verwijderen.</div>
			{/if}
		</div>

		<p class="hint">
			💡 Sleep een object naar een vakje. Sleep om te verplaatsen, dubbelklik om te roteren.
			Delete-modus + klik verwijdert.
		</p>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		background-image: url('/1.webp');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
	}

	/* layout */
	.designer-page {
		display: grid;
		grid-template-columns: 280px 1fr;
		min-height: calc(100vh - 5rem);
		gap: 1.25rem;
		padding: 1.5rem 2rem;
		background: transparent;
	}

	/* sidebar */
	.sidebar {
		background: rgba(249, 250, 251, 0.92);
		border-radius: 1.1rem;
		padding: 1rem;
		border: 1px solid rgba(229, 231, 235, 0.9);
		box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sidebar-top {
		padding: 0.25rem 0.25rem 0.5rem;
	}

	.sidebar-title {
		margin: 0;
		font-weight: 800;
		font-size: 1.05rem;
		padding: 0.75rem 1rem;
		border-radius: 0.9rem;
		background: linear-gradient(to right, #f472b6, #fb923c);
		color: white;
		text-align: center;
		box-shadow: 0 14px 26px rgba(244, 114, 182, 0.22);
	}

	.sidebar-subtitle {
		margin: 0.5rem 0.25rem 0;
		font-size: 0.8rem;
		color: rgba(17, 24, 39, 0.7);
	}

	.asset-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: 0.25rem;
	}

	.asset {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.55rem 0.65rem;
		border-radius: 0.9rem;
		cursor: grab;
		color: #111827;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(229, 231, 235, 0.95);
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
		transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
	}

	.asset:hover {
		transform: translateY(-1px);
		border-color: rgba(16, 185, 129, 0.35);
		box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16);
	}

	.asset:active {
		cursor: grabbing;
		transform: scale(0.98);
		box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
	}

	.asset-main {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
	}

	.asset-thumb {
		width: 34px;
		height: 34px;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid rgba(229, 231, 235, 1);
		background: rgba(249, 250, 251, 1);
		flex: 0 0 auto;
	}

	.asset-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.asset-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.asset-label {
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.asset-size {
		font-size: 0.75rem;
		color: rgba(17, 24, 39, 0.55);
	}

	.asset-count {
		min-width: 1.7rem;
		text-align: center;
		font-size: 0.75rem;
		background: rgba(229, 231, 235, 0.8);
		border: 1px solid rgba(229, 231, 235, 1);
		border-radius: 9999px;
		padding: 0.12rem 0.5rem;
		color: #374151;
		font-weight: 800;
		flex: 0 0 auto;
	}

	.how-to {
		margin-top: auto;
		margin-bottom: 0.25rem;
		padding: 0.8rem 0.9rem;
		background: rgba(236, 253, 245, 0.92);
		border-radius: 0.95rem;
		border: 1px solid rgba(167, 243, 208, 0.95);
		box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.06);
	}

	.how-to h3 {
		font-size: 0.85rem;
		font-weight: 800;
		color: #059669;
		margin: 0 0 0.3rem 0;
	}

	.how-to ul {
		margin: 0;
		font-size: 0.75rem;
		color: #4b5563;
		padding-left: 1rem;
		list-style: disc;
	}

	/* main */
	.grid-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		align-items: center;
	}

	.grid-header {
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.grid-title {
		margin: 0;
		font-weight: 900;
		font-size: 1.25rem;
		color: #111827;
	}

	.grid-subtitle {
		margin: 0.2rem 0 0;
		font-size: 0.85rem;
		color: rgba(17, 24, 39, 0.65);
	}

	.toolbar {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-bottom: 0.2rem;
	}

	.toolbar-left,
	.toolbar-right {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn {
		border-radius: 0.85rem;
		padding: 0.45rem 0.85rem;
		font-size: 0.85rem;
		border: 1px solid transparent;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-weight: 800;
		transition: transform 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease,
			border-color 0.12s ease, opacity 0.12s ease;
		user-select: none;
	}

	.btn.secondary {
		background: rgba(255, 255, 255, 0.88);
		color: #111827;
		border-color: rgba(229, 231, 235, 0.95);
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
	}

	.btn.secondary:hover:enabled {
		transform: translateY(-1px);
		border-color: rgba(16, 185, 129, 0.35);
	}

	.btn.secondary:disabled {
		opacity: 0.45;
		cursor: default;
		box-shadow: none;
	}

	.btn.primary {
		background: rgba(16, 185, 129, 0.95);
		color: white;
		border-color: rgba(16, 185, 129, 0.5);
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.22);
	}

	.btn.primary:hover:enabled {
		transform: translateY(-1px);
		filter: brightness(1.02);
	}

	.btn.active {
		background: rgba(254, 202, 202, 0.95);
		border-color: rgba(239, 68, 68, 0.35);
		color: #991b1b;
		box-shadow: 0 12px 22px rgba(239, 68, 68, 0.14);
	}

	/* ✅ KEEP MAP/GRID SIZE EXACTLY THE SAME AS YOUR ORIGINAL */
	.design-area {
		position: relative;
		width: 1000px;
		height: 520px;
		max-width: 100%;
		overflow: hidden;

		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;

		border-radius: 1.1rem;
		border: 2px solid rgba(34, 197, 94, 0.6);
		padding: 6px;

		box-shadow:
			0 20px 40px rgba(15, 23, 42, 0.55),
			inset 0 0 0 1px rgba(16, 185, 129, 0.18);
		background-color: transparent;
	}

	.grid {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		grid-template-rows: repeat(var(--rows), minmax(0, 1fr));
		gap: 2px;
		background: transparent;
		position: relative;
	}

	.grid-cell {
		background: rgba(249, 250, 251, 0.32);
		border-radius: 0.35rem;
		border: 1px solid rgba(34, 197, 94, 0.42);
	}

	.placed-asset {
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		border-radius: 0.35rem;
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.22);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.placed-asset:hover {
		box-shadow: 0 14px 30px rgba(15, 23, 42, 0.28);
	}

	.delete-banner {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 12px;
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(254, 226, 226, 0.92);
		border: 1px solid rgba(239, 68, 68, 0.28);
		color: rgba(153, 27, 27, 1);
		font-weight: 900;
		font-size: 0.85rem;
		box-shadow: 0 12px 22px rgba(15, 23, 42, 0.18);
	}

	.hint {
		width: 100%;
		font-size: 0.85rem;
		color: rgba(17, 24, 39, 0.7);
		margin-top: 0.5rem;
	}

	/* tutorial modal (kept, slightly cleaner) */
	.tutorial-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 14px;
	}

	.tutorial-card.mascot-card {
		width: min(780px, 95vw);
		background: #f9fafb;
		border-radius: 1.25rem;
		border: 1px solid #e5e7eb;
		box-shadow:
			0 24px 60px rgba(15, 23, 42, 0.35),
			0 0 0 1px rgba(148, 163, 184, 0.4);
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tutorial-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.tutorial-header h3 {
		font-size: 1.2rem;
		font-weight: 800;
		color: #111827;
		margin: 0;
	}

	.tutorial-close {
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		color: #6b7280;
	}
	.tutorial-close:hover {
		background: #e5e7eb;
		color: #111827;
	}

	.mascot-layout {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 1rem;
		align-items: center;
	}

	.mascot-col {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mascot-image {
		width: 160px;
		max-width: 100%;
		object-fit: contain;
	}

	.bubble-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.speech-bubble {
		position: relative;
		background: #ffffff;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		padding: 0.75rem 1rem;
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
	}

	.speech-bubble::before {
		content: '';
		position: absolute;
		left: -14px;
		top: 40%;
		border-width: 10px;
		border-style: solid;
		border-color: transparent #ffffff transparent transparent;
	}
	.speech-bubble::after {
		content: '';
		position: absolute;
		left: -16px;
		top: 40%;
		border-width: 11px;
		border-style: solid;
		border-color: transparent #e5e7eb transparent transparent;
	}

	.speech-bubble h4 {
		font-size: 1rem;
		font-weight: 900;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.speech-bubble p {
		font-size: 0.9rem;
		color: #4b5563;
		margin: 0;
	}

	.bubble-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bubble-counter {
		font-size: 0.8rem;
		color: #6b7280;
		font-weight: 800;
	}

	.mascot-start-btn {
		align-self: flex-end;
		margin-top: 0.25rem;
	}

	@media (max-width: 900px) {
		.designer-page {
			grid-template-columns: 1fr;
			padding: 1.25rem 1rem;
		}
	}

	@media (max-width: 640px) {
		.mascot-layout {
			grid-template-columns: 1fr;
		}

		.speech-bubble::before,
		.speech-bubble::after {
			display: none;
		}

		.mascot-col {
			order: -1;
		}
	}
</style>
