<script>
  //import DefaultHeader from '../lib/images/Header.svelte';
  import LoginHeader from '../lib/components/LoginHeader.svelte';
  import { page } from '$app/stores';
  import './layout.css';
  import Header from '$lib/components/Header.svelte';
  import Alert from '$lib/components/Alert.svelte';

  /** @type {{children: import('svelte').Snippet}} */
  let { children } = $props();
</script>

<div class="app">
  {#if $page.url.pathname === '/login'}
    <LoginHeader />
  {:else}
    <Header />
  {/if}

  <main>
    {@render children()}
  </main>
</div>
<Alert />


<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
