<script lang="ts">
  export let mode: "teacher" | "student" | "admin" | "register" = "student";
  export let active: boolean = false;

  import { api } from "$lib/api";
  import { goto } from "$app/navigation";

  const API_BASE = "http://localhost";

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
      error = extractErrorMessage(err, "Er is iets fout gegaan met het inloggen");
    }
  }

  // ✅ STUDENT LOGIN (name + class code)
  async function handleStudentLogin(event: Event) {
    event.preventDefault();
    error = "";

    const studentName = name.trim();
    const classCode = code.trim().toUpperCase();

    if (!studentName || !classCode) {
      error = "Vul je naam en code in"; 
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/student-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code: classCode, student_name: studentName })
      });

      if (res.status === 422) {
        const data = await res.json().catch(() => null);
        error = data?.message ?? "De code is verlopen of ongeldig";
        return;
      }

      if (!res.ok) {
        const t = await res.text();
        console.error(t);
        error = "Er is iets fout gegaan met het inloggen als student";
        return;
      }

      const data = await res.json(); // { class_id, student_name }

      localStorage.setItem(
        "student_session",
        JSON.stringify({
          class_id: data.class_id,
          student_name: data.student_name,
          code: classCode,
          created_at: Date.now()
        })
      );

      goto("/dashboard/student");
    } catch (e) {
      console.error(e);
      error = "Er is iets fout gegaan met het inloggen als student";
    }
  }

  // REGISTER
  async function handleRegister(event: Event) {
    event.preventDefault();
    error = "";

    if (regPassword !== regPasswordConfirm) {
      error = "Onjuist wachtwoord";
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
      error = extractErrorMessage(err, "Er is een fout opgetreden met de registratie");
    }
  }
</script>

<div
  class={`w-full max-w-md bg-white shadow-md p-8 rounded-xl ${
    active ? "border-4" : "border border-gray-200"
  }`}
  style={active ? "border-color: #DAB2FF;" : ""}>

  {#if mode === "teacher"}
    <h2 class="text-xl font-semibold">Docenten Login</h2>
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

      <button type="submit" class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
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
          type="text"
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

      <button type="submit" class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Log in als administrator
      </button>
    </form>

  {:else if mode === "register"}
    <h2 class="text-xl font-semibold">Maak een account</h2>
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

      <button type="submit" class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900">
        Account aanmaken
      </button>
    </form>
  {/if}

  {#if error}
    <p class="mt-4 text-red-500">{error}</p>
  {/if}
</div>

<style>
	.card { padding: 4px; }

	.h { margin: 6px 2px 2px; font-size: 16px; font-weight: 900; color: #0f172a; }
	.p { margin: 0 2px 12px; font-size: 12px; color: rgba(15,23,42,0.6); }

	.grid { display: grid; gap: 10px; }

	.field { display: grid; gap: 6px; font-size: 12px; font-weight: 900; color: rgba(15,23,42,0.65); }

	.input {
		border: 1px solid rgba(15,23,42,0.14);
		border-radius: 14px;
		padding: 10px 10px;
		font-size: 13px;
		background: rgba(255,255,255,0.95);
	}
	.input:focus { outline: none; border-color: rgba(16,185,129,0.45); box-shadow: 0 0 0 3px rgba(16,185,129,0.18); }

	.actions { display: flex; gap: 10px; margin-top: 2px; }

	.btn {
		flex: 1;
		border-radius: 14px;
		border: 1px solid rgba(16, 185, 129, 0.45);
		background: rgba(16, 185, 129, 0.95);
		color: #fff;
		font-size: 13px;
		font-weight: 950;
		padding: 10px 12px;
		cursor: pointer;
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.22);
	}
	.btn.ghost { border: 1px solid rgba(15,23,42,0.12); background: rgba(248,250,252,0.95); color: rgba(15,23,42,0.85); box-shadow: 0 12px 24px rgba(15,23,42,0.08); }

	.alert {
		margin-top: 12px;
		border-radius: 14px;
		padding: 10px;
		font-weight: 950;
		font-size: 12px;
		border: 1px solid rgba(15,23,42,0.10);
		background: rgba(255,255,255,0.8);
	}
	.alert.error { border-color: rgba(239,68,68,0.22); background: rgba(239,68,68,0.06); color: rgba(185,28,28,1); }
	.alert.ok { border-color: rgba(16,185,129,0.22); background: rgba(16,185,129,0.06); color: rgba(15,118,110,1); }

	.list { margin-top: 6px; border-top: 1px solid rgba(15,23,42,0.08); padding-top: 10px; }
	.listTitle { font-size: 12px; font-weight: 950; color: rgba(15,23,42,0.7); margin-bottom: 8px; }
	.empty { font-size: 12px; color: rgba(15,23,42,0.55); font-weight: 900; }

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px;
		border-radius: 14px;
		border: 1px solid rgba(15,23,42,0.10);
		background: rgba(248,250,252,0.9);
		margin-bottom: 8px;
	}
	.rowMain { min-width: 0; }
	.rowTop { font-weight: 950; font-size: 12px; }
	.rowSub { font-size: 11px; color: rgba(15,23,42,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
	.tag {
		margin-left: 6px;
		font-size: 10px;
		font-weight: 950;
		padding: 2px 8px;
		border-radius: 999px;
		border: 1px solid rgba(59,130,246,0.18);
		background: rgba(59,130,246,0.10);
		color: rgba(30,64,175,0.95);
	}

	.miniDanger {
		border-radius: 12px;
		border: 1px solid rgba(239,68,68,0.22);
		background: rgba(239,68,68,0.06);
		color: rgba(185,28,28,1);
		font-weight: 950;
		padding: 8px 10px;
		cursor: pointer;
	}
</style>
