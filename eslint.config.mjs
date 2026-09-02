import n8nCommunityNodes from '@n8n/eslint-plugin-community-nodes';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		ignores: ['dist/**', 'node_modules/**'],
	},

	// n8n community-node rules. Applied to the TypeScript sources plus the JSON
	// files the rules inspect (package.json, node codex files).
	{
		...n8nCommunityNodes.configs.recommended,
		files: ['credentials/**/*.ts', 'nodes/**/*.ts', 'package.json', 'nodes/**/*.json'],
	},

	// The TypeScript parser also handles .json (TypeScript parses JSON natively),
	// so one parser covers both file kinds. No `project` option: none of the
	// community-node rules need type information.
	{
		files: ['**/*.ts', '**/*.json'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2022,
			sourceType: 'module',
		},
	},
];
