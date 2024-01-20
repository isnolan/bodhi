module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['../../.eslintrc.js'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js'],
      plugins: ['@typescript-eslint', 'unused-imports', 'simple-import-sort'],
      parserOptions: { project: './tsconfig.json', requireConfigFile: false, tsconfigRootDir: __dirname },
      rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  root: true,
  env: { node: true, jest: true },
};
