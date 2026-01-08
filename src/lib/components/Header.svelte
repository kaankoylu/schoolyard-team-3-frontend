<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const STUDENT_KEY = 'student_session';
	const TEACHER_KEY = 'teacher_session';
	const ADMIN_KEY = 'admin_session';

	let isLoggedIn = false;

	function checkSession() {
		isLoggedIn =
			!!localStorage.getItem(STUDENT_KEY) ||
			!!localStorage.getItem(TEACHER_KEY) ||
			!!localStorage.getItem(ADMIN_KEY);
	}

	function handleAuthClick() {
		if (!isLoggedIn) {
			goto('/login');
			return;
		}

		// fake logout
		localStorage.removeItem(STUDENT_KEY);
		localStorage.removeItem(TEACHER_KEY);
		localStorage.removeItem(ADMIN_KEY);

		goto('/');
	}

	onMount(() => {
		checkSession();

		// keep button in sync across pages/tabs
		window.addEventListener('storage', checkSession);
		window.addEventListener('focus', checkSession);

		return () => {
			window.removeEventListener('storage', checkSession);
			window.removeEventListener('focus', checkSession);
		};
	});
</script>

<nav class="bg-white">
	<div class="mx-auto max-w-7xl px-4">
		<div class="flex h-16 items-center justify-between">

			<div class="flex items-center space-x-2">
				<svg xmlns="http://www.w3.org/2000/svg"
				     fill="none"
				     viewBox="0 0 24 24"
				     stroke-width="1.5"
				     stroke="currentColor"
				     class="w-7 h-7 text-blue-500">
					<path stroke-linecap="round" stroke-linejoin="round"
					      d="M12 3l8.485 4.243c.184.092.29.283.29.49V19.5a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75V7.733c0-.207.106-.398.29-.49L12 3z" />
					<path stroke-linecap="round" stroke-linejoin="round"
					      d="M9 21V9h6v12" />
				</svg>

				<span class="text-black font-medium text-lg">
					Schoolplein ontwerper
				</span>
			</div>

			<button
				on:click={handleAuthClick}
				class="text-white bg-black hover:bg-brand-strong px-3 py-2 rounded-md font-semibold"
			>
				{isLoggedIn ? 'Log out' : 'Inloggen'}
			</button>

		</div>
	</div>
</nav>
