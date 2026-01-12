<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import { showAlert } from '$lib/utils/alert';

	/**
	 * ✅ SAME-ORIGIN ONLY
	 * Vite proxy forwards /api and /storage to Laravel.
	 */
	const API_BASE = '';
	const ASSET_BASE = '';

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
			image_url?: string;
		};

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

		schoolClass?: { id?: number; name?: string } | null;
		school_class?: { id?: number; name?: string } | null;

		feedback?: string | null;
		grade?: number | null;

		[key: string]: any;
	};

	let design: Design | null = null;
	let loading = true;
	let error = '';

	let feedbackText = '';
	let savingFeedback = false;

	let designId: number;

	let grade: number | null = null;
	let savingGrade = false;

	function normalizeUrl(url?: string | null) {
		if (!url) return '';

		const u = String(url).trim();

		// absolute URL from backend
		if (u.startsWith('http://') || u.startsWith('https://')) return u;

		// normalize to '/...'
		const path = u.startsWith('/') ? u : `/${u}`;

		// if backend returns '/storage/...', this will become same-origin '/storage/...'
		// (your Vite proxy must forward /storage to Laravel)
		return `${ASSET_BASE}${path}`;
	}

	function getClassName(d: Design) {
		return (
			d.schoolClass?.name ?? d.school_class?.name ?? (d.class_id ? `Klas #${d.class_id}` : '—')
		);
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

		return rotation === 90 || rotation === 270
			? { width: baseHeight, height: baseWidth }
			: { width: baseWidth, height: baseHeight };
	}

	function getPlacedImageUrl(item: PlacedAsset) {
		const url = item.image_url ?? item.asset?.image_url ?? item.asset?.image ?? null;
		return normalizeUrl(url) || '/placeholder.png';
	}

	function shortDate(date?: string) {
		return date ? new Date(date).toLocaleString() : '';
	}

	function setGrade(value: number) {
		grade = value;
	}

	onMount(async () => {
		loading = true;
		error = '';

		const idFromRoute = Number(get(page).params.id);
		designId = idFromRoute;

		if (!designId || Number.isNaN(designId)) {
			error = 'Ongeldige ontwerp ID in URL';
			loading = false;
			return;
		}

		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}`, {
				headers: { Accept: 'application/json' }
			});

			if (!res.ok) throw new Error(`Er is iets fout gegaan met het laden (${res.status})`);

			const data = await res.json();

			const normalized: Design = {
				...data,
				backgroundImage: data.backgroundImage ?? data.background_image ?? null,
				placedAssets: (data.placedAssets ?? data.placed_assets ?? []) as PlacedAsset[],
				feedback: data.feedback ?? null,
				grade: data.grade ?? null
			};

			design = normalized;
			feedbackText = normalized.feedback ?? '';
			grade = normalized.grade ?? null;
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Kan ontwerp niet laden.';
		} finally {
			loading = false;
		}
	});

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
				console.error('Feedback save failed:', res.status, body);
				throw new Error('Feedback opslaan mislukt');
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

	async function saveGrade() {
		if (grade === null) return;

		savingGrade = true;
		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}/grade`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ grade })
			});

			if (!res.ok) {
				const body = await res.text();
				console.error('Grade save failed:', res.status, body);
				throw new Error('Cijfer opslaan mislukt');
			}

			if (design) design = { ...design, grade };
		} catch (e) {
			console.error(e);
			alert('Cijfer opslaan mislukt');
		} finally {
			savingGrade = false;
		}
	}

	const DEFAULT_BG =
		'/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg';

	$: previewBg = normalizeUrl(design?.backgroundImage ?? DEFAULT_BG);
	$: placedList = (design?.placedAssets ?? []) as PlacedAsset[];
	$: grouped = groupAssetsByLabel(placedList);
</script>

<div class="page">
	<div class="container">
		<header class="topbar">
			<a href="/dashboard/teacher/overview" class="backlink">← Terug naar overzicht</a>

			{#if design}
				<div class="titleBlock">
					<h1 class="title">Ontwerp #{design.id}</h1>
					<p class="subtitle">
						<span class="pill">Klas: {getClassName(design)}</span>
						{#if design.student_name}
							<span class="pill">Student: {design.student_name}</span>
						{/if}
						{#if design.created_at}
							<span class="pill muted">{shortDate(design.created_at)}</span>
						{/if}
					</p>
				</div>
			{:else}
				<div class="titleBlock">
					<h1 class="title">Ontwerp</h1>
					<p class="subtitle">Details bekijken en feedback geven.</p>
				</div>
			{/if}
		</header>

		{#if loading}
			<div class="state">
				<div class="skeleton"></div>
				<div class="skeleton"></div>
				<div class="skeleton"></div>
			</div>
		{:else if error}
			<div class="state error">{error}</div>
		{:else if design}
			<div class="layout">
				<!-- LEFT: preview -->
				<section class="card previewCard">
					<div class="cardHeader">
						<h2 class="cardTitle">Preview</h2>
						<div class="metaRight">
							{#if design.rows && design.cols}
								<span class="metaPill">Grid {design.rows}×{design.cols}</span>
							{/if}
							<span class="metaPill">Items {placedList.length}</span>
						</div>
					</div>

					{#if design.rows && design.cols}
						<div
							class="previewGrid"
							style={`--rows:${design.rows}; --cols:${design.cols}; background-image:url('${previewBg}')`}
						>
							<div class="previewOverlay" aria-hidden="true"></div>

							{#each placedList as item}
								<div
									class="previewItem"
									title={item.label ?? item.asset?.label}
									style={`grid-column: ${(item.col ?? 0) + 1} / span ${getRotatedSize(item).width};
			grid-row: ${(item.row ?? 0) + 1} / span ${getRotatedSize(item).height};
			transform: rotate(${item.rotation ?? 0}deg);`}
								>
									<img
										class="previewImg"
										src={getPlacedImageUrl(item)}
										alt={item.label ?? item.asset?.label ?? 'Asset'}
										loading="lazy"
										on:error={(e) => {
											// if image fails, show placeholder clearly
											(e.currentTarget as HTMLImageElement).src = '/placeholder.png';
										}}
									/>
								</div>
							{/each}
						</div>
					{:else}
						<div class="emptyPreview">
							<strong>Geen grid data</strong>
							<p>Dit ontwerp bevat geen rows/cols, dus er is geen preview te tonen.</p>
						</div>
					{/if}
				</section>

				<!-- RIGHT: tools -->
				<aside class="side">
					<section class="card">
						<div class="cardHeader">
							<h2 class="cardTitle">Beoordeling</h2>
							{#if design.grade !== null && design.grade !== undefined}
								<span class="metaPill ok">Opgeslagen: {design.grade}/5</span>
							{/if}
						</div>

						<div class="stars" role="radiogroup" aria-label="Cijfer">
							{#each [1, 2, 3, 4, 5] as star}
								<button
									type="button"
									class="starBtn"
									on:click={() => setGrade(star)}
									class:active={grade !== null && grade >= star}
									aria-label={`Cijfer ${star}`}
								>
									★
								</button>
							{/each}
						</div>

						<button
							class="btnPrimary"
							type="button"
							on:click={saveGrade}
							disabled={savingGrade || grade === null}
						>
							{savingGrade ? 'Opslaan…' : 'Cijfer opslaan'}
						</button>

						<p class="helper">Tip: 3 = goed, 4 = heel goed, 5 = top!</p>
					</section>

					<section class="card">
						<div class="cardHeader">
							<h2 class="cardTitle">Feedback</h2>
							{#if design.feedback}
								<span class="metaPill ok">Feedback ✔</span>
							{/if}
						</div>

						<label class="label" for="feedback">Korte, kindvriendelijke feedback</label>
						<textarea
							id="feedback"
							class="textarea"
							rows="5"
							bind:value={feedbackText}
							placeholder="Bijv: ‘Super goed gedaan! Misschien nog 1 boom bij de bankjes?’"
						/>

						<div class="row">
							<span class="smallHint">Hou het kort: 1–2 zinnen.</span>
							<span class="counter">{feedbackText.trim().length} tekens</span>
						</div>

						<button
							class="btnPrimary"
							type="button"
							on:click={saveFeedback}
							disabled={savingFeedback || !feedbackText.trim()}
						>
							{savingFeedback ? 'Opslaan…' : 'Feedback opslaan'}
						</button>
					</section>

					{#if grouped.length > 0}
						<section class="card">
							<div class="cardHeader">
								<h2 class="cardTitle">Items in dit ontwerp</h2>
								<span class="metaPill">{grouped.length} types</span>
							</div>

							<div class="chips">
								{#each grouped as g}
									<span class="chip">{g.label} × {g.count}</span>
								{/each}
							</div>
						</section>
					{/if}
				</aside>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		padding: 28px 16px 44px;
		background:
			radial-gradient(900px 520px at 15% 10%, rgba(59, 130, 246, 0.1), transparent 55%),
			radial-gradient(900px 520px at 90% 0%, rgba(34, 197, 94, 0.1), transparent 55%),
			linear-gradient(
				180deg,
				rgba(241, 245, 249, 0.65) 0%,
				rgba(248, 250, 252, 1) 55%,
				rgba(241, 245, 249, 0.7) 100%
			);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		gap: 16px;
	}

	/* topbar */
	.topbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.backlink {
		font-size: 13px;
		color: rgba(15, 23, 42, 0.7);
		text-decoration: none;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transition:
			transform 120ms ease,
			background-color 160ms ease;
	}
	.backlink:hover {
		background: rgba(255, 255, 255, 0.9);
		transform: translateY(-1px);
	}
	.backlink:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
	}

	.titleBlock {
		display: grid;
		gap: 6px;
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
		font-size: 13px;
		color: rgba(15, 23, 42, 0.66);
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.72);
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(15, 23, 42, 0.1);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}
	.pill.muted {
		color: rgba(15, 23, 42, 0.55);
	}

	/* layout */
	.layout {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 16px;
		align-items: start;
	}

	@media (max-width: 980px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}

	.side {
		display: grid;
		gap: 16px;
	}

	/* cards */
	.card {
		border-radius: 18px;
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		padding: 14px;
		display: grid;
		gap: 12px;
	}

	.previewCard {
		padding: 14px;
	}

	.cardHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.cardTitle {
		margin: 0;
		font-size: 14px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.85);
	}

	.metaRight {
		display: inline-flex;
		gap: 6px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.metaPill {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.78);
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(15, 23, 42, 0.1);
	}

	.metaPill.ok {
		color: rgba(4, 120, 87, 1);
		background: rgba(16, 185, 129, 0.14);
		border-color: rgba(16, 185, 129, 0.22);
	}

	/* preview grid */
	.previewGrid {
		width: 100%;
		aspect-ratio: 1000 / 520;
		border-radius: 14px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background-size: cover;
		background-position: center;
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), 1fr);
		gap: 2px;
		overflow: hidden;
		position: relative;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
	}

	.previewOverlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.1) 100%),
			radial-gradient(600px 240px at 20% 10%, rgba(59, 130, 246, 0.16), transparent 60%),
			radial-gradient(600px 240px at 90% 10%, rgba(34, 197, 94, 0.12), transparent 55%);
		pointer-events: none;
	}

	.previewItem {
		background-size: cover;
		background-position: center;
		border-radius: 3px;
		box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.18);
		z-index: 1;
	}
	.previewItem {
		z-index: 1;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.1);
	}

	.previewImg {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
	}

	.emptyPreview {
		padding: 18px;
		border-radius: 14px;
		border: 1px dashed rgba(15, 23, 42, 0.18);
		background: rgba(248, 250, 252, 0.85);
		color: rgba(15, 23, 42, 0.72);
	}

	.emptyPreview p {
		margin: 6px 0 0;
		font-size: 12px;
		color: rgba(15, 23, 42, 0.55);
	}

	/* rating */
	.stars {
		display: flex;
		gap: 6px;
	}

	.starBtn {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(255, 255, 255, 0.92);
		cursor: pointer;
		font-size: 18px;
		line-height: 1;
		color: rgba(15, 23, 42, 0.25);
		box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
		transition:
			transform 120ms ease,
			border-color 140ms ease,
			filter 160ms ease;
	}
	.starBtn:hover {
		transform: translateY(-1px);
		border-color: rgba(16, 185, 129, 0.35);
	}
	.starBtn.active {
		color: #facc15;
		border-color: rgba(250, 204, 21, 0.45);
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
		transition:
			transform 120ms ease,
			filter 160ms ease,
			box-shadow 160ms ease,
			opacity 160ms ease;
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.22);
	}
	.btnPrimary:hover:enabled {
		filter: brightness(1.02);
		transform: translateY(-1px);
	}
	.btnPrimary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		box-shadow: none;
	}

	.helper {
		margin: 0;
		font-size: 11px;
		color: rgba(15, 23, 42, 0.55);
	}

	/* feedback */
	.label {
		font-size: 12px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.75);
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
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease;
	}
	.textarea:focus {
		outline: none;
		border-color: rgba(16, 185, 129, 0.45);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.smallHint {
		font-size: 11px;
		color: rgba(15, 23, 42, 0.5);
	}

	.counter {
		font-size: 11px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.55);
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: 999px;
		padding: 4px 10px;
	}

	/* chips */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
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

	/* states */
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
</style>
