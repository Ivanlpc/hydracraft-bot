const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**', 'logs/**', 'charts/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,cjs}'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }] }
  }
]
