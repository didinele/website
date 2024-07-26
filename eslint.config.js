import astro from 'eslint-config-neon/flat/astro.js';
import common from 'eslint-config-neon/flat/common.js';
import node from 'eslint-config-neon/flat/node.js';
import prettier from 'eslint-config-neon/flat/prettier.js';
import react from 'eslint-config-neon/flat/react.js';
import typescript from 'eslint-config-neon/flat/typescript.js';
import merge from 'lodash.merge';
import tseslint from 'typescript-eslint';

const commonFiles = '{js,mjs,cjs,ts,mts,cts,jsx,tsx}';

const commonRuleset = merge(...common, {
	files: [`**/*${commonFiles}`],
	rules: {
		'no-eq-null': ['off'],
		eqeqeq: ['error', 'always', { null: 'ignore' }],
	},
});

const nodeRuleset = merge(...node, { files: [`**/*${commonFiles}`], rules: { 'no-restricted-globals': 0 } });

const typeScriptRuleset = merge(...typescript, {
	files: [`**/*${commonFiles}`],
	languageOptions: {
		parserOptions: {
			warnOnUnsupportedTypeScriptVersion: false,
			allowAutomaticSingleRunInference: true,
			project: ['tsconfig.eslint.json', 'services/*/tsconfig.eslint.json', 'packages/*/tsconfig.eslint.json'],
		},
	},
	rules: {
		'@typescript-eslint/consistent-type-definitions': [2, 'interface'],
		'@typescript-eslint/naming-convention': [
			2,
			{
				selector: 'typeParameter',
				format: ['PascalCase'],
				custom: {
					regex: '^\\w{3,}',
					match: true,
				},
			},
		],
	},
	settings: {
		'import/resolver': {
			typescript: {
				project: ['tsconfig.eslint.json', 'services/*/tsconfig.eslint.json', 'packages/*/tsconfig.eslint.json'],
			},
		},
	},
});

const reactRuleset = merge(...react, {
	files: [`**/*${commonFiles}`],
	rules: {
		'@next/next/no-html-link-for-pages': 0,
		'react/react-in-jsx-scope': 0,
		'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
		'react/no-invalid-html-attribute': 0,
		'react/no-unknown-property': 0,
		'react/button-has-type': 0,
	},
});

const astroRuleset = merge(...astro, {
	files: ['**/*{astro}'],
	parser: 'astro-eslint-parser',
	parserOptions: {
		parser: '@typescript-eslint/parser',
	},
});

const prettierRuleset = merge(...prettier, { files: [`**/*${commonFiles}`] });

export default tseslint.config(
	{
		ignores: ['**/node_modules/', '.git/', '**/dist/', '**/coverage/'],
	},
	commonRuleset,
	nodeRuleset,
	typeScriptRuleset,
	reactRuleset,
	astroRuleset,
	prettierRuleset,
);
