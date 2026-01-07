<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import { showAlert } from '$lib/utils/alert';

  type ScreenData = {
    className: string;
    code: string;
    expiresAt: string | null;
  };

  let data: ScreenData | null = null;

  let remaining = "";
  let expired = false;
  let interval: any;

  function format(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function tick() {
    if (!data?.expiresAt) {
      remaining = "";
      expired = false;
      return;
    }
    const diff = new Date(data.expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      expired = true;
      remaining = "⛔ Code verlopen";
      clearInterval(interval);
      return;
    }
    expired = false;
    remaining = `Nog geldig: ${format(diff)}`;
  }

  async function copyCode() {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      showAlert(`Code gecopierd`, 'success', 3000); 
    } catch {
      prompt("Kopieer de code:", data.code);
    }
  }

  function printPage() {
    window.print();
  }

  onMount(() => {
    // Try sessionStorage first (recommended)
    const raw = sessionStorage.getItem("code_screen_data");
    if (raw) {
      data = JSON.parse(raw);
    } else {
      // fallback from query params (if you use them)
      const p = get(page).url.searchParams;
      const className = p.get("className");
      const code = p.get("code");
      const expiresAt = p.get("expiresAt");
      if (className && code) {
        data = { className, code, expiresAt };
      }
    }

    tick();
    interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  });
</script>

{#if !data}
  <div class="wrap">
    <div class="card">
      <h1 class="title">Geen code data gevonden</h1>
      <p class="muted">
        Open dit scherm via “Genereer code” (teacher dashboard).
      </p>
      <a class="btn secondary" href="/dashboard/teacher">← Terug</a>
    </div>
  </div>
{:else}
  <div class="wrap">
    <div class="card">
      <div class="header">
        <div>
          <div class="title">Klas: {data.className}</div>
         
        </div>
        <div class:badge={true} class:expiredBadge={expired}>
          {expired ? "Verlopen" : "Actief"}
        </div>
      </div>

      <div class="grid">
        <div class="codeBox">
          <div class="codeLabel">Klascode</div>
          <div class="code">{data.code}</div>

          {#if data.expiresAt}
            <div class:timer={true} class:timerExpired={expired}>
              {remaining}
            </div>
          {/if}

          <div class="buttons">
            <button class="btn primary" on:click={copyCode}>📋 Kopieer</button>
            <button class="btn secondary" on:click={printPage}>🖨 Print</button>
          </div>
        </div>

        <div class="panel">
          <h3>Instructies voor leerlingen</h3>
          <ol>
            <li>Ga naar de loginpagina</li>
            <li>Kies <strong>Student</strong></li>
            <li>Vul je <strong>naam</strong> in</li>
            <li>Vul deze <strong>code</strong> in</li>
            <li>Klik op <strong>Let’s go!</strong> 🚀</li>
          </ol>
          <p class="tiny">Tip: hoofdletters tellen.</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .wrap {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: linear-gradient(180deg, #f0fdf4, #ecfeff);
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  }

  .card {
    width: min(900px, 100%);
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(15, 23, 42, 0.08);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .title {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
  }

  .muted {
    color: rgba(15, 23, 42, 0.6);
    font-weight: 700;
    margin-top: 4px;
    font-size: 13px;
  }

  .badge {
    padding: 8px 14px;
    border-radius: 999px;
    background: #dcfce7;
    color: #166534;
    font-weight: 900;
    font-size: 12px;
  }

  .expiredBadge {
    background: #fee2e2;
    color: #991b1b;
  }

  .grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  @media (max-width: 780px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  .codeBox {
    background: #ecfdf5;
    border-radius: 18px;
    padding: 18px;
    border: 1px solid #bbf7d0;
  }

  .codeLabel {
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 8px;
    color: rgba(15, 23, 42, 0.75);
  }

  .code {
    font-size: 56px;
    letter-spacing: 0.18em;
    font-weight: 1000;
    color: #0f172a;
  }

  .timer {
    margin-top: 10px;
    font-weight: 900;
    color: rgba(15, 23, 42, 0.75);
  }

  .timerExpired {
    color: #b91c1c;
  }

  .buttons {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    border: 0;
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary {
    background: #22c55e;
    color: white;
  }

  .secondary {
    background: #e5e7eb;
    color: #0f172a;
  }

  .panel {
    background: #f8fafc;
    border-radius: 18px;
    padding: 18px;
    border: 1px solid #e5e7eb;
  }

  .panel h3 {
    margin: 0 0 8px;
    text-transform: uppercase;
    font-size: 13px;
    color: rgba(15, 23, 42, 0.8);
  }

  .panel ol {
    margin: 0;
    padding-left: 18px;
    font-weight: 800;
    line-height: 1.7;
    color: rgba(15, 23, 42, 0.8);
  }

  .tiny {
    margin: 10px 0 0;
    font-size: 12px;
    color: rgba(15, 23, 42, 0.6);
    font-weight: 700;
  }
</style>
