// api.ts
import axios from 'axios';

const API_URL = 'http://localhost'; // Laravel backend

// Create an axios instance
export const api = axios.create({
	baseURL: API_URL,
	withCredentials: true, // Important: sends cookies
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	}
});

// getting the CSRF cookie
export async function getCsrf(): Promise<void> {
	try {
		await api.get('/sanctum/csrf-cookie');
	} catch (err) {
		console.error('Failed to get CSRF cookie:', err);
		throw new Error('Failed to get CSRF cookie');
	}
}

// handlling the login
export async function login(email: string, password: string): Promise<any> {
	await getCsrf();

	try {
		const res = await api.post('/login', { email, password });
		return res.data;
	} catch (err: any) {
		const msg = err.response?.data?.message || `Login failed with status ${err.response?.status}`;
		throw new Error(msg);
	}
}

export async function getUser(): Promise<any> {
	try {
		const res = await api.get('/api/user');
		return res.data;
	} catch (err: any) {
		const msg = err.response?.data?.message || 'Failed to fetch user';
		throw new Error(msg);
	}
}

export async function logout(): Promise<any> {
	await getCsrf();
	try {
		const res = await api.post('/logout');
		return res.data;
	} catch (err: any) {
		const msg = err.response?.data?.message || 'Logout failed';
		throw new Error(msg);
	}
}
