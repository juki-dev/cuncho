// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Reglas de dependencias entre capas/dominios (ver CLAUDE del agente backend).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Rutas internas de OTRO dominio: desde domains/X/<capa>/ (../../Y/<capa>) o desde domains/X/ (../Y/<capa>).
              group: [
                '../../*/api/**', '../../*/application/**', '../../*/domain/**', '../../*/infrastructure/**',
                '../*/api/**', '../*/application/**', '../*/domain/**', '../*/infrastructure/**',
                '**/domains/*/api/**', '**/domains/*/application/**', '**/domains/*/domain/**', '**/domains/*/infrastructure/**',
              ],
              message: 'Usa la API pública del dominio (su index.ts), no rutas internas.',
            },
          ],
        },
      ],
    },
  },
  {
    // shared/ no conoce ningún dominio.
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/domains/**'], message: 'shared/ no puede importar dominios.' }] },
      ],
    },
  },
  {
    // Tests: Jest y supertest usan mucho `any` implícito.
    files: ['**/__tests__/**/*.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);
