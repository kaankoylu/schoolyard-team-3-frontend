import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		port: 5174, // Svelte dev server port
		proxy: {
			'/sanctum': 'http://localhost', // Laravel container
			'/login': 'http://localhost',
			'/logout': 'http://localhost',
			'/api': 'http://localhost'
		}
	}
});

//Doesnt work at all i will leave it here for focusing to it later
