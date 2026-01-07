<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

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

	let softGrid = false;

	let grade: number | null = null;
	let savingGrade = false;

	onMount(async () => {
		const idFromRoute = Number(get(page).params.id);
		designId = idFromRoute;

		if (!designId || Number.isNaN(designId)) {
			error = 'Ongeldige ontwerp ID in URL';
			loading = false;
			return;
		}

		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}`);

			if (!res.ok) {
				throw new Error(`Er is iets fout gegaan met het laden (${res.status})`);
			}

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

	function getClassName(d: Design) {
		return d.schoolClass?.name ?? d.school_class?.name ?? (d.class_id ? `Klas #${d.class_id}` : '—');
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
		if (!url) return '/placeholder.png';
		if (url.startsWith('http')) return url;
		return `${ASSET_BASE}${url}`;
	}

	async function saveFeedback() {
		const text = feedbackText.trim();
		if (!text) return;

		savingFeedback = true;
		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}/feedback`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			if (!res.ok) throw new Error();
			if (design) design = { ...design, feedback: text };
			alert('Feedback opgeslagen');
		} catch {
			alert('Feedback opslaan mislukt');
		} finally {
			savingFeedback = false;
		}
	}

	function shortDate(date?: string) {
		return date ? new Date(date).toLocaleString() : '';
	}

	function setGrade(value: number) {
		grade = value;
	}

	async function saveGrade() {
		if (grade === null) return;
		savingGrade = true;
		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}/grade`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ grade })
			});
			if (!res.ok) throw new Error();
			if (design) design = { ...design, grade };
			alert('Cijfer opgeslagen');
		} catch {
			alert('Cijfer opslaan mislukt');
		} finally {
			savingGrade = false;
		}
	}
</script>

<div class="page">
	<div class="container">
		<a href="/dashboard/teacher/overview" class="backlink">← Terug</a>

		{#if loading}
			<p>Laden…</p>
		{:else if error}
			<p class="error">{error}</p>
		{:else if design}
			<h1>Student ontwerp #{design.id}</h1>
			<p>{shortDate(design.created_at)}</p>

			<p><strong>Klas:</strong> {getClassName(design)}</p>
			{#if design.student_name}
				<p><strong>Student:</strong> {design.student_name}</p>
			{/if}

			<h3>Assets</h3>
			{#each groupAssetsByLabel(design.placedAssets ?? []) as group}
				<span>{group.label} × {group.count}</span>
			{/each}

			<h3>Beoordeling</h3>
			<div>
				{#each [1,2,3,4,5] as star}
					<button on:click={() => setGrade(star)} class:active={grade && grade >= star}>★</button>
				{/each}
			</div>
			<button on:click={saveGrade} disabled={savingGrade || grade === null}>
				Opslaan
			</button>

			<h3>Feedback</h3>
			<textarea rows="6" bind:value={feedbackText}></textarea>
			<button on:click={saveFeedback} disabled={savingFeedback}>
				Feedback opslaan
			</button>
		{/if}
	</div>
</div>

<style>
	.backlink { display:inline-block; margin-bottom:12px; }
	button.active { color:#facc15; }
	.error { color:red; }
</style>
