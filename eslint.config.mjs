import { FlatCompat } from '@eslint/eslintrc';
// @ts-expect-error
import codeStyle from '@signageos/codestyle/.eslintrc.js';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat();

/** @type {import("typescript-eslint").Config} */
const config = tseslint.config(compat.extends('prettier'), compat.config(codeStyle), {
	files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts', '**/*.mjs', '**/*.js'],
	languageOptions: {
		parser: tseslint.parser,
		parserOptions: {
			project: './tsconfig.json',
		},
	},
	rules: {
		'@typescript-eslint/no-empty-function': 'off',
		'unused-imports/no-unused-vars': 'off',
		'unused-imports/no-unused-imports': 'off',
	},
    ignores: [
        'dist/**/* ',
        'build/**/*',
        'node_modules/**/*',
        '*.min.js ',
        '**/*.json',
        'node_modules/',
        'package.json',
        'package-lock.json',
        'README.md',
        'CHANGELOG.md',
        '.prettierignore',
        'docker-compose.yml',
    ]
});

export default config;