module.exports = {
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:prettier/recommended'],
  ignorePatterns: ['.eslintrc.js', 'dist'],
  rules: {
    'prettier/prettier': ['error', { singleQuote: true, endOfLine: 'auto' }],
    'max-params': ['error', 3],
    'max-lines-per-function': ['error', 70],
  },
};
