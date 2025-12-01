<script lang="ts">
  export let mode: "teacher" | "student" | "admin" = "student";
  export let active: boolean = false;

  import { api } from "$lib/api"; // calling axios

  let email = "";
  let password = "";
  let name = "";
  let code = "";
  let error = "";

  // getting CSRF cookie before login
  async function getCsrf() {
    try {
      await api.get("/sanctum/csrf-cookie");
    } catch (err: any) {
      console.error("Failed to get CSRF cookie:", err);
      throw new Error("Failed to get CSRF cookie");
    }
  }

  async function handleTeacherLogin(event: Event) {
    event.preventDefault();
    try {
      await getCsrf(); // ensures XSRF cookie
      await api.post("/login", { email, password });
      error = "";
      alert("Teacher logged in!");
    } catch (err: any) {
      error = err.response?.data?.message || err.message;
    }
  }

  async function handleStudentLogin(event: Event) {
    event.preventDefault();
    try {
      await getCsrf(); 
      await api.post("/login", { email: name, password: code }); 
      error = "";
      alert("Student logged in!");
    } catch (err: any) {
      error = err.response?.data?.message || err.message;
    }
  }
</script>

<div
  class={`w-full max-w-md bg-white shadow-md p-8 rounded-xl ${
    active ? "border-4" : "border border-gray-200"
  }`}
  style={active ? "border-color: #DAB2FF;" : ""}
>
  {#if mode === "teacher"}
    <h2 class="text-xl font-semibold">Teacher Login</h2>
    <p class="text-gray-500 text-sm mb-6">Log in met jouw eigen account</p>

    <form class="space-y-4" on:submit={handleTeacherLogin}>
      <div>
        <label class="font-medium text-sm">Email</label>
        <input type="email" placeholder="docent@school.com" class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none" bind:value={email} required />
      </div>

      <div>
        <label class="font-medium text-sm">Wachtwoord</label>
        <input type="password" placeholder="••••••••" class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none" bind:value={password} required />
      </div>

      <button type="submit" class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Log in als docent
      </button>
    </form>

  {:else if mode === "student"}
    <h2 class="student-font-size-login">🎉 Student Login</h2>
    <p class="text-gray-500 text-sm mb-6 student-font-size-description">Vul de code die je op je scherm ziet en starten maar!</p>

    <form class="space-y-4" on:submit={handleStudentLogin}>
      <div>
        <label class="font-medium text-xl text-black">✏️ Wat is jouw naam?</label>
        <input type="text" placeholder="Vul je naam hier in" class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none" bind:value={name} required />
      </div>

      <div>
        <label class="font-medium text-xl text-black">🔑 Vul de code in</label>
        <input type="password" placeholder="ABC123" class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none" bind:value={code} required />
      </div>

      <button type="submit" class="w-full text-white py-2 rounded-md bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500">
        🚀 Let's go!
      </button>
    </form>

  {:else if mode === "admin"}
    <h2 class="text-xl font-semibold">Administratie Login</h2>
    <p class="text-gray-500 text-sm mb-6">Log in met jouw administratie account</p>

    <form class="space-y-4" on:submit={handleTeacherLogin}>
      <div>
        <label class="font-medium text-sm">Email</label>
        <input type="text" placeholder="administratie@school.com" class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none" bind:value={email} required />
      </div>

      <div>
        <label class="font-medium text-sm">Wachtwoord</label>
        <input type="password" placeholder="••••••••" class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none" bind:value={password} required />
      </div>

      <button type="submit" class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Log in als administrator
      </button>
    </form>
  {/if}

  {#if error}
    <p class="mt-4 text-red-500">{error}</p>
  {/if}
</div>
