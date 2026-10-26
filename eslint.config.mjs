import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  { ignores: ['.next/**', 'node_modules/**', '.fieldwork/**', 'public/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { files: ['**/*.mjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
];

export default config;
