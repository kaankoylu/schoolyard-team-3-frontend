<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/Overview_designs_main.css';

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
			if (!res.ok) throw new Error(`Failed to load classes (${res.status})`);
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
			if (!res.ok) throw new Error(`Failed to load designs (${res.status})`);

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
			error = e?.message ?? 'Could not load designs.';
		} finally {
			loading = false;
		}
	}

	function getClassName(design: Design) {
		return (
			design.schoolClass?.name ??
			design.school_class?.name ??
			(design.class_id ? `Class #${design.class_id}` : '—')
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
				<h1 class="title">Student designs</h1>
				<p class="subtitle">Overview of all saved layouts. Leave quick, kid-friendly feedback.</p>

				<!-- ✅ FILTER BAR -->
				<div class="filters">
					<label class="filterLabel" for="classFilter">Filter class</label>
					<select
						id="classFilter"
						class="select"
						bind:value={selectedClassId}
						disabled={classesLoading || classes.length === 0}
					>
						<option value="all">All classes</option>
						{#each classes as cls}
							<option value={cls.id}>{cls.name}</option>
						{/each}
					</select>

					<span class="countPill">{filteredDesigns.length} shown</span>
				</div>
			</div>

			<a href="/dashboard/teacher" class="backlink">← Back to teacher dashboard</a>
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
				<div class="emptyTitle">No designs yet</div>
				<div class="emptyText">
					{#if selectedClassId === 'all'}
						Ask students to save their design first. It will show up here automatically.
					{:else}
						No designs found for this class yet.
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
								<h2 class="cardTitle">Design #{design.id}</h2>
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
								<div><span class="metaKey">Class</span> {getClassName(design)}</div>

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
								<label class="label">Teacher feedback</label>
								<textarea
									class="textarea"
									rows="3"
									bind:value={feedbackByDesign[design.id]}
									placeholder="Write short, kid-friendly feedback…"
								></textarea>
								<div class="hint">Keep it short: 1–2 sentences is enough.</div>
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
									Open design →
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>
