<script lang="ts">
	export let mode: 'teacher' | 'student' | 'admin' = 'student';
	export let active: boolean = false;

	let email = '';
	let password = '';
	let name = '';
	let code = '';

	let error = '';

	async function handleLogin(event: Event) {
		event.preventDefault();

		try {
			// Redirecting with the window.location.href note that it is bypassing the auth from backend and routing from backend
			if (mode === 'teacher') window.location.href = 'http://localhost:5174/dashboard/teacher';
			if (mode === 'student') window.location.href = 'http://localhost:5174/dashboard/student';
			if (mode === 'admin') window.location.href = 'http://localhost:5174/dashboard/administrator';
		} catch (err: any) {
			error = err.message || 'Something went wrong';
		}
	}
</script>

<div
	class={`w-full max-w-md rounded-xl bg-white p-8 shadow-md ${
		active ? 'border-4' : 'border border-gray-200'
	}`}
	style={active ? 'border-color: #DAB2FF;' : ''}
>
	{#if mode === 'teacher'}
		<h2 class="text-xl font-semibold">Teacher Login</h2>
		<p class="mb-6 text-sm text-gray-500">Log in met jouw eigen account</p>

		<form class="space-y-4" on:submit={handleLogin}>
			<div>
				<label class="text-sm font-medium">Email</label>
				<input
					type="email"
					placeholder="docent@school.com"
					class="mt-1 w-full rounded-md bg-gray-100 px-4 py-2 outline-none"
					bind:value={email}
					required
				/>
			</div>

			<div>
				<label class="text-sm font-medium">Wachtwoord</label>
				<input
					type="password"
					placeholder="••••••••"
					class="mt-1 w-full rounded-md bg-gray-100 px-4 py-2 outline-none"
					bind:value={password}
					required
				/>
			</div>

			<button type="submit" class="w-full rounded-md bg-black py-2 text-white hover:bg-gray-900">
				Log in als docent
			</button>
		</form>
	{:else if mode === 'student'}
		<h2 class="student-font-size-login">🎉 Student Login</h2>
		<p class="student-font-size-description mb-6 text-sm text-gray-500">
			Vul de code die je op je scherm ziet en starten maar!
		</p>

		<form class="space-y-4" on:submit={handleLogin}>
			<div>
				<label class="text-xl font-medium text-black">✏️ Wat is jouw naam?</label>
				<input
					type="text"
					placeholder="Vul je naam hier in"
					class="mt-1 w-full rounded-md bg-gray-100 px-4 py-2 outline-none"
					bind:value={name}
					required
				/>
			</div>

			<div>
				<label class="text-xl font-medium text-black">🔑 Vul de code in</label>
				<input
					type="password"
					placeholder="ABC123"
					class="mt-1 w-full rounded-md bg-gray-100 px-4 py-2 outline-none"
					bind:value={code}
					required
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-md bg-gradient-to-r from-purple-400 to-pink-400 py-2 text-white hover:from-purple-500 hover:to-pink-500"
			>
				🚀 Let's go!
			</button>
		</form>
	{:else if mode === 'admin'}
		<h2 class="text-xl font-semibold">Administratie Login</h2>
		<p class="mb-6 text-sm text-gray-500">Log in met jouw administratie account</p>

		<form class="space-y-4" on:submit={handleLogin}>
			<div>
				<label class="text-sm font-medium">Email</label>
				<input
					type="text"
					placeholder="administratie@school.com"
					class="mt-1 w-full rounded-md bg-gray-100 px-4 py-2 outline-none"
					bind:value={email}
					required
				/>
			</div>

			<div>
				<label class="text-sm font-medium">Wachtwoord</label>
				<input
					type="password"
					placeholder="••••••••"
					class="mt-1 w-full rounded-md bg-gray-100 px-4 py-2 outline-none"
					bind:value={password}
					required
				/>
			</div>

			<button type="submit" class="w-full rounded-md bg-black py-2 text-white hover:bg-gray-900">
				Log in als administrator
			</button>
		</form>
	{/if}

	{#if error}
		<p class="mt-4 text-red-500">{error}</p>
	{/if}
</div>
