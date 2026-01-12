<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	/**
	 * ✅ SAME-ORIGIN ONLY
	 * Vite proxy forwards /api and /storage to Laravel.
	 */
	const API_BASE = '';
	const ASSET_BASE = '';

	// ---------- types ----------
	type PlacedAsset = {
		instanceId?: number;
		row?: number;
		col?: number;
		width?: number;
		height?: number;
		label?: string;
		rotation?: number;

		assetId?: number;
		image_url?: string;

		asset?: {
			label?: string;
			width?: number;
			height?: number;
			image?: string;
			image_url?: string;
		};

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

		feedback?: string | null;
		grade?: number | null;

		likes?: number;
		dislikes?: number;
		score?: number;
		my_reaction?: number | null; // 1, -1, null

		[key: string]: any;
	};

	type LeaderboardRow = {
		id: number;
		student_name?: string | null;
		class_id?: number | null;
		likes?: number;
		dislikes?: number;
		score?: number;
	};

	type Comment = {
		id: number;
		design_id: number;
		student_name: string;
		class_id?: number | null;
		session_id: string;
		text: string;
		created_at: string;
	};

	// ---------- session ----------
	type StudentSession = {
		class_id: number;
		student_name: string;
		code?: string;
		created_at?: number;
		session_id?: string;
	};

	function getOrCreateSessionId(): string {
		const key = 'student_session_id';
		let id = localStorage.getItem(key);
		if (id) return id;

		id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
		localStorage.setItem(key, id);
		return id;
	}

	function getStudentSession(): StudentSession | null {
		try {
			const raw = localStorage.getItem('student_session');
			if (!raw) return null;
			const s = JSON.parse(raw);
			if (!s?.class_id || !s?.student_name) return null;

			const session_id = getOrCreateSessionId();

			return {
				class_id: Number(s.class_id),
				student_name: String(s.student_name),
				code: s?.code ? String(s.code) : undefined,
				created_at: s?.created_at ? Number(s.created_at) : undefined,
				session_id
			};
		} catch {
			return null;
		}
	}

	const DEFAULT_BG = '/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg';

	function normalizeUrl(url?: string | null) {
	if (!url) return '';

	const u = String(url).trim();
	if (!u) return '';

	// already absolute
	if (u.startsWith('http://') || u.startsWith('https://')) return u;

	// force leading slash
	const path = u.startsWith('/') ? u : `/${u}`;

	// same-origin proxy serves /storage and public assets
	return path;
}


	function shortDate(date?: string) {
		return date ? new Date(date).toLocaleString() : '';
	}

	function normalizeDesign(d: any): Design {
		const placed = (d.placedAssets ?? d.placed_assets ?? []) as PlacedAsset[];
		return {
			...d,
			backgroundImage: d.backgroundImage ?? d.background_image ?? null,
			placedAssets: placed,
			feedback: d.feedback ?? null,
			likes: typeof d.likes === 'number' ? d.likes : undefined,
			dislikes: typeof d.dislikes === 'number' ? d.dislikes : undefined,
			score: typeof d.score === 'number' ? d.score : undefined,
			my_reaction: typeof d.my_reaction === 'number' ? d.my_reaction : null
		};
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

	// ---------- state ----------
	let session = getStudentSession();
	let feed: Design[] = [];
	let loading = true;
	let error = '';

	let pageNum = 1;
	let hasMore = true;
	let loadingMore = false;
	const PER_PAGE = 6;

	let leaderboard: LeaderboardRow[] = [];
	let leaderboardLoading = true;

	// ✅ sentinel + observer (fixed)
	let sentinelEl: HTMLDivElement | null = null;
	let obs: IntersectionObserver | null = null;

	// comments drawer
	let commentsOpen = false;
	let commentsLoading = false;
	let commentsError = '';
	let commentsForId: number | null = null;
	let comments: Comment[] = [];
	let newComment = '';
	let postingComment = false;

	// reaction in-flight
	let reactingId: number | null = null;

	// focus view modal
	let focusOpen = false;
	let focusDesign: Design | null = null;

	function openFocus(d: Design) {
		focusDesign = d;
		focusOpen = true;
		document.body.style.overflow = 'hidden';
	}
	function closeFocus() {
		focusOpen = false;
		focusDesign = null;
		document.body.style.overflow = '';
	}

	// ✅ filters
	let filterClass: 'all' | number = 'all';
	let filterUser = '';

	function resetFilters() {
		filterClass = 'all';
		filterUser = '';
	}

	// dropdown values from loaded feed
	$: classOptions = Array.from(
		new Set(feed.map((d) => d.class_id).filter((v): v is number => typeof v === 'number'))
	).sort((a, b) => a - b);

	$: userOptions = Array.from(
		new Set(feed.map((d) => (d.student_name ?? '').trim()).filter((n) => n.length > 0))
	).sort((a, b) => a.localeCompare(b));

	// apply filters client-side
	$: filteredFeed = feed.filter((d) => {
		if (filterClass !== 'all' && (d.class_id ?? null) !== filterClass) return false;
		if (filterUser.trim()) {
			const q = filterUser.trim().toLowerCase();
			const name = (d.student_name ?? '').toLowerCase();
			if (!name.includes(q)) return false;
		}
		return true;
	});

	// ---------- API ----------
	async function fetchFeed(reset = false) {
		if (!session) {
			loading = false;
			error = 'Geen student sessie gevonden. Ga terug en vul je naam + klas in.';
			return;
		}

		if (reset) {
			pageNum = 1;
			hasMore = true;
			feed = [];
		}

		const url = new URL(`${API_BASE}/api/feed`, window.location.origin);
		url.searchParams.set('page', String(pageNum));
		url.searchParams.set('per_page', String(PER_PAGE));
		url.searchParams.set('session_id', session.session_id ?? getOrCreateSessionId());

		const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
		if (!res.ok) throw new Error(`Feed laden mislukt (${res.status})`);

		const data = await res.json();
		const items = Array.isArray(data) ? data : (data.data ?? []);
		const next = items.map(normalizeDesign) as Design[];

		feed = reset ? next : [...feed, ...next];

		if (!Array.isArray(data) && typeof data?.current_page === 'number') {
			hasMore = data.current_page < data.last_page;
		} else {
			hasMore = next.length === PER_PAGE;
		}
	}

	async function fetchLeaderboard() {
		if (!session) return;
		leaderboardLoading = true;

		try {
			const url = new URL(`${API_BASE}/api/leaderboard`, window.location.origin);
			url.searchParams.set('limit', '10');
			const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
			if (!res.ok) throw new Error(`Leaderboard laden mislukt (${res.status})`);
			const data = await res.json();
			leaderboard = Array.isArray(data) ? data : [];
		} catch (e) {
			console.error(e);
			leaderboard = [];
		} finally {
			leaderboardLoading = false;
		}
	}

	async function loadMore() {
		if (!hasMore || loadingMore) return;
		loadingMore = true;
		try {
			pageNum += 1;
			await fetchFeed(false);
		} catch (e) {
			console.error(e);
			hasMore = false;
		} finally {
			loadingMore = false;
		}
	}

	async function react(design: Design, reaction: -1 | 0 | 1) {
		if (!session) return;
		reactingId = design.id;

		const prev = design.my_reaction ?? 0;
		const next = reaction;

		const deltaLike = (prev === 1 ? -1 : 0) + (next === 1 ? 1 : 0);
		const deltaDislike = (prev === -1 ? -1 : 0) + (next === -1 ? 1 : 0);

		const updateLocal = (d: Design) => {
			const likes = (d.likes ?? 0) + deltaLike;
			const dislikes = (d.dislikes ?? 0) + deltaDislike;
			return { ...d, likes, dislikes, score: likes - dislikes, my_reaction: next === 0 ? null : next };
		};

		feed = feed.map((d) => (d.id === design.id ? updateLocal(d) : d));

		if (focusDesign?.id === design.id) focusDesign = updateLocal(focusDesign);

		try {
			const res = await fetch(`${API_BASE}/api/designs/${design.id}/react`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({
					session_id: session.session_id ?? getOrCreateSessionId(),
					class_id: session.class_id,
					reaction
				})
			});
			if (!res.ok) throw new Error('react failed');

			const data = await res.json();

			feed = feed.map((d) =>
				d.id === design.id
					? { ...d, likes: data.likes, dislikes: data.dislikes, score: data.score, my_reaction: reaction === 0 ? null : reaction }
					: d
			);

			if (focusDesign?.id === design.id) {
				focusDesign = {
					...focusDesign,
					likes: data.likes,
					dislikes: data.dislikes,
					score: data.score,
					my_reaction: reaction === 0 ? null : reaction
				};
			}

			fetchLeaderboard();
		} catch (e) {
			// rollback
			feed = feed.map((d) => {
				if (d.id !== design.id) return d;
				const likes = (d.likes ?? 0) - deltaLike;
				const dislikes = (d.dislikes ?? 0) - deltaDislike;
				return { ...d, likes, dislikes, score: likes - dislikes, my_reaction: prev === 0 ? null : prev };
			});

			if (focusDesign?.id === design.id) {
				const likes = (focusDesign.likes ?? 0) - deltaLike;
				const dislikes = (focusDesign.dislikes ?? 0) - deltaDislike;
				focusDesign = { ...focusDesign, likes, dislikes, score: likes - dislikes, my_reaction: prev === 0 ? null : prev };
			}

			alert('Like/dislike opslaan mislukt.');
		} finally {
			reactingId = null;
		}
	}

	async function openComments(designId: number) {
		if (!session) return;

		commentsOpen = true;
		commentsForId = designId;
		commentsLoading = true;
		commentsError = '';
		comments = [];
		newComment = '';

		try {
			const res = await fetch(`${API_BASE}/api/designs/${designId}/comments`, {
				headers: { Accept: 'application/json' }
			});
			if (!res.ok) throw new Error(`Comments laden mislukt (${res.status})`);
			const data = await res.json();
			comments = Array.isArray(data) ? data : [];
		} catch (e: any) {
			console.error(e);
			commentsError = e?.message ?? 'Comments laden mislukt';
		} finally {
			commentsLoading = false;
		}
	}

	function closeComments() {
		commentsOpen = false;
		commentsForId = null;
		comments = [];
		newComment = '';
		commentsError = '';
	}

	async function postComment() {
		if (!session || !commentsForId) return;
		const text = newComment.trim();
		if (!text) return;

		postingComment = true;
		try {
			const res = await fetch(`${API_BASE}/api/designs/${commentsForId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({
					class_id: session.class_id,
					student_name: session.student_name,
					session_id: session.session_id ?? getOrCreateSessionId(),
					text
				})
			});
			if (!res.ok) throw new Error('comment failed');
			const created = (await res.json()) as Comment;
			comments = [created, ...comments];
			newComment = '';
		} catch (e) {
			alert('Comment plaatsen mislukt.');
		} finally {
			postingComment = false;
		}
	}

	function scrollToDesign(id: number) {
		const el = document.getElementById(`design-${id}`);
		el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// ---------- lifecycle ----------
	onMount(async () => {
		session = getStudentSession();

		try {
			loading = true;
			error = '';
			await Promise.all([fetchLeaderboard(), fetchFeed(true)]);
		} catch (e: any) {
			console.error(e);
			error = e?.message ?? 'Laden mislukt';
		} finally {
			loading = false;
		}

		// ensure sentinel is bound before observer setup
		await tick();
	});

	// ✅ FIXED infinite scroll: reactively (re)attach observer once sentinel exists
	$: if (sentinelEl) {
		obs?.disconnect();

		obs = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) loadMore();
			},
			{
				root: null,
				threshold: 0.1,
				rootMargin: '600px 0px' // prefetch earlier, feels smoother
			}
		);

		obs.observe(sentinelEl);
	}

	onDestroy(() => {
		obs?.disconnect();
		document.body.style.overflow = '';
	});
</script>

<div class="page">
	<header class="topbar">
		<div class="brand">
			<div class="logo">🌿</div>
			<div class="brandText">
				<div class="brandTitle">Design Feed</div>
				<div class="brandSub">Like • Dislike • Comments • Leaderboard</div>
			</div>
		</div>

		<div class="me">
			{#if session}
				<span class="pill">Klas {session.class_id}</span>
				<span class="pill">👤 {session.student_name}</span>
			{:else}
				<span class="pill warn">Geen sessie</span>
			{/if}
		</div>
	</header>

	<div class="shell">
		<!-- LEFT: leaderboard (sticky) -->
		<aside class="left">
			<div class="leftSticky">
				<div class="panel">
					<div class="panelHeader">
						<h2>🏆 Top designs</h2>
						<button class="miniBtn" type="button" on:click={fetchLeaderboard} disabled={leaderboardLoading}>
							{leaderboardLoading ? '…' : 'Refresh'}
						</button>
					</div>

					{#if leaderboardLoading}
						<div class="lbLoading">
							<div class="skeleton"></div>
							<div class="skeleton"></div>
							<div class="skeleton"></div>
							<div class="skeleton"></div>
						</div>
					{:else if leaderboard.length === 0}
						<div class="emptySmall">Nog geen leaderboard data.</div>
					{:else}
						<div class="lbList">
							{#each leaderboard as row, i}
								<button class="lbRow" type="button" on:click={() => scrollToDesign(row.id)}>
									<div class="lbLeft">
										<div class="rank">#{i + 1}</div>
										<div class="who">
											<div class="whoTop">Design #{row.id}</div>
											<div class="whoSub">
												{row.student_name ? row.student_name : 'Onbekend'}
												{row.class_id ? ` • Klas ${row.class_id}` : ''}
											</div>
										</div>
									</div>

									<div class="lbRight">
										<div class="score">{row.score ?? 0}</div>
										<div class="likes">👍 {row.likes ?? 0}</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div class="panel hintPanel">
					<div class="hintTitle">Hoe werkt dit?</div>
					<ul class="hintList">
						<li>Gebruik filters bovenaan</li>
						<li>Tap op een design voor grote weergave</li>
						<li>👍 / 👎 om te stemmen</li>
						<li>💬 om comments te lezen/plaatsen</li>
					</ul>
				</div>
			</div>
		</aside>

		<!-- MAIN -->
		<main class="main">
			<!-- ✅ Filters -->
			<div class="filters">
				<div class="filtersLeft">
					<label class="fLabel">
						Klas
						<select
							class="fSelect"
							bind:value={filterClass}
							on:change={(e) => {
								const v = (e.currentTarget as HTMLSelectElement).value;
								filterClass = v === 'all' ? 'all' : Number(v);
							}}
						>
							<option value="all">Alle klassen</option>
							{#each classOptions as c}
								<option value={c}>Klas {c}</option>
							{/each}
						</select>
					</label>

					<label class="fLabel">
						Leerling
						<input
							class="fInput"
							type="text"
							placeholder="Zoek op naam…"
							bind:value={filterUser}
							list="studentNames"
						/>
					</label>

					<datalist id="studentNames">
						{#each userOptions as n}
							<option value={n} />
						{/each}
					</datalist>

					<button class="fBtn" type="button" on:click={resetFilters} disabled={filterClass === 'all' && !filterUser.trim()}>
						Reset
					</button>
				</div>

				<div class="filtersRight">
					<div class="fCount">{filteredFeed.length} / {feed.length} designs</div>
				</div>
			</div>

			{#if loading}
				<div class="state">
					<div class="skeletonBig"></div>
					<div class="skeletonBig"></div>
				</div>
			{:else if error}
				<div class="state error">{error}</div>
			{:else if filteredFeed.length === 0}
				<div class="state empty">
					<div class="emptyTitle">Geen designs gevonden</div>
					<div class="emptyText">Probeer een andere klas of naam.</div>
				</div>
			{:else}
				<div class="igFeed">
					{#each filteredFeed as d (d.id)}
						<article class="igCard" id={`design-${d.id}`}>
							<div class="igHeader">
								<div class="igUser">
									<div class="avatar">🧒</div>
									<div class="igUserMeta">
										<div class="igName">{d.student_name ?? 'User'}</div>
										<div class="igSub">
											Design #{d.id}{d.class_id ? ` • Klas ${d.class_id}` : ''}
										</div>
									</div>
								</div>
								<div class="igTime">{d.created_at ? shortDate(d.created_at) : ''}</div>
							</div>

							<button class="igMedia" type="button" on:click={() => openFocus(d)} aria-label="Open design">
								<div
									class="designGrid"
									style={`--rows:${d.rows ?? 18}; --cols:${d.cols ?? 22}; background-image:url('${normalizeUrl(
										d.backgroundImage ?? DEFAULT_BG
									)}')`}
								>
									<div class="overlay" aria-hidden="true"></div>

									{#if (d.placedAssets ?? []).length > 0}
										{#each (d.placedAssets ?? []) as item (item.instanceId ?? `${item.row}-${item.col}`)}
											<div
												class="placed"
												style={`grid-column:${(item.col ?? 0) + 1} / span ${getRotatedSize(item).width};
													grid-row:${(item.row ?? 0) + 1} / span ${getRotatedSize(item).height};
													transform: rotate(${item.rotation ?? 0}deg);`}
												title={item.label ?? item.asset?.label ?? 'Asset'}
											>
												<img
													src={getPlacedImageUrl(item)}
													alt={item.label ?? item.asset?.label ?? 'Asset'}
													loading="lazy"
													on:error={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.png')}
												/>
											</div>
										{/each}
									{/if}
								</div>
							</button>

							<div class="igActions">
								<button
									class="igAction"
									type="button"
									disabled={reactingId === d.id}
									class:active={d.my_reaction === 1}
									on:click={() => react(d, d.my_reaction === 1 ? 0 : 1)}
								>
									👍
								</button>

								<button
									class="igAction"
									type="button"
									disabled={reactingId === d.id}
									class:active={d.my_reaction === -1}
									on:click={() => react(d, d.my_reaction === -1 ? 0 : -1)}
								>
									👎
								</button>

								<button class="igAction" type="button" on:click={() => openComments(d.id)}>💬</button>

								<div class="igSpacer"></div>

								<button class="igAction soft" type="button" on:click={() => openFocus(d)}>🔍</button>
							</div>

							<div class="igMeta">
								<div class="igCounts">
									<strong>{d.likes ?? 0}</strong> likes • <strong>{d.dislikes ?? 0}</strong> dislikes •
									score <strong>{d.score ?? ((d.likes ?? 0) - (d.dislikes ?? 0))}</strong>
								</div>

								{#if d.feedback}
									<div class="igTeacher">
										<div class="tTitle">Docent feedback</div>
										<div class="tText">{d.feedback}</div>
									</div>
								{/if}

								<button class="igCommentsLink" type="button" on:click={() => openComments(d.id)}>
									Comments bekijken →
								</button>
							</div>
						</article>
					{/each}

					<div class="sentinel" bind:this={sentinelEl}>
						{#if loadingMore}
							<div class="loadingMore">Meer designs laden…</div>
						{:else if hasMore}
							<div class="loadingMore muted">Scroll verder…</div>
						{:else}
							<div class="loadingMore muted">Einde van de feed.</div>
						{/if}
					</div>
				</div>
			{/if}
		</main>
	</div>

	<!-- Focus modal -->
	{#if focusOpen && focusDesign}
		<div class="focusBackdrop" on:click={closeFocus}></div>

		<div class="focusModal" on:click|stopPropagation>
			<div class="focusHeader">
				<div class="focusTitle">
					<span class="chip">Design #{focusDesign.id}</span>
					{#if focusDesign.student_name}
						<span class="chip soft">👤 {focusDesign.student_name}</span>
					{/if}
					{#if focusDesign.class_id}
						<span class="chip soft">Klas {focusDesign.class_id}</span>
					{/if}
				</div>

				<button class="closeBtn" type="button" on:click={closeFocus}>✕</button>
			</div>

			<div class="focusStage">
				<div
					class="designGrid focusGrid"
					style={`--rows:${focusDesign.rows ?? 18}; --cols:${focusDesign.cols ?? 22}; background-image:url('${normalizeUrl(
						focusDesign.backgroundImage ?? DEFAULT_BG
					)}')`}
				>
					<div class="overlay" aria-hidden="true"></div>

					{#if (focusDesign.placedAssets ?? []).length > 0}
						{#each (focusDesign.placedAssets ?? []) as item (item.instanceId ?? `${item.row}-${item.col}`)}
							<div
								class="placed"
								style={`grid-column:${(item.col ?? 0) + 1} / span ${getRotatedSize(item).width};
									grid-row:${(item.row ?? 0) + 1} / span ${getRotatedSize(item).height};
									transform: rotate(${item.rotation ?? 0}deg);`}
								title={item.label ?? item.asset?.label ?? 'Asset'}
							>
								<img
									src={getPlacedImageUrl(item)}
									alt={item.label ?? item.asset?.label ?? 'Asset'}
									loading="lazy"
									on:error={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.png')}
								/>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="focusActions">
				<button
					class="voteBtn"
					type="button"
					disabled={reactingId === focusDesign.id}
					class:active={focusDesign.my_reaction === 1}
					on:click={() => react(focusDesign, focusDesign.my_reaction === 1 ? 0 : 1)}
				>
					👍 <span>{focusDesign.likes ?? 0}</span>
				</button>

				<button
					class="voteBtn"
					type="button"
					disabled={reactingId === focusDesign.id}
					class:active={focusDesign.my_reaction === -1}
					on:click={() => react(focusDesign, focusDesign.my_reaction === -1 ? 0 : -1)}
				>
					👎 <span>{focusDesign.dislikes ?? 0}</span>
				</button>

				<button class="voteBtn" type="button" on:click={() => openComments(focusDesign.id)}>
					💬 Comments
				</button>

				<div class="focusScore">
					Score: <strong>{focusDesign.score ?? ((focusDesign.likes ?? 0) - (focusDesign.dislikes ?? 0))}</strong>
				</div>
			</div>

			{#if focusDesign.feedback}
				<div class="focusTeacher">
					<div class="tTitle">Docent feedback</div>
					<div class="tText">{focusDesign.feedback}</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- COMMENTS DRAWER -->
	{#if commentsOpen}
		<div class="drawerBackdrop" on:click={closeComments}></div>

		<aside class="drawer" on:click|stopPropagation>
			<div class="drawerHeader">
				<div class="drawerTitle">💬 Comments</div>
				<button class="closeBtn" type="button" on:click={closeComments}>✕</button>
			</div>

			{#if commentsLoading}
				<div class="drawerState">
					<div class="skeleton"></div>
					<div class="skeleton"></div>
					<div class="skeleton"></div>
				</div>
			{:else if commentsError}
				<div class="drawerState error">{commentsError}</div>
			{:else}
				<div class="commentComposer">
					<textarea
						class="commentInput"
						rows="3"
						placeholder="Schrijf een korte, aardige comment…"
						bind:value={newComment}
					></textarea>

					<div class="composerRow">
						<div class="composerHint">
							{#if session}
								Je post als {session.student_name}
							{:else}
								—
							{/if}
						</div>
						<button class="sendBtn" type="button" disabled={postingComment || !newComment.trim()} on:click={postComment}>
							{postingComment ? 'Plaatsen…' : 'Plaats'}
						</button>
					</div>
				</div>

				<div class="commentList">
					{#if comments.length === 0}
						<div class="emptySmall">Nog geen comments. Jij bent de eerste 🙂</div>
					{:else}
						{#each comments as c (c.id)}
							<div class="comment">
								<div class="commentTop">
									<div class="name">
										{c.student_name}
										{#if c.class_id}
											<span class="mutedText">• Klas {c.class_id}</span>
										{/if}
									</div>
									<div class="time">{shortDate(c.created_at)}</div>
								</div>
								<div class="text">{c.text}</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</aside>
	{/if}
</div>

<style>
	.page {
		min-height: 100vh;
		background:
			radial-gradient(900px 520px at 15% 10%, rgba(59, 130, 246, 0.10), transparent 55%),
			radial-gradient(900px 520px at 90% 0%, rgba(34, 197, 94, 0.10), transparent 55%),
			linear-gradient(180deg, rgba(241, 245, 249, 0.65) 0%, rgba(248, 250, 252, 1) 55%, rgba(241, 245, 249, 0.7) 100%);
		color: #0f172a;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 14px;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
		background: rgba(255, 255, 255, 0.70);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.brand { display: flex; gap: 10px; align-items: center; }
	.logo {
		width: 34px; height: 34px;
		border-radius: 12px;
		display: grid; place-items: center;
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.20);
		font-weight: 900;
	}
	.brandTitle { font-weight: 950; letter-spacing: -0.02em; }
	.brandSub { font-size: 12px; color: rgba(15, 23, 42, 0.55); }

	.me { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
	.pill {
		display: inline-flex;
		align-items: center;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 900;
		background: rgba(255,255,255,0.85);
		border: 1px solid rgba(15,23,42,0.10);
	}
	.pill.warn {
		background: rgba(254, 226, 226, 0.9);
		border-color: rgba(239, 68, 68, 0.22);
		color: rgba(153, 27, 27, 1);
	}

	.shell {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 14px;
		padding: 14px;
		max-width: 1400px;
		margin: 0 auto;
	}

	@media (max-width: 980px) {
		.shell { grid-template-columns: 1fr; }
		.left { order: 2; }
	}

	.left { display: block; }
	.leftSticky {
		position: sticky;
		top: 78px; /* under topbar */
		display: grid;
		gap: 12px;
		align-content: start;
		max-height: calc(100vh - 92px);
	}

	.panel {
		border-radius: 18px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		padding: 12px;
	}

	.panelHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.panelHeader h2 { margin: 0; font-size: 14px; font-weight: 950; }

	.miniBtn {
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(255,255,255,0.9);
		border-radius: 12px;
		padding: 8px 10px;
		font-size: 12px;
		font-weight: 900;
		cursor: pointer;
	}
	.miniBtn:disabled { opacity: 0.6; cursor: not-allowed; }

	.lbList { display: grid; gap: 8px; max-height: 46vh; overflow: auto; padding-right: 2px; }
	.lbRow {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		text-align: left;
		padding: 10px;
		border-radius: 14px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(248, 250, 252, 0.9);
		cursor: pointer;
	}
	.lbRow:hover { border-color: rgba(16, 185, 129, 0.35); background: rgba(236, 253, 245, 0.9); }
	.lbLeft { display: flex; gap: 10px; align-items: center; min-width: 0; }
	.rank { font-weight: 950; color: rgba(15,23,42,0.75); }
	.whoTop { font-size: 12px; font-weight: 950; }
	.whoSub { font-size: 11px; color: rgba(15,23,42,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
	.lbRight { display: grid; justify-items: end; gap: 2px; }
	.score { font-weight: 950; font-size: 12px; }
	.likes { font-size: 11px; color: rgba(15,23,42,0.6); }

	.hintPanel { background: rgba(255,255,255,0.85); }
	.hintTitle { font-weight: 950; font-size: 13px; margin-bottom: 6px; }
	.hintList { margin: 0; padding-left: 18px; font-size: 12px; color: rgba(15,23,42,0.65); }

	.main { min-height: calc(100vh - 80px); }

	/* ✅ Filters UI */
	.filters {
		position: sticky;
		top: 78px;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 18px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(255,255,255,0.92);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
		margin-bottom: 12px;
	}

	.filtersLeft { display: flex; gap: 10px; align-items: end; flex-wrap: wrap; }
	.filtersRight { display: flex; gap: 10px; align-items: center; }

	.fLabel { display: grid; gap: 6px; font-size: 11px; font-weight: 950; color: rgba(15,23,42,0.65); }
	.fSelect, .fInput {
		border: 1px solid rgba(15,23,42,0.14);
		border-radius: 14px;
		padding: 10px 10px;
		font-size: 12px;
		background: rgba(255,255,255,0.95);
		min-width: 170px;
	}
	.fInput { min-width: 220px; }

	.fBtn {
		border: 1px solid rgba(15,23,42,0.12);
		background: rgba(248,250,252,0.95);
		border-radius: 14px;
		padding: 10px 12px;
		font-size: 12px;
		font-weight: 950;
		cursor: pointer;
	}
	.fBtn:disabled { opacity: 0.6; cursor: not-allowed; }
	.fCount { font-size: 12px; font-weight: 900; color: rgba(15,23,42,0.55); }

	/* IG feed */
	.igFeed { display: grid; gap: 14px; padding-right: 6px; }

	.igCard {
		border-radius: 18px;
		border: 1px solid rgba(15, 23, 42, 0.10);
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 18px 60px rgba(15, 23, 42, 0.10);
		overflow: hidden;
	}

	.igHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-bottom: 1px solid rgba(15,23,42,0.06);
	}

	.igUser { display: flex; align-items: center; gap: 10px; min-width: 0; }
	.avatar {
		width: 34px;
		height: 34px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		background: rgba(59, 130, 246, 0.12);
		border: 1px solid rgba(59, 130, 246, 0.18);
		font-weight: 900;
	}
	.igUserMeta { min-width: 0; }
	.igName { font-size: 13px; font-weight: 950; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px; }
	.igSub { font-size: 11px; color: rgba(15,23,42,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.igTime { font-size: 11px; color: rgba(15,23,42,0.45); white-space: nowrap; }

	.igMedia { display: block; width: 100%; padding: 0; border: 0; background: transparent; cursor: pointer; }

	.designGrid {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		border-top: 1px solid rgba(15,23,42,0.06);
		border-bottom: 1px solid rgba(15,23,42,0.06);
		background-size: cover;
		background-position: center;
		display: grid;
		grid-template-columns: repeat(var(--cols, 22), 1fr);
		grid-template-rows: repeat(var(--rows, 18), 1fr);
		gap: 2px;
		overflow: hidden;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.10) 100%),
			radial-gradient(600px 240px at 20% 10%, rgba(59, 130, 246, 0.16), transparent 60%),
			radial-gradient(600px 240px at 90% 10%, rgba(34, 197, 94, 0.10), transparent 55%);
	}

	.placed {
		z-index: 1;
		border-radius: 4px;
		overflow: hidden;
		background: rgba(255,255,255,0.10);
		border: 1px solid rgba(255,255,255,0.18);
		box-shadow: 0 8px 22px rgba(15, 23, 42, 0.18);
	}
	.placed img { width: 100%; height: 100%; display: block; object-fit: cover; }

	.igActions {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
	}

	.igAction {
		width: 40px;
		height: 40px;
		border-radius: 14px;
		border: 1px solid rgba(15,23,42,0.10);
		background: rgba(255,255,255,0.95);
		cursor: pointer;
		font-size: 18px;
		display: grid;
		place-items: center;
		box-shadow: 0 12px 24px rgba(15,23,42,0.08);
	}
	.igAction.active { border-color: rgba(16, 185, 129, 0.35); background: rgba(236, 253, 245, 0.92); }
	.igAction.soft { border-color: rgba(59,130,246,0.22); background: rgba(239,246,255,0.95); }
	.igAction:disabled { opacity: 0.6; cursor: not-allowed; }
	.igSpacer { flex: 1; }

	.igMeta { padding: 0 12px 12px; display: grid; gap: 10px; }
	.igCounts { font-size: 12px; color: rgba(15,23,42,0.65); }

	.igTeacher {
		border-radius: 14px;
		padding: 10px;
		background: rgba(236, 253, 245, 0.70);
		border: 1px solid rgba(16, 185, 129, 0.18);
	}
	.tTitle { font-weight: 950; font-size: 12px; margin-bottom: 4px; color: rgba(15,23,42,0.75); }
	.tText { font-size: 12px; color: rgba(15,23,42,0.68); }

	.igCommentsLink {
		border: 0;
		background: transparent;
		padding: 0;
		text-align: left;
		color: rgba(37, 99, 235, 0.95);
		font-weight: 900;
		cursor: pointer;
	}

	/* state/skeleton */
	.state {
		padding: 14px;
		border-radius: 18px;
		border: 1px dashed rgba(15, 23, 42, 0.18);
		background: rgba(248, 250, 252, 0.85);
		display: grid;
		gap: 12px;
	}
	.state.error {
		border-style: solid;
		border-color: rgba(239, 68, 68, 0.22);
		background: rgba(239, 68, 68, 0.06);
		color: rgba(185, 28, 28, 1);
		font-weight: 950;
	}
	.state.empty { text-align: center; }
	.emptyTitle { font-weight: 950; }
	.emptyText { font-size: 12px; color: rgba(15,23,42,0.55); }

	.skeleton, .skeletonBig {
		height: 12px;
		border-radius: 999px;
		background: linear-gradient(90deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.10), rgba(15, 23, 42, 0.06));
		background-size: 200% 100%;
		animation: shimmer 1.1s infinite linear;
	}
	.skeletonBig { height: 160px; border-radius: 18px; }
	@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

	.lbLoading { display: grid; gap: 8px; }
	.emptySmall { font-size: 12px; font-weight: 900; color: rgba(15,23,42,0.55); }

	.sentinel { padding: 8px 0 18px; text-align: center; }
	.loadingMore { font-size: 12px; font-weight: 900; color: rgba(15,23,42,0.65); }
	.loadingMore.muted { color: rgba(15,23,42,0.45); }

	/* focus modal */
	.focusBackdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); z-index: 60; }
	.focusModal {
		position: fixed;
		z-index: 70;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(980px, 94vw);
		max-height: 92vh;
		overflow: auto;
		border-radius: 22px;
		border: 1px solid rgba(15,23,42,0.12);
		background: rgba(255,255,255,0.97);
		box-shadow: 0 30px 90px rgba(15, 23, 42, 0.35);
	}
	.focusHeader { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(15,23,42,0.08); }
	.focusTitle { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
	.chip {
		display: inline-flex; align-items: center;
		padding: 6px 10px; border-radius: 999px;
		font-size: 12px; font-weight: 950;
		background: rgba(255,255,255,0.90);
		border: 1px solid rgba(15,23,42,0.10);
	}
	.chip.soft { color: rgba(15,23,42,0.65); font-weight: 900; }
	.closeBtn { border: 1px solid rgba(15,23,42,0.12); background: rgba(255,255,255,0.9); border-radius: 12px; padding: 8px 10px; font-weight: 950; cursor: pointer; }
	.focusStage { padding: 12px; }
	.focusGrid { aspect-ratio: 1000 / 520; border-radius: 18px; border: 1px solid rgba(15,23,42,0.10); }
	.focusActions { padding: 0 12px 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

	.voteBtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-width: 120px;
		padding: 10px 12px;
		border-radius: 14px;
		border: 1px solid rgba(15,23,42,0.12);
		background: rgba(255,255,255,0.92);
		font-size: 13px;
		font-weight: 950;
		cursor: pointer;
		box-shadow: 0 12px 24px rgba(15,23,42,0.10);
	}
	.voteBtn.active { border-color: rgba(16, 185, 129, 0.35); background: rgba(236, 253, 245, 0.92); }
	.voteBtn:disabled { opacity: 0.6; cursor: not-allowed; }
	.focusScore { margin-left: auto; font-weight: 900; color: rgba(15,23,42,0.65); }
	.focusTeacher { margin: 0 12px 14px; border-radius: 16px; padding: 10px 12px; background: rgba(255, 255, 255, 0.86); border: 1px solid rgba(15, 23, 42, 0.10); }

	/* drawer */
	.drawerBackdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: 40; }
	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		width: min(420px, 92vw);
		background: rgba(255, 255, 255, 0.96);
		border-left: 1px solid rgba(15, 23, 42, 0.10);
		box-shadow: -18px 0 60px rgba(15, 23, 42, 0.18);
		z-index: 50;
		display: grid;
		grid-template-rows: auto auto 1fr;
	}
	.drawerHeader { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 10px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); }
	.drawerTitle { font-weight: 950; }
	.drawerState { padding: 14px; display: grid; gap: 10px; }
	.drawerState.error { background: rgba(239, 68, 68, 0.06); border-top: 1px solid rgba(239, 68, 68, 0.18); color: rgba(185, 28, 28, 1); font-weight: 950; }

	.commentComposer { padding: 12px 14px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); display: grid; gap: 10px; }
	.commentInput { width: 100%; resize: none; border-radius: 14px; border: 1px solid rgba(15, 23, 42, 0.14); padding: 10px 10px; font-size: 12px; line-height: 1.4; background: rgba(255, 255, 255, 0.92); }
	.commentInput:focus { outline: none; border-color: rgba(16, 185, 129, 0.45); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.20); }

	.composerRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
	.composerHint { font-size: 12px; font-weight: 900; color: rgba(15,23,42,0.55); }

	.sendBtn { border-radius: 14px; border: 1px solid rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.95); color: #fff; font-size: 12px; font-weight: 950; padding: 10px 12px; cursor: pointer; box-shadow: 0 12px 24px rgba(16, 185, 129, 0.22); }
	.sendBtn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

	.commentList { padding: 12px 14px 18px; overflow: auto; display: grid; gap: 10px; }
	.comment { border-radius: 14px; border: 1px solid rgba(15, 23, 42, 0.10); background: rgba(248, 250, 252, 0.92); padding: 10px; }
	.commentTop { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
	.name { font-weight: 950; font-size: 12px; display: inline-flex; gap: 8px; align-items: center; flex-wrap: wrap; }
	.time { font-size: 11px; color: rgba(15,23,42,0.45); white-space: nowrap; }
	.text { margin-top: 6px; font-size: 12px; color: rgba(15,23,42,0.70); }
	.mutedText { font-weight: 900; color: rgba(15,23,42,0.55); }
</style>
