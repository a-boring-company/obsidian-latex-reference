// @ts-check
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx',],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        ChildNode: 'readonly',
        NodeList: 'readonly',
        MutationObserver: 'readonly',
        MutationCallback: 'readonly',
        MutationObserverInit: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        Worker: 'readonly',

        // Obsidian globals
        createDiv: 'readonly',
        createSpan: 'readonly',
        Plugin: 'readonly',
        Scope: 'readonly',

        // Node.js globals for specific files
        process: 'readonly',

        // Web Workers
        onmessage: 'writable',
        postMessage: 'readonly',
        self: 'readonly',

        // Modern JS APIs
        structuredClone: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Warnings instead of errors for existing code patterns
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off', // Too many to fix for existing code
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-namespace': 'off', // Used for organizing code
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-cond-assign': 'off', // Common pattern in this codebase
      'no-case-declarations': 'off',
      'no-useless-escape': 'warn',
      'no-redeclare': 'warn',
      'no-undef': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs',],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/',
      'main.js',
      'dist/',
      'docs/',
      'styles.css',
      '*.css.map',
    ],
  },
];
