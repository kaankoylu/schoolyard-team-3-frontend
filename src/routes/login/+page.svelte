<script lang="ts">
	let activeTab: 'teacher' | 'student' | 'register' = 'teacher';

	const tabs = [
		{ id: 'teacher', label: 'Teacher' },
		{ id: 'student', label: 'Student' },
		{ id: 'register', label: 'Create account' }
	] as const;

	// Nested +page.svelte as component, as in your project
	import LoginCard from './login_components/LoginCard.svelte';
</script>

<div class="page">
	<div class="shell">
		<header class="header">
			<h1 class="title">Welcome back</h1>
			<p class="subtitle">Choose a role to sign in, or create a new account.</p>
		</header>

		<!-- Tabs -->
		<nav class="tabs" aria-label="Login tabs">
			{#each tabs as tab}
				<button
					type="button"
					class:tabBtn={true}
					class:tabActive={activeTab === tab.id}
					on:click={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</nav>

		<!-- Card container -->
		<section class="cardWrap">
			{#if activeTab === 'teacher'}
				<LoginCard mode="teacher" />
			{:else if activeTab === 'student'}
				<LoginCard mode="student" />
			{:else}
				<LoginCard mode="register" />
			{/if}
		</section>

		<footer class="footer">
			<small class="footerText">Tip: use Tab ↹ to move through fields.</small>
		</footer>
	</div>
</div>

<style>
	/* Page layout */
	.page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 48px 16px;
		background:
			radial-gradient(1200px 600px at 20% 10%, rgba(59, 130, 246, 0.12), transparent 60%),
			radial-gradient(1000px 500px at 80% 0%, rgba(34, 197, 94, 0.10), transparent 55%),
			linear-gradient(180deg, #f7fbff 0%, #f3f7ff 40%, #f6fff9 100%);
	}

	.shell {
		width: 100%;
		max-width: 440px;
	}

	.header {
		margin-bottom: 14px;
		text-align: center;
	}

	.title {
		margin: 0;
		font-size: 28px;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: #0f172a;
		font-weight: 800;
	}

	.subtitle {
		margin: 8px 0 0;
		font-size: 14px;
		line-height: 1.5;
		color: rgba(15, 23, 42, 0.7);
	}

	/* Tabs */
	.tabs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		padding: 6px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow:
			0 8px 24px rgba(15, 23, 42, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		margin: 0 auto 16px;
	}

	.tabBtn {
		appearance: none;
		border: 0;
		background: transparent;
		padding: 10px 10px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 13px;
		color: rgba(15, 23, 42, 0.68);
		cursor: pointer;
		transition: transform 120ms ease, background-color 160ms ease, color 160ms ease,
			box-shadow 160ms ease;
	}

	.tabBtn:hover {
		color: rgba(15, 23, 42, 0.92);
		background: rgba(15, 23, 42, 0.04);
	}

	.tabBtn:active {
		transform: translateY(1px);
	}

	.tabBtn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
	}

	.tabActive {
		background: #ffffff;
		color: #0f172a;
		box-shadow:
			0 10px 24px rgba(15, 23, 42, 0.10),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	/* Card wrapper */
	.cardWrap {
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.10);
		padding: 14px;
	}

	/* Footer */
	.footer {
		margin-top: 14px;
		text-align: center;
	}

	.footerText {
		color: rgba(15, 23, 42, 0.55);
	}

	/* Keep your existing utility classes available if used elsewhere */
	.student-font-size-login {
		font-size: 30px;
		font-weight: 500;
		color: #000;
	}

	.student-font-size-description {
		font-size: 15px;
	}

	/* Responsive: make tabs wrap nicely on small screens */
	@media (max-width: 420px) {
		.tabs {
			grid-template-columns: repeat(2, 1fr);
			border-radius: 18px;
		}
	}
</style>
