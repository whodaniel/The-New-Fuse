import globals from 'globals'
import eslintRecommended from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactHooks from 'eslint-plugin-react-hooks'
import ftFlow from 'eslint-plugin-ft-flow'
import hermesParser from 'hermes-eslint'

const reactRecommended = react.configs.recommended
const jsxRuntime = react.configs["jsx-runtime"]

export default [
  eslintRecommended.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["**/*.test.js"],
    languageOptions: {
      parser: hermesParser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node
      }
    },
    linterOptions: { reportUnusedDisableDirectives: true },
    settings: { react: { version: "18.2" } },
    plugins: {
      ftFlow,
      react,
      "jsx-runtime": jsxRuntime,
      "react-hooks": reactHooks,
      prettier
    },
    rules: {
      ...reactRecommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...ftFlow.recommended,
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-empty": "warn",
      "no-extra-boolean-cast": "warn",
      "prettier/prettier": "warn"
    }
  },
  {
    files: ["frontend/src/**/*.js"],
    plugins: {
      ftFlow,
      prettier
    },
    rules: {
      "prettier/prettier": "warn"
    }
  },
  {
    files: [
      "server/endpoints/**/*.js",
      "server/models/**/*.js",
      "server/swagger/**/*.js",
      "server/utils/**/*.js",
      "server/index.js"
    ],
    rules: {
      "no-undef": "warn"
    }
  },
  {
    files: ["frontend/src/**/*.jsx"],
    plugins: {
      ftFlow,
      react,
      "jsx-runtime": jsxRuntime,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier
    },
    rules: {
      ...jsxRuntime.rules,
      "react/prop-types": "off", // FIXME
      "react-refresh/only-export-components": "warn"
    }
  }
]
