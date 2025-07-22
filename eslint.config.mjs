import codestyle from '@signageos/codestyle/eslint.config.mjs';

export default [
    {
        files: ['**/*.{ts,tsx,mts,cts,mjs,js}'],
    },
    ...codestyle,
    {
        ignores: [
            '**/*.config.{js,mjs}',
            'build/**/*',
            '**/*.json',
            'package.json',
            'package-lock.json',
            'README.md',
            '.prettierrc.js',
        ],
    },
];
