import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import { createRequire } from 'node:module';

// eslint-plugin-react's `version: 'detect'` calls the `context.getFilename()` API that
// ESLint 10 removed, so resolve the installed React version here instead. Same result,
// no reliance on the removed API.
const reactVersion = createRequire(import.meta.url)('react/package.json').version;

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      '.claude/**',
      'frontend/mock/mockServer.js',
    ],
  },

  // Base JS rules for all files
  js.configs.recommended,

  // Backend TypeScript files — Node.js environment
  {
    files: ['backend/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.node },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended.at(-1).rules,
      'no-undef': 'off', // TypeScript compiler handles undefined variables
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Frontend build tooling — Node.js environment
  {
    files: ['frontend/seo/**/*.ts', 'frontend/vite.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.node },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended.at(-1).rules,
      'no-undef': 'off', // TypeScript compiler handles undefined variables
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Frontend TypeScript/TSX source files — browser + Node environment
  {
    files: ['frontend/src/**/*.ts', 'frontend/src/**/*.tsx', 'frontend/mock/mockServer.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: reactVersion },
    },
    rules: {
      ...tseslint.configs.recommended.at(-1).rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'no-undef': 'off', // TypeScript compiler handles undefined variables
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
    },
  },

  // Test files — vitest globals
  {
    files: ['frontend/test/**/*.ts', 'frontend/test/**/*.tsx', 'backend/test/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: {
        ...globals.node,
        ...globals.browser,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended.at(-1).rules,
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Disable formatting rules that Prettier handles
  prettierConfig,
];
