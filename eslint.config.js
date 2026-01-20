import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
	js.configs.recommended,

	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...tsPlugin.configs.recommended.rules,

			complexity: ['warn', 10]
		}
	},

	{
	files: ['**/*.svelte'],
	languageOptions: {
		parser: svelteParser,
		parserOptions: {
			parser: tsParser
		}
	},
	plugins: {
		svelte,
		'@typescript-eslint': tsPlugin
	},
	rules: {
		...tsPlugin.configs.recommended.rules,

		//  Cyclomatic complexity metric
		complexity: ['warn', 10],

		'svelte/no-navigation-without-resolve': 'off',
		'@typescript-eslint/no-unused-vars': 'warn',
		'no-unused-vars': 'off'
	}
},


	// General
	{
		rules: {
			'no-console': 'off'
		}
	}
];
