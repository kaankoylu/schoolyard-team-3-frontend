<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let mode: 'teacher' | 'student' | 'register';

	// ---------- local "accounts" ----------
	type LocalAccount = {
		id: string;
		role: 'teacher';
		name: string;
		email: string;
		created_at: number;
	};

	const ACCOUNTS_KEY = 'local_accounts';

	function readAccounts(): LocalAccount[] {
		try {
			const raw = localStorage.getItem(ACCOUNTS_KEY);
			const arr = raw ? JSON.parse(raw) : [];
			return Array.isArray(arr) ? arr : [];
		} catch {
			return [];
		}
	}

	function writeAccounts(accounts: LocalAccount[]) {
		localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
	}

	// ---------- sessions ----------
	type StudentSession = {
		class_id: number;
		student_name: string;
		session_id: string;
		code: string;
		created_at: number;
	};

	type TeacherSession = {
		teacher_name: string;
		class_id?: number;
		email?: string;
		created_at: number;
	};

	const STUDENT_KEY = 'student_session';
	const TEACHER_KEY = 'teacher_session';

	function now() {
		return Date.now();
	}

	function makeId() {
		return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
	}

	// ---------- form state ----------
	let name = '';
	let email = '';
	let class_id: number | '' = ''; // teacher optional only
	let code = ''; // student required
	let roleForRegister: 'teacher' = 'teacher';

	let msg = '';
	let err = '';
	let accounts: LocalAccount[] = [];

	let verifyingCode = false;

	const ROUTES = {
		student: '/dashboard/student',
		teacher: '/dashboard/teacher'
	};

	onMount(() => {
		accounts = readAccounts();

		try {
			if (mode === 'student') {
				const raw = localStorage.getItem(STUDENT_KEY);
				if (raw) {
					const s = JSON.parse(raw);
					if (s?.student_name) name = String(s.student_name);
					if (s?.code) code = String(s.code);
				}
			}

			if (mode === 'teacher') {
				const raw = localStorage.getItem(TEACHER_KEY);
				if (raw) {
					const s = JSON.parse(raw);
					if (s?.teacher_name) name = String(s.teacher_name);
					if (s?.email) email = String(s.email);
					if (s?.class_id) class_id = Number(s.class_id);
				}
			}
		} catch {
			// ignore
		}
	});

	function clearMessages() {
		msg = '';
		err = '';
	}

	function logout() {
		clearMessages();
		if (mode === 'student') localStorage.removeItem(STUDENT_KEY);
		if (mode === 'teacher') localStorage.removeItem(TEACHER_KEY);
		msg = 'Cleared local session.';
	}

	// (kept if you still use it elsewhere)
	async function resolveClassIdByCode(codeStr: string): Promise<number> {
		const url = new URL('/api/class-codes/resolve', window.location.origin);
		url.searchParams.set('code', codeStr);

		const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });

		if (!res.ok) {
			const t = await res.text();
			throw new Error(t || `Invalid code (${res.status})`);
		}

		const data = await res.json();
		const classId = Number(data?.class_id ?? data?.class?.id ?? data?.classId);

		if (!classId || Number.isNaN(classId)) {
			throw new Error('Server returned no class_id for this code.');
		}

		return classId;
	}

	async function loginStudent() {
		clearMessages();

		const n = name.trim();
		const c = code.trim();

		if (!n) return (err = 'Enter student name.');
		if (!c) return (err = 'Enter class code.');

		verifyingCode = true;

		try {
			const res = await fetch('/api/student-session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					student_name: n,
					code: c
				})
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Invalid or expired code.');
			}

			const data = await res.json();

			const sessionId =
				crypto.randomUUID?.() ??
				`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

			const s: StudentSession = {
				student_name: data.student_name,
				class_id: data.class_id,
				session_id: sessionId,
				code: c,
				created_at: now()
			};

			localStorage.setItem(STUDENT_KEY, JSON.stringify(s));
			goto(ROUTES.student);
		} catch (e: any) {
			err = e?.message ?? 'Login failed.';
		} finally {
			verifyingCode = false;
		}
	}

	function loginTeacher() {
		clearMessages();

		const n = name.trim();
		if (!n) return (err = 'Enter teacher name.');

		const e = email.trim().toLowerCase();
		if (e) {
			const exists = accounts.find((a) => a.role === 'teacher' && a.email.toLowerCase() === e);
			if (!exists) {
				return (err =
					'This teacher email is not in local accounts. Create it in "Create account" (or leave email empty).');
			}
		}

		const s: TeacherSession = {
			teacher_name: n,
			email: e ? e : undefined,
			class_id: class_id === '' ? undefined : Number(class_id),
			created_at: now()
		};

		localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
		goto(ROUTES.teacher);
	}

	function registerLocalAccount() {
		clearMessages();

		const n = name.trim();
		const e = email.trim().toLowerCase();

		if (!n) return (err = 'Enter a name.');
		if (!e || !e.includes('@')) return (err = 'Enter a valid email.');

		const current = readAccounts();
		const exists = current.some((a) => a.role === 'teacher' && a.email.toLowerCase() === e);
		if (exists) return (err = 'This email already exists for that role.');

		const acc: LocalAccount = {
			id: makeId(),
			role: 'teacher',
			name: n,
			email: e,
			created_at: now()
		};

		const next = [acc, ...current];
		writeAccounts(next);
		accounts = next;

		msg = `Local teacher account created. Now login on the teacher tab (email optional).`;
	}

	function removeLocalAccount(id: string) {
		const next = readAccounts().filter((a) => a.id !== id);
		writeAccounts(next);
		accounts = next;
	}
</script>

<div class="card">
	{#if mode === 'student'}
		<h2 class="h">Student login</h2>
		<p class="p">Enter your name + the code your teacher gave you.</p>

		<div class="grid">
			<label class="field">
				<span>Name</span>
				<input class="input" bind:value={name} placeholder="e.g. Sami" autocomplete="name" />
			</label>

			<label class="field">
				<span>Class code</span>
				<input
					class="input"
					bind:value={code}
					placeholder="e.g. 123456"
					autocomplete="one-time-code"
					inputmode="numeric"
				/>
			</label>

			<div class="actions">
				<button class="btn" type="button" on:click={loginStudent} disabled={verifyingCode}>
					{verifyingCode ? 'Checking…' : 'Login'}
				</button>
				<button class="btn ghost" type="button" on:click={logout} disabled={verifyingCode}>
					Clear
				</button>
			</div>
		</div>

	{:else if mode === 'teacher'}
		<h2 class="h">Teacher login</h2>

		<div class="grid">
			<label class="field">
				<span>Name</span>
				<input class="input" bind:value={name} placeholder="e.g. Mr. Smith" autocomplete="name" />
			</label>

			<label class="field">
				<span>Email</span>
				<input class="input" bind:value={email} placeholder="teacher@example.com" autocomplete="email" />
			</label>

			<div class="actions">
				<button class="btn" type="button" on:click={loginTeacher}>Login</button>
				<button class="btn ghost" type="button" on:click={logout}>Clear</button>
			</div>
		</div>

	{:else}
		<h2 class="h">Create account (local only)</h2>
		<p class="p">Stores in localStorage. No backend.</p>

		<div class="grid">
			<label class="field">
				<span>Role</span>
				<select class="input" bind:value={roleForRegister} disabled>
					<option value="teacher">Teacher</option>
				</select>
			</label>

			<label class="field">
				<span>Name</span>
				<input class="input" bind:value={name} placeholder="e.g. Ms. Johnson" autocomplete="name" />
			</label>

			<label class="field">
				<span>Email</span>
				<input class="input" bind:value={email} placeholder="name@example.com" autocomplete="email" />
			</label>

			<div class="actions">
				<button class="btn" type="button" on:click={registerLocalAccount}>Create</button>
			</div>
		</div>
	{/if}

	{#if err}
		<div class="alert error">{err}</div>
	{/if}
	{#if msg}
		<div class="alert ok">{msg}</div>
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
