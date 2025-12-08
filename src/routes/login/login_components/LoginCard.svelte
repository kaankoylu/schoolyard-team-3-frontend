<script lang="ts">
  export let mode: "teacher" | "student" | "admin" | "register" = "student";
  export let active: boolean = false;

  import { api } from "$lib/api";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let name = "";
  let code = "";
  let error = "";

  // Register:
  let regName = "";
  let regEmail = "";
  let regPassword = "";
  let regPasswordConfirm = "";

  function extractErrorMessage(err: any, fallback: string) {
    console.error(err);
    return err?.response?.data?.message || fallback;
  }

  // TEACHER / ADMIN LOGIN
  async function handleTeacherLogin(event: Event) {
    event.preventDefault();
    error = "";

    try {
      await api.post("/api/login", { email, password });
      goto("/dashboard/teacher");
    } catch (err: any) {
      error = extractErrorMessage(err, "Login failed");
    }
  }

  // STUDENT LOGIN
  async function handleStudentLogin(event: Event) {
    event.preventDefault();
    error = "";

    try {
      await api.post("/api/login", {
        email: name,
        password: code
      });

      goto("/dashboard/student");
    } catch (err: any) {
      error = extractErrorMessage(err, "Login failed");
    }
  }

  // REGISTER
  async function handleRegister(event: Event) {
    event.preventDefault();
    error = "";

    if (regPassword !== regPasswordConfirm) {
      error = "Passwords do not match";
      return;
    }

    try {
      await api.post("/api/register", {
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirmation: regPasswordConfirm
      });

      goto("/login");
    } catch (err: any) {
      error = extractErrorMessage(err, "Registration failed");
    }
  }
</script>

<div
  class={`w-full max-w-md bg-white shadow-md p-8 rounded-xl ${
    active ? "border-4" : "border border-gray-200"
  }`}
  style={active ? "border-color: #DAB2FF;" : ""}>
  
  {#if mode === "teacher"}
    <h2 class="text-xl font-semibold">Teacher Login</h2>
    <p class="text-gray-500 text-sm mb-6">Log in met jouw eigen account</p>

    <form class="space-y-4" on:submit={handleTeacherLogin}>
      <div>
        <label class="font-medium text-sm">Email</label>
        <input
          type="email"
          placeholder="docent@school.com"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={email}
          required
        />
      </div>

      <div>
        <label class="font-medium text-sm">Wachtwoord</label>
        <input
          type="password"
          placeholder="••••••••"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={password}
          required
        />
      </div>

      <button
        type="submit"
        class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Log in als docent
      </button>
    </form>

  {:else if mode === "student"}
    <h2 class="student-font-size-login">🎉 Student Login</h2>
    <p class="text-gray-500 text-sm mb-6 student-font-size-description">
      Vul de code in en starten maar!
    </p>

    <form class="space-y-4" on:submit={handleStudentLogin}>
      <div>
        <label class="font-medium text-xl text-black">✏️ Naam</label>
        <input
          type="text"
          placeholder="Vul je naam hier in"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={name}
          required
        />
      </div>

      <div>
        <label class="font-medium text-xl text-black">🔑 Code</label>
        <input
          type="password"
          placeholder="ABC123"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={code}
          required
        />
      </div>

      <button
        type="submit"
        class="w-full text-white py-2 rounded-md bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500">
        🚀 Let's go!
      </button>
    </form>

  {:else if mode === "admin"}
    <h2 class="text-xl font-semibold">Administratie Login</h2>
    <p class="text-gray-500 text-sm mb-6">Log in met jouw administratie account</p>

    <form class="space-y-4" on:submit={handleTeacherLogin}>
      <div>
        <label class="font-medium text-sm">Email</label>
        <input
          type="text"
          placeholder="administratie@school.com"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={email}
          required
        />
      </div>

      <div>
        <label class="font-medium text-sm">Wachtwoord</label>
        <input
          type="password"
          placeholder="••••••••"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={password}
          required
        />
      </div>

      <button
        type="submit"
        class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Log in als administrator
      </button>
    </form>

  {:else if mode === "register"}
    <h2 class="text-xl font-semibold">Create account</h2>
    <p class="text-gray-500 text-sm mb-6">Maak een nieuw account aan.</p>

    <form class="space-y-4" on:submit={handleRegister}>
      <div>
        <label class="font-medium text-sm">Naam</label>
        <input
          type="text"
          placeholder="Jouw naam"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={regName}
          required
        />
      </div>

      <div>
        <label class="font-medium text-sm">Email</label>
        <input
          type="email"
          placeholder="jij@school.com"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={regEmail}
          required
        />
      </div>

      <div>
        <label class="font-medium text-sm">Wachtwoord</label>
        <input
          type="password"
          placeholder="••••••••"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={regPassword}
          required
        />
      </div>

      <div>
        <label class="font-medium text-sm">Herhaal wachtwoord</label>
        <input
          type="password"
          placeholder="••••••••"
          class="mt-1 w-full px-4 py-2 bg-gray-100 rounded-md outline-none"
          bind:value={regPasswordConfirm}
          required
        />
      </div>

      <button
        type="submit"
        class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Account aanmaken
      </button>
    </form>
  {/if}

  {#if error}
    <p class="mt-4 text-red-500">{error}</p>
  {/if}
</div>
