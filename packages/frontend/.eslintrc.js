module.exports = {
  extends: [
    '../../.eslintrc.json',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true,
    node: true,
    commonjs: true,
    jest: true
  },
  globals: {
    React: 'readable',
    JSX: 'readable',
    document: 'readable',
    window: 'readable',
    localStorage: 'readable',
    fetch: 'readable',
    console: 'readable',
    MediaQueryListEvent: 'readable',
    MediaQueryList: 'readable',
    Event: 'readable',
    EventTarget: 'readable',
    describe: 'readable',
    test: 'readable',
    expect: 'readable'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error'
  }
};