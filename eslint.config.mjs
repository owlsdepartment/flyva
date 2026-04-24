import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import eslintJs from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: eslintJs.configs.recommended,
	allConfig: eslintJs.configs.all,
});

export default [
	{
		ignores: ['**/dist/**', '**/node_modules/**', 'playground/**', 'docs/.vitepress/cache/**'],
	},
	...compat.config({
		root: true,
		env: {
			browser: true,
			node: true,
			es6: true,
		},
		parser: '@typescript-eslint/parser',
		parserOptions: {
			ecmaVersion: 2020,
		},
		plugins: ['@typescript-eslint', 'simple-import-sort', 'lit', 'html'],
		extends: [
			'eslint:recommended',
			'plugin:@typescript-eslint/eslint-recommended',
			'plugin:@typescript-eslint/recommended',
			'plugin:prettier/recommended',
			'plugin:lit/recommended',
			'plugin:react-hooks/recommended',
		],
		ignorePatterns: ['**/dist/**/*'],
		rules: {
			'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
			quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
			'prettier/prettier': 'warn',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'simple-import-sort/imports': [
				'warn',
				{
					groups: [
						['^\\u0000'],
						['^@?\\w'],
						['^', '^@core', '^@integrations'],
						['^\\.'],
					],
				},
			],
			'simple-import-sort/exports': 'warn',
		},
	}),
];
