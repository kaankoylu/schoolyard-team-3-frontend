import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tsParser from '@typescript-eslint/parser';

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,

	// Svelte files (with TypeScript inside <script lang="ts">)
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		plugins: {
			svelte
		},
		rules: {
			// SvelteKit commonly uses normal <a href="/route">, this rule is too strict
			'svelte/no-navigation-without-resolve': 'off'
		}
	},

	// TS files
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser
		}
	},

	// General tweaks (optional, keeps noise low)
	{
		rules: {
			'no-unused-vars': 'warn',
			'no-console': 'off'
		}
	}
];
