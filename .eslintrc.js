module.exports = {
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:prettier/recommended', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],

  ignorePatterns: ['.eslintrc.js', 'dist'],
  rules: {
    'prettier/prettier': ['error', { singleQuote: true, endOfLine: 'auto' }],
    'max-params': ['error', 5],
    'max-lines-per-function': ['error', 300],

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
};
