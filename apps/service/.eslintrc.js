module.exports = {
  root: true,
  env: { node: true, jest: true },
  extends: ['../../.eslintrc.js'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js'],
      plugins: ['@typescript-eslint', 'unused-imports', 'simple-import-sort'],
      parser: '@typescript-eslint/parser',
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
};
