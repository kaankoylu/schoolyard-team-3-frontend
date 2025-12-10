<script>
	let activeTab = 'teacher';

	const tabs = [
		{ id: 'teacher', label: 'Teacher' },
		{ id: 'student', label: 'Student' },
		{ id: 'admin', label: 'Administrator' },
		{ id: 'register', label: 'Create account' }
	];

	// Nested +page.svelte as component, as in your project
	import LoginCard from './login_components/LoginCard.svelte';
</script>

<div class="flex min-h-screen w-full flex-col items-center py-12">
	<!-- Tabs -->
	<div class="mb-6 flex w-full max-w-md rounded-full bg-[#f3f3f7] p-1 shadow-sm">
		{#each tabs as tab}
			<button
				class={`flex-1 rounded-full px-6 py-2 text-center font-medium transition ${
					activeTab === tab.id ? 'bg-white text-black shadow' : 'text-gray-600 hover:text-black'
				}`}
				on:click={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Cards -->
	{#if activeTab === 'teacher'}
		<LoginCard mode="teacher" active={true} />
	{:else if activeTab === 'student'}
		<LoginCard mode="student" active={true} />
	{:else if activeTab === 'admin'}
		<LoginCard mode="admin" active={true} />
	{:else if activeTab === 'register'}
		<LoginCard mode="register" active={true} />
	{/if}
</div>

<style>
	body {
		background-color: #f5f9ff;
		margin: 0;
		min-height: 100vh;
	}

	.student-font-size-login {
		font-size: 30px;
		font-weight: 500;
		color: #000;
	}

	.student-font-size-description {
		font-size: 15px;
	}
</style>
