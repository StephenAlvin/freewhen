import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['functions/**/*.test.ts'],
    poolOptions: {
      workers: {
        main: './tests/worker-entry.ts',
        wrangler: { configPath: './wrangler.toml' },
        miniflare: { d1Databases: ['DB'] },
      },
    },
  },
});
