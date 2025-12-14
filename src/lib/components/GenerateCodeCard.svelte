<script lang="ts">
  const API_BASE = "http://localhost";

  type SchoolClass = { id: number; name: string; active_code?: { code: string } | null };

  let classes: SchoolClass[] = [];
  let selectedClassId: number | "" = "";
  let generatedCode = "";
  let newClassName = "";

  async function loadClasses() {
    const res = await fetch(`${API_BASE}/api/classes`);
    classes = await res.json();
  }

  async function addClass() {
    if (!newClassName.trim()) return;

    const res = await fetch(`${API_BASE}/api/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: newClassName.trim() })
    });

    if (!res.ok) {
      alert("Add class failed");
      return;
    }

    newClassName = "";
    await loadClasses();
  }

  async function generateCode() {
    if (!selectedClassId) return;

    const res = await fetch(`${API_BASE}/api/classes/${selectedClassId}/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
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

    const selected = classes.find(c => c.id === selectedClassId);
    const className = selected?.name ?? `Class #${selectedClassId}`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`
        <html><head><title>Class Code</title></head>
        <body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;">
          <div>
            <h2>Class: ${className}</h2>
            <h1>Code: ${generatedCode}</h1>
          </div>
        </body></html>
      `);
    }
  }

  loadClasses();
</script>

<div class="bg-white shadow-md rounded-xl p-6 flex flex-col gap-4 w-full flex-1">
  <h2 class="text-xl font-semibold">Generate Class Code</h2>

  <div class="flex gap-2">
    <input class="px-4 py-2 rounded-lg border w-full" placeholder="New class name..." bind:value={newClassName} />
    <button class="px-4 py-2 rounded-lg bg-slate-800 text-white" on:click={addClass}>Add</button>
  </div>

  <select bind:value={selectedClassId} class="px-4 py-2 rounded-lg border w-full">
    <option value="">Select a class...</option>
    {#each classes as cls}
      <option value={cls.id}>{cls.name}</option>
    {/each}
  </select>

  <button class="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 w-full" on:click={generateCode}>
    Generate Code
  </button>

  {#if generatedCode}
    <p class="text-gray-600">Last generated code: <strong>{generatedCode}</strong></p>
  {/if}
</div>
