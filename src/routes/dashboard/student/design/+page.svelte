<script lang="ts">
	// --- SAVE DESIGN → console ---

	function buildDesignPayload() {
		return {
			rows,
			cols,
			backgroundImage,
			placedAssets: placedAssets.map((p) => ({
				instanceId: p.instanceId,
				assetId: p.asset.id,
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

	// Tutorial state: mascot speech bubbles
	// ❗ Start CLOSED instead of open
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

	// Asset type
	type Asset = {
		id: string;
		label: string;
		color: string;
		width: number;
		height: number;
		image: string;
	};

	const assets: Asset[] = [
		{
			id: 'tree',
			label: 'Boom',
			color: '#4ade80',
			width: 2,
			height: 2,
			image: '/placeholder.png'
		},
		{
			id: 'bench',
			label: 'Bankje',
			color: '#facc15',
			width: 2,
			height: 1,
			image: '/placeholder.png'
		},
		{
			id: 'slide',
			label: 'Glijbaan',
			color: '#60a5fa',
			width: 1,
			height: 2,
			image: '/placeholder.png'
		},
		{
			id: 'sandbox',
			label: 'Zandbak',
			color: '#f97316',
			width: 2,
			height: 2,
			image: '/placeholder.png'
		}
	];

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

	// history for undo
	let history: PlacedAsset[][] = [];
	const MAX_HISTORY = 50;

	// delete mode toggle
	let deleteMode = false;

	// drag source type
	type DragSource =
		| { type: 'palette'; asset: Asset }
		| { type: 'placed'; instanceId: number };

	// track drag source: from palette or from already placed asset
	let dragSource: DragSource | null = null;

	// reference to the grid DOM element
	let gridEl: HTMLDivElement | null = null;

	// ===== helpers =====

	function pushHistory() {
		const snapshot = placedAssets.map((p) => ({ ...p }));
		history = [...history, snapshot];

		// cap history length to avoid unbounded growth
		if (history.length > MAX_HISTORY) {
			history = history.slice(history.length - MAX_HISTORY);
		}
	}

	// Clamp position, taking rotation into account
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

	// Get width/height in grid cells, taking rotation into account
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

	function countPlaced(assetId: string): number {
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
		// Needed so drop is allowed
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

		// clamp to grid bounds
		baseCol = Math.max(0, Math.min(baseCol, cols - 1));
		baseRow = Math.max(0, Math.min(baseRow, rows - 1));

		pushHistory(); // save state before change

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

		// clear drag source after a successful drop
		dragSource = null;
	}

	// click on an asset when delete mode is on
	function handleAssetClick(instanceId: number) {
		if (!deleteMode) return;

		pushHistory();
		placedAssets = placedAssets.filter((p) => p.instanceId !== instanceId);
	}

	// double-click asset to rotate 90°
	function rotateAsset(instanceId: number) {
		pushHistory();

		placedAssets = placedAssets.map((p) => {
			if (p.instanceId !== instanceId) return p;

			const newRotation = (p.rotation + 90) % 360;
			const { row, col } = clampPosition(p.row, p.col, p.asset, newRotation);

			return { ...p, rotation: newRotation, row, col };
		});
	}

	// buttons

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
		<h2 class="sidebar-title">Your Toolbox</h2>

		<div class="asset-list">
			{#each assets as asset}
				<div
					class="asset"
					draggable="true"
					on:dragstart={() => handlePaletteDragStart(asset)}
					on:dragend={handleDragEnd}
				>
					<div class="asset-main">
						<img src={asset.image} alt={asset.label} class="asset-icon" />
						<span class="asset-label">{asset.label}</span>
					</div>
					<span class="asset-count">{countPlaced(asset.id)}</span>
				</div>
			{/each}
		</div>

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
		<h2 class="grid-title">Jouw ontwerp</h2>

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

								<span class="bubble-counter">
									{currentBubble + 1} / {mascotBubbles.length}
								</span>

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
			<button class="btn secondary" type="button" on:click={() => (showTutorial = true)}>
				❓ Tutorial
			</button>

			<button class="btn secondary" type="button" on:click={saveDesignToConsole}>
				💾 Save design (console)
			</button>

			<button class="btn secondary" type="button" on:click={resetGrid}>
				🧹 Reset grid
			</button>

			<button class="btn secondary" type="button" on:click={undo} disabled={history.length === 0}>
				↩️ Undo
			</button>

			<button
				type="button"
				class="btn secondary"
				on:click={toggleDeleteMode}
				class:active={deleteMode}
			>
				{deleteMode ? '❌ Exit delete mode' : '🗑 Delete mode'}
			</button>
		</div>

		<div
			class="design-area"
			style={`--rows: ${rows}; --cols: ${cols}; background-image: url('${backgroundImage}')`}
		>
			<div
				class="grid"
				bind:this={gridEl}
				on:dragover={handleDragOver}
				on:drop={handleGridDrop}
			>
				<!-- grid cells as background only -->
				{#each Array.from({ length: rows * cols }) as _}
					<div class="grid-cell" />
				{/each}

				<!-- placed assets as ONE block spanning multiple cells -->
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
						}; background-image: url('${placed.asset.image}'); transform: rotate(${placed.rotation}deg);`}
						title={placed.asset.label}
						on:click={() => handleAssetClick(placed.instanceId)}
						on:dblclick|stopPropagation={() => rotateAsset(placed.instanceId)}
					/>
				{/each}
			</div>
		</div>

		<p class="hint">
			💡 Sleep een object naar een vakje. Sleep om te verplaatsen, dubbelklik om te roteren. Delete-modus +
			klik verwijdert.
		</p>
	</main>
</div>

<style>
	.designer-page {
		display: grid;
		grid-template-columns: 260px 1fr;
		min-height: calc(100vh - 5rem);
		gap: 1.5rem;
		padding: 1.5rem 2rem;
		background: radial-gradient(circle at top left, #fdf2ff, #f1f5f9);
	}

	/* SIDEBAR */

	.sidebar {
		background: #f9fafb;
		border-radius: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sidebar-title {
		font-weight: 600;
		font-size: 1.1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.9rem;
		background: linear-gradient(to right, #f472b6, #fb923c);
		color: white;
		text-align: center;
	}

	/* Backdrop */

	.tutorial-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
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
		font-weight: 600;
		color: #111827;
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
		box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
	}

	/* little triangle pointing to mascot */
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
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.speech-bubble p {
		font-size: 0.9rem;
		color: #4b5563;
	}

	.bubble-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bubble-counter {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.mascot-start-btn {
		align-self: flex-end;
		margin-top: 0.25rem;
	}

	/* primary button style if you don't have it yet */

	.btn.primary {
		background: #16a34a;
		color: white;
	}

	.btn.primary:hover {
		background: #15803d;
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

	.asset-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.asset {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		cursor: grab;
		color: #111827;
		font-weight: 500;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
		background-color: white;
	}

	.asset-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.asset-icon {
		width: 32px;
		height: 32px;
		border-radius: 0.5rem;
		object-fit: cover;
	}

	.asset-label {
		font-size: 0.9rem;
	}

	.asset-count {
		min-width: 1.5rem;
		text-align: center;
		font-size: 0.75rem;
		background: #e5e7eb;
		border-radius: 9999px;
		padding: 0.1rem 0.45rem;
		color: #374151;
	}

	.asset:active {
		cursor: grabbing;
		transform: scale(0.96);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
	}

	.how-to {
		margin-top: auto;
		margin-bottom: 0.25rem;
		padding: 0.75rem 0.9rem;
		background: #ecfdf5;
		border-radius: 0.75rem;
		border: 1px solid #a7f3d0;
	}

	.how-to h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: #059669;
		margin-bottom: 0.25rem;
	}

	.how-to ul {
		font-size: 0.75rem;
		color: #4b5563;
		padding-left: 1rem;
		list-style: disc;
	}

	/* GRID SIDE */

	.grid-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.grid-title {
		font-weight: 600;
		font-size: 1.2rem;
		align-self: flex-start;
		color: #111827;
	}

	.toolbar {
		display: flex;
		gap: 0.5rem;
		align-self: flex-start;
		margin-bottom: 0.5rem;
	}

	.btn {
		border-radius: 0.75rem;
		padding: 0.4rem 0.9rem;
		font-size: 0.85rem;
		border: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.btn.secondary {
		background: #e5e7eb;
		color: #111827;
	}

	.btn.secondary:hover:enabled {
		background: #d1d5db;
	}

	.btn.secondary:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.btn.active {
		background: #fecaca;
		color: #991b1b;
	}

	/* Fixed-size image area – grid stretches to fill it */

	.design-area {
		position: relative;
		width: 900px;
		height: 520px;
		max-width: 100%;
		overflow: hidden;

		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;

		border-radius: 1rem;
		border: 2px solid #22c55e;
		padding: 6px;
		box-shadow:
			0 20px 40px rgba(15, 23, 42, 0.08),
			inset 0 0 0 1px rgba(16, 185, 129, 0.25);
		background-color: #ecfdf5;
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
		background: rgba(249, 250, 251, 0.35);
		border-radius: 0.35rem;
		border: 1px solid rgba(34, 197, 94, 0.45);
	}

	.placed-asset {
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		border-radius: 0.35rem;
		box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
		transition: transform 0.15s ease;
	}

	.hint {	
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 0.75rem;
		align-self: flex-start;
	}

.design-area {
    position: relative;
    width: 900px;
    height: 520px;
    /* REMOVE max-width if you want it truly fixed */
    /* max-width: 100%; */
    overflow: hidden;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    border-radius: 1.1rem;
    border: 2px solid rgba(34, 197, 94, 0.6);
    padding: 6px;
    box-shadow:
        0 20px 40px rgba(15, 23, 42, 0.85),
        inset 0 0 0 1px rgba(16, 185, 129, 0.25);
    background-color: #022c22;
}

/* keep the rest of the media query but drop the .design-area override */
@media (max-width: 900px) {
    .designer-page {
        grid-template-columns: 1fr;
        padding: 1.25rem 1rem;
    }

    /* DELETE this block:
    .design-area {
        width: 100%;
        height: auto;
        aspect-ratio: 900 / 520;
    }
    */
}

</style>
