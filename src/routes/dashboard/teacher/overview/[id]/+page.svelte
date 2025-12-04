<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { page } from "$app/stores";

    const API_BASE = "http://localhost";

    type PlacedAsset = {
        instanceId: number;
        assetId?: string;
        label?: string;
        row: number;
        col: number;
        width?: number;
        height?: number;
        rotation: number;
    };

    type Design = {
        id: number;
        rows?: number;
        cols?: number;
        backgroundImage?: string | null;
        placedAssets?: PlacedAsset[];
        created_at?: string;
        class_code?: string | null;
        student_name?: string | null;
        // any other fields are allowed
        [key: string]: any;
    };

    let design: Design | null = null;
    let loading = true;
    let error = "";

    let feedbackText = "";
    let savingFeedback = false;

    // pull id from the URL: /dashboard/teacher/overview/[id]
    let designId: number;

    onMount(async () => {
        const idFromRoute = Number(get(page).params.id);
        designId = idFromRoute;

        if (!designId || Number.isNaN(designId)) {
            error = "Invalid design ID in URL.";
            loading = false;
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/designs/${designId}`);

            if (!res.ok) {
                throw new Error(`Failed to load design (${res.status})`);
            }

            const data = await res.json();
            design = data as Design;
        } catch (e: any) {
            console.error(e);
            error = e?.message ?? "Could not load this design.";
        } finally {
            loading = false;
        }
    });

    async function saveFeedback() {
        const text = feedbackText.trim();
        if (!text) return;

        savingFeedback = true;

        try {
            // adjust endpoint if your Laravel route is different
            const res = await fetch(`${API_BASE}/api/designs/${designId}/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({ text })
            });

            if (!res.ok) {
                const body = await res.text();
                console.error("Feedback error", res.status, body);
                alert("Opslaan van feedback mislukt. Check de console.");
                return;
            }

            alert("Feedback opgeslagen 👍");
            // optionally clear after save:
            // feedbackText = "";
        } catch (err) {
            console.error(err);
            alert("Netwerkfout bij opslaan van feedback.");
        } finally {
            savingFeedback = false;
        }
    }

    function shortDate(date?: string) {
        if (!date) return "";
        return new Date(date).toLocaleString();
    }
</script>

<div class="min-h-screen bg-slate-100/70 py-8 px-4">
    <div class="max-w-6xl mx-auto space-y-6">
        <!-- header -->
        <header class="flex items-center justify-between gap-4">
            <div class="space-y-1">
                <a
                    href="/dashboard/teacher/overview"
                    class="inline-flex items-center text-xs text-slate-600 hover:text-slate-900"
                >
                    ← Back to designs overview
                </a>

                <h1 class="text-2xl font-semibold text-slate-900">
                    Student design #{designId}
                </h1>

                {#if design && design.created_at}
                    <p class="text-xs text-slate-500">
                        Saved at {shortDate(design.created_at)}
                    </p>
                {/if}
            </div>
        </header>

        {#if loading}
            <p class="text-slate-600 text-sm">Loading design…</p>
        {:else if error}
            <p class="text-red-600 text-sm">{error}</p>
        {:else if !design}
            <p class="text-slate-600 text-sm">Design not found.</p>
        {:else}
            <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <!-- LEFT: visual preview / info -->
                <section class="bg-white rounded-xl shadow-md border border-slate-200 p-4 space-y-4">
                    <h2 class="text-sm font-semibold text-slate-900 mb-1">
                        Layout preview
                    </h2>

                    <!-- Large static preview: just show the background image for now -->
                    <div
                        class="w-full h-[420px] rounded-xl border border-emerald-300 overflow-hidden bg-slate-200 bg-center bg-cover shadow-inner"
                        style={`background-image: url('${
                            design.backgroundImage ??
                            "/the-top-view-from-above-is-a-map-of-the-city-with-town-infrastructure-vector.jpg"
                        }')`}
                    ></div>

                    <!-- meta info -->
                    <div class="grid gap-4 sm:grid-cols-2 mt-2 text-xs text-slate-600">
                        <div class="space-y-1">
                            <p><span class="font-semibold">Design ID:</span> {design.id}</p>
                            {#if design.rows && design.cols}
                                <p>
                                    <span class="font-semibold">Grid:</span>
                                    {design.rows} × {design.cols}
                                </p>
                            {/if}
                            {#if design.class_code}
                                <p><span class="font-semibold">Class:</span> {design.class_code}</p>
                            {/if}
                            {#if design.student_name}
                                <p><span class="font-semibold">Student:</span> {design.student_name}</p>
                            {/if}
                        </div>

                        <div class="space-y-1">
                            <p class="font-semibold text-slate-700">Quick stats</p>
                            {#if design.placedAssets && design.placedAssets.length > 0}
                                <p>Total placed items: {design.placedAssets.length}</p>
                            {:else}
                                <p>No placed items stored in this design.</p>
                            {/if}
                        </div>
                    </div>

                    <!-- optional: raw JSON for debugging -->
                    <details class="mt-3 text-xs">
                        <summary class="cursor-pointer text-slate-500">
                            Show raw design JSON (debug)
                        </summary>
                        <pre class="mt-2 max-h-64 overflow-auto bg-slate-900 text-slate-100 p-3 rounded-lg text-[10px]">
{JSON.stringify(design, null, 2)}
                        </pre>
                    </details>
                </section>

                <!-- RIGHT: feedback panel -->
                <aside class="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex flex-col gap-3">
                    <h2 class="text-sm font-semibold text-slate-900">
                        Teacher feedback
                    </h2>

                    <p class="text-xs text-slate-600">
                        Give short, concrete feedback that a student can understand.
                        For example: <em>"Nice use of trees in the corners, maybe add more
                        benches near the field."</em>
                    </p>

                    <textarea
                        class="w-full flex-1 text-xs rounded-lg border border-slate-300 px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                        rows="10"
                        bind:value={feedbackText}
                        placeholder="Write your feedback here…"
                    ></textarea>

                    <button
                        class="inline-flex items-center justify-center text-xs font-medium rounded-lg px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={saveFeedback}
                        disabled={savingFeedback}
                    >
                        {savingFeedback ? "Saving…" : "Save feedback"}
                    </button>
                </aside>
            </div>
        {/if}
    </div>
</div>
