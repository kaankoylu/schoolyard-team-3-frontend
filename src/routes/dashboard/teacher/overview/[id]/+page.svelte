<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import { showAlert } from '$lib/utils/alert';

	const API_BASE = 'http://localhost';
	const ASSET_BASE = API_BASE;

	type PlacedAsset = {
		instanceId?: number;
		row?: number;
		col?: number;
		width?: number;
		height?: number;
		label?: string;
		rotation?: number;

		// optional if you still ever send nested asset (you usually don't)
		asset?: {
			label?: string;
			width?: number;
			height?: number;
			image?: string;
			image_url?: string;
		};

		// if you store these (recommended)
		assetId?: number;
		image_url?: string;

		[key: string]: any;
	};

	type Design = {
		id: number;
		rows?: number;
		cols?: number;

		backgroundImage?: string | null;
		background_image?: string | null;

		placedAssets?: PlacedAsset[];
		placed_assets?: PlacedAsset[];

		created_at?: string;

		class_id?: number | null;
		student_name?: string | null;

		// relation from backend (snake/camel)
		schoolClass?: { id?: number; name?: string } | null;
		school_class?: { id?: number; name?: string } | null;

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
				backgroundImage: data.backgroundImage ?? data.background_image ?? null,
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

	function getClassName(d: Design) {
		return d.schoolClass?.name ?? d.school_class?.name ?? (d.class_id ? `Class #${d.class_id}` : '—');
	}

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

	function getPlacedImageUrl(item: PlacedAsset) {
		// Best-case: you stored image_url in placedAssets when saving
		const url =
			item.image_url ??
			item.asset?.image_url ??
			item.asset?.image ??
			null;

		if (!url) return '/placeholder.png';

		// If backend returns "/storage/...." make it absolute
		if (url.startsWith('http://') || url.startsWith('https://')) return url;
		return `${ASSET_BASE}${url}`;
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

			showAlert(`Feedback opgeslagen 👍`, 'success', 3000); 


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

<div class="page">
	<div class="container">
		<header class="topbar">
			<div class="topbarLeft">
				<a href="/dashboard/teacher/overview" class="backlink">← Back to designs overview</a>

				<h1 class="title">Student design #{designId}</h1>

				{#if design && design.created_at}
					<p class="subtitle">Saved at {shortDate(design.created_at)}</p>
				{/if}
			</div>
		</header>

		{#if loading}
			<div class="state">
				<div class="skeleton"></div>
				<div class="skeleton"></div>
				<div class="skeleton"></div>
			</div>
		{:else if error}
			<div class="state error">{error}</div>
		{:else if !design}
			<div class="state empty">
				<div class="emptyTitle">Design not found</div>
				<div class="emptyText">The design may have been deleted, or the link is wrong.</div>
			</div>
		{:else}
			<div class="layout">
				<section class="card">
					<div class="cardHeader">
						<div class="cardHeaderLeft">
							<h2 class="cardTitle">Layout preview</h2>
							<p class="cardHint">Read-only preview of the student’s saved design.</p>
						</div>

						<button type="button" class="toggleBtn" on:click={() => (softGrid = !softGrid)}>
							{softGrid ? 'Grid: strong' : 'Grid: translucent'}
						</button>
					</div>

					<!-- ✅ SAME SIZE AS ORIGINAL -->
					<div class="previewFrame">
						<div
							class="previewBg"
							style={`background-image: url('${
								design.backgroundImage ??
								'/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg'
							}')`}
						></div>
						<div class="previewOverlay" aria-hidden="true"></div>

						{#if design.rows && design.cols}
							<div
								class="lockedGrid"
								style={`grid-template-columns: repeat(${design.cols}, minmax(0, 1fr)); grid-template-rows: repeat(${design.rows}, minmax(0, 1fr)); gap: 2px;`}
							>
								{#each Array.from({ length: design.rows * design.cols }) as _, i}
									<div class="cell" style={`opacity: ${softGrid ? 0.25 : 0.9};`} />
								{/each}

								{#if design.placedAssets && design.placedAssets.length > 0}
									{#each design.placedAssets as item (item.instanceId ?? `${item.row}-${item.col}-${item.label}`)}
										{@const size = getRotatedSize(item)}
										<div
											class="placed"
											title={item.label ?? item.asset?.label}
											style={`grid-column: ${(item.col ?? 0) + 1} / span ${
												size.width
											}; grid-row: ${(item.row ?? 0) + 1} / span ${size.height}; background-image: url('${getPlacedImageUrl(
												item
											)}'); background-size: cover; background-position: center; transform: rotate(${
												item.rotation ?? 0
											}deg);`}
										/>
									{/each}
								{/if}
							</div>
						{/if}
					</div>

					<div class="metaGrid">
						<div class="metaBlock">
							<div class="metaTitle">Details</div>
							<p><span class="metaKey">Design ID</span> {design.id}</p>
							{#if design.rows && design.cols}
								<p><span class="metaKey">Grid</span> {design.rows} × {design.cols}</p>
							{/if}

							<!-- ✅ Class name instead of code -->
							<p><span class="metaKey">Class</span> {getClassName(design)}</p>

							{#if design.student_name}
								<p><span class="metaKey">Student</span> {design.student_name}</p>
							{/if}
						</div>

						<div class="metaBlock">
							<div class="metaTitle">Asset overview</div>
							{#if design.placedAssets && design.placedAssets.length > 0}
								<p><span class="metaKey">Total items</span> {design.placedAssets.length}</p>
								<div class="chips">
									{#each groupAssetsByLabel(design.placedAssets) as group}
										<span class="chip">{group.label} × {group.count}</span>
									{/each}
								</div>
							{:else}
								<p class="muted">No placed items stored in this design.</p>
							{/if}
						</div>
					</div>
				</section>

				<aside class="side">
					<div class="sideHeader">
						<h2 class="sideTitle">Teacher feedback</h2>
						<p class="sideHint">
							Short and concrete works best. Example:
							<em>“Nice use of trees in the corners, maybe add benches near the field.”</em>
						</p>
					</div>

					<textarea
						class="textarea"
						rows="10"
						bind:value={feedbackText}
						placeholder="Write your feedback here…"
					></textarea>

					<button class="btnPrimary" on:click={saveFeedback} disabled={savingFeedback}>
						{savingFeedback ? 'Saving…' : 'Save feedback'}
					</button>
				</aside>
			</div>
		{/if}
	</div>
</div>

<style>
	/* your original CSS unchanged */
	.page {
		min-height: 100vh;
		padding: 28px 16px 44px;
		background:
			radial-gradient(900px 520px at 15% 10%, rgba(59, 130, 246, 0.1), transparent 55%),
			radial-gradient(900px 520px at 90% 0%, rgba(34, 197, 94, 0.1), transparent 55%),
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

	.topbarLeft {
		display: grid;
		gap: 6px;
	}

	.backlink {
		width: fit-content;
		font-size: 13px;
		color: rgba(15, 23, 42, 0.72);
		text-decoration: none;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transition: transform 120ms ease, background-color 160ms ease;
	}
	.backlink:hover {
		background: rgba(255, 255, 255, 0.9);
		transform: translateY(-1px);
	}
	.backlink:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
	}

	.title {
		margin: 0;
		font-size: 22px;
		letter-spacing: -0.02em;
		font-weight: 900;
		color: #0f172a;
	}

	.subtitle {
		margin: 0;
		font-size: 12px;
		color: rgba(15, 23, 42, 0.55);
	}

	.layout {
		display: grid;
		gap: 18px;
		grid-template-columns: 1fr;
	}

	@media (min-width: 1024px) {
		.layout {
			grid-template-columns: 2fr 1fr;
			align-items: start;
		}
	}

	.card {
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		padding: 14px;
		display: grid;
		gap: 14px;
	}

	.cardHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.cardHeaderLeft {
		display: grid;
		gap: 4px;
	}

	.cardTitle {
		margin: 0;
		font-size: 13px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(15, 23, 42, 0.72);
		font-weight: 900;
	}

	.cardHint {
		margin: 0;
		font-size: 12px;
		color: rgba(15, 23, 42, 0.55);
	}

	.toggleBtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 10px;
		border-radius: 12px;
		border: 1px solid rgba(16, 185, 129, 0.22);
		background: rgba(16, 185, 129, 0.1);
		color: rgba(4, 120, 87, 1);
		font-size: 12px;
		font-weight: 900;
		cursor: pointer;
		transition: transform 120ms ease, background-color 160ms ease, box-shadow 160ms ease;
	}
	.toggleBtn:hover {
		background: rgba(16, 185, 129, 0.14);
		transform: translateY(-1px);
	}
	.toggleBtn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
	}

	.previewFrame {
		position: relative;
		height: 420px;
		width: 100%;
		overflow: hidden;
		border-radius: 18px;
		border: 1px solid rgba(16, 185, 129, 0.26);
		background: rgba(15, 23, 42, 0.04);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
	}

	.lockedGrid {
		position: relative;
		z-index: 1;
		margin: 12px;
		height: calc(100% - 24px);
		width: calc(100% - 24px);
		display: grid;
	}

	.previewBg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		filter: saturate(1.02) contrast(1.02);
	}

	.previewOverlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.1) 100%),
			radial-gradient(700px 300px at 20% 10%, rgba(59, 130, 246, 0.16), transparent 60%),
			radial-gradient(700px 300px at 90% 10%, rgba(34, 197, 94, 0.12), transparent 55%);
	}

	.cell {
		border-radius: 6px;
		border: 1px solid rgba(16, 185, 129, 0.35);
		background: rgba(16, 185, 129, 0.08);
	}

	.placed {
		border-radius: 8px;
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.25);
		background-color: rgba(255, 255, 255, 0.2);
	}

	.metaGrid {
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr;
	}

	@media (min-width: 640px) {
		.metaGrid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.metaBlock {
		border-radius: 16px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		background: rgba(248, 250, 252, 0.75);
		padding: 12px;
		font-size: 12px;
		color: rgba(15, 23, 42, 0.65);
		display: grid;
		gap: 6px;
	}

	.metaTitle {
		font-weight: 900;
		color: rgba(15, 23, 42, 0.78);
	}

	.metaKey {
		font-weight: 900;
		color: rgba(15, 23, 42, 0.7);
		margin-right: 8px;
	}

	.muted {
		color: rgba(15, 23, 42, 0.55);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 900;
		background: rgba(16, 185, 129, 0.1);
		color: rgba(4, 120, 87, 1);
		border: 1px solid rgba(16, 185, 129, 0.22);
	}

	.side {
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		padding: 14px;
		display: grid;
		gap: 10px;
		position: sticky;
		top: 16px;
		align-self: start;
	}

	.sideHeader {
		display: grid;
		gap: 6px;
	}

	.sideTitle {
		margin: 0;
		font-size: 13px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(15, 23, 42, 0.72);
		font-weight: 900;
	}

	.sideHint {
		margin: 0;
		font-size: 12px;
		color: rgba(15, 23, 42, 0.55);
	}

	.textarea {
		width: 100%;
		resize: none;
		border-radius: 14px;
		border: 1px solid rgba(15, 23, 42, 0.14);
		padding: 10px 10px;
		font-size: 12px;
		line-height: 1.4;
		background: rgba(255, 255, 255, 0.92);
		transition: border-color 140ms ease, box-shadow 140ms ease;
	}
	.textarea:focus {
		outline: none;
		border-color: rgba(16, 185, 129, 0.45);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
	}

	.btnPrimary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 10px 12px;
		border-radius: 14px;
		border: 1px solid rgba(16, 185, 129, 0.45);
		background: rgba(16, 185, 129, 0.95);
		color: #fff;
		font-size: 12px;
		font-weight: 900;
		cursor: pointer;
		transition: transform 120ms ease, filter 160ms ease, box-shadow 160ms ease;
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.22);
	}
	.btnPrimary:hover {
		filter: brightness(1.02);
		transform: translateY(-1px);
	}
	.btnPrimary:active {
		transform: translateY(0px);
	}
	.btnPrimary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		box-shadow: none;
	}

	.state {
		padding: 12px;
		border-radius: 16px;
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
		font-weight: 900;
	}
	.state.empty {
		border-style: solid;
		border-color: rgba(15, 23, 42, 0.1);
	}

	.emptyTitle {
		font-weight: 900;
		color: rgba(15, 23, 42, 0.78);
	}
	.emptyText {
		font-size: 12px;
		color: rgba(15, 23, 42, 0.55);
	}

	.skeleton {
		height: 12px;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			rgba(15, 23, 42, 0.06),
			rgba(15, 23, 42, 0.1),
			rgba(15, 23, 42, 0.06)
		);
		background-size: 200% 100%;
		animation: shimmer 1.1s infinite linear;
	}
	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (max-width: 520px) {
		.side {
			position: static;
		}
	}
</style>
