<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import '$lib/styles/Review_design_style.css';

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

	//for grading feature
	let grade: number | null = null;
	let savingGrade = false;

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
			grade = normalized.grade ?? null;
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Could not load this design.';
		} finally {
			loading = false;
		}
	});

	function getClassName(d: Design) {
		return (
			d.schoolClass?.name ?? d.school_class?.name ?? (d.class_id ? `Class #${d.class_id}` : '—')
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

		if (rotation === 90 || rotation === 270) {
			return { width: baseHeight, height: baseWidth };
		}

		return { width: baseWidth, height: baseHeight };
	}

	function getPlacedImageUrl(item: PlacedAsset) {
		// Best-case: you stored image_url in placedAssets when saving
		const url = item.image_url ?? item.asset?.image_url ?? item.asset?.image ?? null;

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

	async function saveGrade(value: number) {
		if (!design) return;

		grade = value;
		savingGrade = true;

		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}/grade`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ grade: value })
			});

			if (!res.ok) {
				throw new Error('Failed to save grade');
			}
		} catch (err) {
			console.error(err);
			alert('Failed to save grade');
		} finally {
			savingGrade = false;
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

						<h2 class="sideTitle">Grade</h2>
						<p class="sideHint">Click to rate this design</p>
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

					<div class="starRow">
						{#each [1, 2, 3, 4, 5] as star}
							<button
								type="button"
								class="star {grade !== null && grade >= star ? 'active' : ''}"
								on:click={() => (grade = star)}
								disabled={savingGrade}
							>
								★
							</button>
						{/each}
					</div>
					{#if grade !== null}
						<p class="gradeText">Grade: <strong>{grade} / 5</strong></p>
					{/if}
					<button
						class="btnPrimary mt-2"
						on:click={() => grade !== null && saveGrade(grade)}
						disabled={savingGrade || grade === null}
					>
						{savingGrade ? 'Saving…' : 'Save grade'}
					</button>
				</aside>
			</div>
		{/if}
	</div>
</div>