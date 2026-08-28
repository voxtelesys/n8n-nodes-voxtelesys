module.exports = {
	root: true,
	env: { browser: true, es6: true, node: true },
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaVersion: 2020, sourceType: 'module', extraFileExtensions: ['.json'] },
	ignorePatterns: ['.eslintrc.js', '.prettierrc.js', 'gulpfile.js', '**/node_modules/**', '**/dist/**'],
	overrides: [
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: { 'n8n-nodes-base/community-package-json-name-still-default': 'off' },
		},
		{
			files: ['./credentials/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				// Both rules target nodes in the n8n monorepo, where documentationUrl is a
				// docs slug. Community nodes point at their own docs with a real URL, and
				// the autofix would camelCase it into nonsense.
				'n8n-nodes-base/cred-class-field-documentation-url-missing': 'off',
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
		{
			files: ['./nodes/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/nodes'],
		},
	],
};
