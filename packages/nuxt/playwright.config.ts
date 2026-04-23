import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..');

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'http://127.0.0.1:3100',
		trace: 'on-first-retry',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'pnpm --filter playground-nuxt build && pnpm --filter playground-nuxt preview',
		cwd: repoRoot,
		url: 'http://127.0.0.1:3100',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
