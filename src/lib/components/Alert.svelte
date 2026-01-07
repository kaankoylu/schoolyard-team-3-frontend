<script>
  import { alertStore } from '$lib/stores/alert';

  function close() {
    alertStore.set({ show: false, message: '', type: 'info' });
  }
</script>

{#if $alertStore.show}
  <div class="alert-backdrop" on:click={close}>
    <div class="alert {$alertStore.type}" on:click|stopPropagation>
      <p>{$alertStore.message}</p>
      <button on:click={close}>OK</button>
    </div>
  </div>
{/if}

<style>
  .alert-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .alert {
    background: white;
    padding: 1.5rem 2rem;
    border-radius: 10px;
    min-width: 300px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: fadeIn 0.2s ease-out;
  }

  .alert.success { border-left: 5px solid green; }
  .alert.error { border-left: 5px solid red; }
  .alert.info { border-left: 5px solid blue; }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
