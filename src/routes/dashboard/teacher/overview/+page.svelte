<script lang="ts">
	import { onMount } from 'svelte';
	// import '$lib/styles/Overview_designs_main.css'; TEMPRORILY UNACTIVE FOR BLINKNING BUG

	const API_BASE = 'http://localhost';

	type PlacedAsset = {
		instanceId?: number;
		row?: number;
		col?: number;
		width?: number;
		height?: number;
		label?: string;
		asset?: {
			label?: string;
			width?: number;
			height?: number;
			image?: string;
		};
		[key: string]: any;
	};

	type SchoolClass = {
		id: number;
		name: string;
		active_code?: { code: string } | null;
		activeCode?: { code: string } | null;
		[key: string]: any;
	};

	type Design = {
		id: number;
		rows?: number;
		cols?: number;
		backgroundImage?: string | null;
		background_image?: string | null;
		created_at?: string;

		// student info
		class_id?: number | null;
		student_name?: string | null;

		// optional if you still return it
		class_code?: string | null;

		// relation from backend (could be snake_case or camelCase)
		schoolClass?: { id?: number; name?: string } | null;
		school_class?: { id?: number; name?: string } | null;

		placedAssets?: PlacedAsset[];
		placed_assets?: PlacedAsset[];

		feedback?: string | null;
		[key: string]: any;
	};

	let designs: Design[] = [];
	let loading = true;
	let error = '';

	// classes for filter
	let classes: SchoolClass[] = [];
	let classesLoading = true;
	let selectedClassId: number | 'all' = 'all';

	// simple feedback state (per design)
	let feedbackByDesign: Record<number, string> = {};
	let savingFor: number | null = null;

	onMount(async () => {
		await Promise.all([loadClasses(), loadDesigns()]);
	});

	async function loadClasses() {
		classesLoading = true;
		try {
			const res = await fetch(`${API_BASE}/api/classes`);
			if (!res.ok) throw new Error(`Kan klassen niet laden (${res.status})`);
			const data = await res.json();
			classes = Array.isArray(data) ? data : [];
		} catch (e: any) {
			console.error(e);
			classes = [];
		} finally {
			classesLoading = false;
		}
	}

	async function loadDesigns() {
		loading = true;
		error = '';

		try {
			const res = await fetch(`${API_BASE}/api/designs`);
			if (!res.ok) throw new Error(`Kan ontwerpen niet laden (${res.status})`);

			const data = await res.json();
			const raw = Array.isArray(data) ? data : data.data ?? [];

			// normalize placedAssets + feedback + background field
			designs = raw.map((d: Design) => ({
				...d,
				backgroundImage: d.backgroundImage ?? d.background_image ?? null,
				placedAssets: (d.placedAssets ?? d.placed_assets ?? []) as PlacedAsset[],
				feedback: d.feedback ?? null
			}));

			// preload existing feedback
			feedbackByDesign = designs.reduce<Record<number, string>>((acc, d) => {
				acc[d.id] = d.feedback ?? '';
				return acc;
			}, {});
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Kan ontwerpen niet laden';
		} finally {
			loading = false;
		}
	}

	function getClassName(design: Design) {
		return (
			design.schoolClass?.name ??
			design.school_class?.name ??
			(design.class_id ? `Klas #${design.class_id}` : '—')
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

	// filtered list
	$: filteredDesigns =
		selectedClassId === 'all'
			? designs
			: designs.filter((d) => Number(d.class_id) === Number(selectedClassId));

	async function submitFeedback(designId: number) {
		const text = feedbackByDesign[designId]?.trim();
		if (!text) return;

		savingFor = designId;

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

			// keep local copy in sync
			designs = designs.map((d) => (d.id === designId ? { ...d, feedback: text } : d));
		} catch (err) {
			console.error(err);
			alert('Netwerkfout bij opslaan van feedback.');
		} finally {
			savingFor = null;
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
				<h1 class="title">Studenten ontwerpen</h1>
				<p class="subtitle">Overzicht van alle opgeslagen ontwerpen, laat snelle kind vriendelijke feedback achter.</p>

				<!-- ✅ FILTER BAR -->
				<div class="filters">
					<label class="filterLabel" for="classFilter">Filter door klassen</label>
					<select
						id="classFilter"
						class="select"
						bind:value={selectedClassId}
						disabled={classesLoading || classes.length === 0}
					>
						<option value="all">Alle klassen</option>
						{#each classes as cls}
							<option value={cls.id}>{cls.name}</option>
						{/each}
					</select>

					<span class="countPill">{filteredDesigns.length} Laat zien</span>
				</div>
			</div>

			<a href="/dashboard/teacher" class="backlink">← Terug naar docenten dashboard</a>
		</header>

		{#if loading}
			<div class="state">
				<div class="skeleton"></div>
				<div class="skeleton"></div>
				<div class="skeleton"></div>
			</div>
		{:else if error}
			<div class="state error">{error}</div>
		{:else if filteredDesigns.length === 0}
			<div class="state empty">
				<div class="emptyTitle">Er zijn nog geen ontwerpen</div>
				<div class="emptyText">
					{#if selectedClassId === 'all'}
						Vraag de studenten om hun ontwerpen op te slaan, vervolgens kun jij ze automatisch hier bekijken.
					{:else}
						Er zijn nog geen ontwerpen voor deze klas. 
					{/if}
				</div>
			</div>
		{:else}
			<div class="grid">
				{#each filteredDesigns as design}
					<article class="card">
						<!-- preview -->
						<div class="preview">
							<div
								class="previewBg"
								style={`background-image: url('${
									design.backgroundImage ??
									'/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg'
								}')`}
							>
								<div class="previewOverlay" aria-hidden="true"></div>

								{#if design.rows && design.cols}
									<div
										class="miniGrid"
										style={`grid-template-columns: repeat(${design.cols}, 1fr); grid-template-rows: repeat(${design.rows}, 1fr);`}
									>
										{#if design.placedAssets && design.placedAssets.length > 0}
											{#each design.placedAssets as item}
												<div
													class="miniItem"
													title={item.label ?? item.asset?.label}
													style={`grid-column: ${(item.col ?? 0) + 1} / span ${
														item.width ?? item.asset?.width ?? 1
													}; grid-row: ${(item.row ?? 0) + 1} / span ${
														item.height ?? item.asset?.height ?? 1
													};`}
												></div>
											{/each}
										{/if}
									</div>
								{/if}

								<!-- top badges -->
								<div class="badges">
									<span class="badge">#{design.id}</span>
									{#if design.feedback}
										<span class="badge ok">Feedback ✔</span>
									{/if}
								</div>
							</div>
						</div>

						<div class="content">
							<div class="row">
								<h2 class="cardTitle">Ontwerp #{design.id}</h2>
								{#if design.created_at}
									<span class="date">{shortDate(design.created_at)}</span>
								{/if}
							</div>

							<!-- meta -->
							<div class="meta">
								{#if design.rows && design.cols}
									<div><span class="metaKey">Grid</span> {design.rows} × {design.cols}</div>
								{/if}

								<!-- ✅ show class NAME -->
								<div><span class="metaKey">Klas</span> {getClassName(design)}</div>

								{#if design.student_name}
									<div><span class="metaKey">Student</span> {design.student_name}</div>
								{/if}
								{#if design.placedAssets && design.placedAssets.length}
									<div><span class="metaKey">Items</span> {design.placedAssets.length}</div>
								{/if}
							</div>

							<!-- chips -->
							{#if design.placedAssets && design.placedAssets.length}
								<div class="chips">
									{#each groupAssetsByLabel(design.placedAssets) as group}
										<span class="chip">{group.label} × {group.count}</span>
									{/each}
								</div>
							{/if}

							<!-- feedback -->
							<div class="feedback">
								<label class="label">Feedback van docent</label>
								<textarea
									class="textarea"
									rows="3"
									bind:value={feedbackByDesign[design.id]}
									placeholder="Write short, kid-friendly feedback…"
								></textarea>
								<div class="hint">Hou het kort, 1 a 2 zinnen is genoeg.</div>
							</div>

							<div class="actions">
								<button
									class="btnPrimary"
									on:click={() => submitFeedback(design.id)}
									disabled={savingFor === design.id}
								>
									{savingFor === design.id ? 'Saving…' : 'Save feedback'}
								</button>

								<a href={`/dashboard/teacher/overview/${design.id}`} class="link">
									Open ontwerp →
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>
<style>
	.page {
		min-height: 100vh;
		padding: 28px 16px 44px;
		background:
			radial-gradient(900px 520px at 15% 10%, rgba(59, 130, 246, 0.10), transparent 55%),
			radial-gradient(900px 520px at 90% 0%, rgba(34, 197, 94, 0.10), transparent 55%),
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
	}

	/* ✅ filter bar */
	.filters {
		margin-top: 8px;
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.filterLabel {
		font-size: 12px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.75);
	}

	.select {
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid rgba(15, 23, 42, 0.14);
		background: rgba(255, 255, 255, 0.92);
		font-size: 12px;
		font-weight: 800;
		color: rgba(15, 23, 42, 0.78);
		min-width: 180px;
	}

	.select:focus {
		outline: none;
		border-color: rgba(16, 185, 129, 0.45);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
	}

	.countPill {
		display: inline-flex;
		align-items: center;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.72);
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(15, 23, 42, 0.10);
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
	.backlink:hover {
		background: rgba(255, 255, 255, 0.9);
		transform: translateY(-1px);
	}
	.backlink:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
	}

	/* Grid of cards */
	.grid {
		display: grid;
		gap: 18px;
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}

	@media (min-width: 768px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: 18px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		transition: transform 140ms ease, box-shadow 160ms ease;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 18px 50px rgba(15, 23, 42, 0.10);
	}

	.preview {
		height: 140px;
		background: rgba(15, 23, 42, 0.04);
	}

	.previewBg {
		position: relative;
		height: 100%;
		width: 100%;
		background-size: cover;
		background-position: center;
	}

	.previewOverlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.12) 100%),
			radial-gradient(600px 240px at 20% 10%, rgba(59, 130, 246, 0.20), transparent 60%),
			radial-gradient(600px 240px at 90% 10%, rgba(34, 197, 94, 0.14), transparent 55%);
	}

	.miniGrid {
		position: absolute;
		inset: 8px;
		display: grid;
		gap: 1px;
		border-radius: 12px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.22);
	}

	.miniItem {
		border-radius: 2px;
		background: rgba(16, 185, 129, 0.72);
		border: 1px solid rgba(6, 95, 70, 0.35);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.badges {
		position: absolute;
		top: 10px;
		left: 10px;
		display: flex;
		gap: 6px;
		z-index: 2;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.78);
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(15, 23, 42, 0.10);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.badge.ok {
		color: rgba(4, 120, 87, 1);
		background: rgba(16, 185, 129, 0.14);
		border-color: rgba(16, 185, 129, 0.22);
	}

	.content {
		padding: 14px;
		display: grid;
		gap: 10px;
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
	}

	.cardTitle {
		margin: 0;
		font-size: 14px;
		font-weight: 900;
		color: rgba(15, 23, 42, 0.85);
	}

	.date {
		font-size: 11px;
		color: rgba(15, 23, 42, 0.55);
		white-space: nowrap;
	}

	.meta {
		display: grid;
		gap: 4px;
		font-size: 11px;
		color: rgba(15, 23, 42, 0.62);
	}

	.metaKey {
		font-weight: 900;
		color: rgba(15, 23, 42, 0.70);
		margin-right: 6px;
	}

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
		background: rgba(16, 185, 129, 0.10);
		color: rgba(4, 120, 87, 1);
		border: 1px solid rgba(16, 185, 129, 0.22);
	}

	.feedback {
		display: grid;
		gap: 6px;
	}

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
		transition: border-color 140ms ease, box-shadow 140ms ease;
	}
	.textarea:focus {
		outline: none;
		border-color: rgba(16, 185, 129, 0.45);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.20);
	}

	.hint {
		font-size: 11px;
		color: rgba(15, 23, 42, 0.50);
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 2px;
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

	.link {
		font-size: 12px;
		font-weight: 900;
		color: rgba(5, 150, 105, 1);
		text-decoration: none;
	}
	.link:hover {
		text-decoration: underline;
	}

	/* States */
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
		border-color: rgba(15, 23, 42, 0.10);
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
			rgba(15, 23, 42, 0.10),
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
		.actions {
			flex-direction: column;
			align-items: stretch;
		}
		.btnPrimary {
			width: 100%;
		}
		.link {
			text-align: center;
		}
	}
</style>
