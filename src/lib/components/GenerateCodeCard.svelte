<script lang="ts">
	import { onMount } from 'svelte';

	type SchoolClass = {
		id: number;
		name: string;
		active_code?: { code: string } | null;
	};

	let classes: SchoolClass[] = [];
	let selectedClassId: number | '' = '';
	let generatedCode = '';
	let newClassName = '';

	let loadingClasses = false;
	let generating = false;
	let error = '';

	async function loadClasses() {
		loadingClasses = true;
		error = '';
		try {
			const res = await fetch('/api/classes', {
				headers: { Accept: 'application/json' }
			});

			if (!res.ok) throw new Error(`Fout met laden van de klassen (${res.status})`);

			const data = await res.json();
			classes = Array.isArray(data) ? data : [];
		} catch (e) {
			console.error(e);
			classes = [];
			error = 'Kon klassen niet laden. Check de console.';
		} finally {
			loadingClasses = false;
		}
	}

	async function addClass() {
		if (!newClassName.trim()) return;

		error = '';
		try {
			const res = await fetch('/api/classes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ name: newClassName.trim() })
			});

			if (!res.ok) {
				console.error(await res.text());
				error = 'Er is een fout opgetreden met het toevoegen van de klas';
				return;
			}

			newClassName = '';
			await loadClasses();
		} catch (e) {
			console.error(e);
			error = 'Netwerkfout bij klas toevoegen.';
		}
	}

	async function generateCode() {
		if (!selectedClassId) return;

		generating = true;
		error = '';
		try {
			const res = await fetch(`/api/classes/${selectedClassId}/code`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ expires_in_minutes: 60 })
			});

			if (!res.ok) {
				console.error(await res.text());
				error = 'Er is een fout opgetreden met het aanmaken van de code';
				return;
			}

			const data = await res.json(); // { id, class_id, code, expires_at, ... }
			generatedCode = data.code;

			const selected = classes.find((c) => c.id === Number(selectedClassId));
			const className = selected?.name ?? `Class #${selectedClassId}`;
			const expiresAt = data.expires_at ?? null;

			localStorage.setItem(
				'code_screen_data',
				JSON.stringify({
					className,
					code: generatedCode,
					expiresAt
				})
			);

			window.open('/dashboard/teacher/code-screen', '_blank');
		} catch (e) {
			console.error(e);
			error = 'Netwerkfout bij code genereren.';
		} finally {
			generating = false;
		}
	}

	onMount(loadClasses);
</script>

<div class="flex w-full flex-1 flex-col gap-4 rounded-xl bg-white p-6 shadow-md">
	<h2 class="text-xl font-semibold">Klassen code maken</h2>

	{#if error}
		<p class="text-red-600">{error}</p>
	{/if}

	<div class="flex gap-2">
		<input
			class="w-full rounded-lg border px-4 py-2"
			placeholder="Nieuwe klas naam..."
			bind:value={newClassName}
			disabled={generating}
		/>
		<button
			class="rounded-lg bg-slate-800 px-4 py-2 text-white disabled:opacity-60"
			on:click={addClass}
			disabled={generating}
		>
			Toevoegen
		</button>
	</div>

	<select
		bind:value={selectedClassId}
		class="w-full rounded-lg border px-4 py-2"
		disabled={loadingClasses || generating}
	>
		<option value="">{loadingClasses ? 'Klassen laden...' : 'Selecteer een klas...'}</option>
		{#each classes as cls}
			<option value={cls.id}>{cls.name}</option>
		{/each}
	</select>

	<button
		class="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
		on:click={generateCode}
		disabled={!selectedClassId || generating}
	>
		{generating ? 'Maken...' : 'Maak code'}
	</button>

	{#if generatedCode}
		<p class="text-gray-600">
			Laatst gemaakte code: <strong>{generatedCode}</strong>
		</p>
	{/if}
</div>
