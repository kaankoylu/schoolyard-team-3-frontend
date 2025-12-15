<script lang="ts">
  const API_BASE = "http://localhost";

  type SchoolClass = {
    id: number;
    name: string;
    active_code?: { code: string } | null;
  };

  let classes: SchoolClass[] = [];
  let selectedClassId: number | "" = "";
  let generatedCode = "";
  let newClassName = "";

  let loadingClasses = false;
  let generating = false;

  async function loadClasses() {
    loadingClasses = true;
    try {
      const res = await fetch(`${API_BASE}/api/classes`, {
        headers: { Accept: "application/json" }
      });

      if (!res.ok) throw new Error(`Load classes failed (${res.status})`);

      const data = await res.json();
      classes = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error(e);
      alert("Kon klassen niet laden. Check de console.");
      classes = [];
    } finally {
      loadingClasses = false;
    }
  }

  async function addClass() {
    if (!newClassName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ name: newClassName.trim() })
      });

      if (!res.ok) {
        const t = await res.text();
        console.error(t);
        alert("Add class failed");
        return;
      }

      newClassName = "";
      await loadClasses();
    } catch (e) {
      console.error(e);
      alert("Netwerkfout bij class toevoegen.");
    }
  }

  async function generateCode() {
    if (!selectedClassId) return;

    generating = true;
    try {
      const res = await fetch(`${API_BASE}/api/classes/${selectedClassId}/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ expires_in_minutes: 60 })
      });

      if (!res.ok) {
        const t = await res.text();
        console.error(t);
        alert("Generate code failed");
        return;
      }

      const data = await res.json(); // { id, class_id, code, expires_at, ... }
      generatedCode = data.code;

      const selected = classes.find((c) => c.id === selectedClassId);
      const className = selected?.name ?? `Class #${selectedClassId}`;
      const expiresAt = data.expires_at ?? null;

      // Store payload for the code screen route
      localStorage.setItem(
  "code_screen_data",
  JSON.stringify({
    className,
    code: generatedCode,
    expiresAt
  })
);

window.open("/dashboard/teacher/code-screen", "_blank");

    } catch (e) {
      console.error(e);
      alert("Netwerkfout bij code genereren.");
    } finally {
      generating = false;
    }
  }

  loadClasses();
</script>

<div class="bg-white shadow-md rounded-xl p-6 flex flex-col gap-4 w-full flex-1">
  <h2 class="text-xl font-semibold">Generate Class Code</h2>

  <div class="flex gap-2">
    <input
      class="px-4 py-2 rounded-lg border w-full"
      placeholder="New class name..."
      bind:value={newClassName}
      disabled={generating}
    />
    <button
      class="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-60"
      on:click={addClass}
      disabled={generating}
    >
      Add
    </button>
  </div>

  <select
    bind:value={selectedClassId}
    class="px-4 py-2 rounded-lg border w-full"
    disabled={loadingClasses || generating}
  >
    <option value="">{loadingClasses ? "Loading classes..." : "Select a class..."}</option>
    {#each classes as cls}
      <option value={cls.id}>{cls.name}</option>
    {/each}
  </select>

  <button
    class="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 w-full disabled:opacity-60"
    on:click={generateCode}
    disabled={!selectedClassId || generating}
  >
    {generating ? "Generating..." : "Generate Code"}
  </button>

  {#if generatedCode}
    <p class="text-gray-600">
      Last generated code: <strong>{generatedCode}</strong>
    </p>
  {/if}
</div>
