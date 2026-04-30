import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

execSync('pnpm test:unit', { stdio: 'inherit' });
execSync('pnpm exec tsc --noEmit -p packages/next/tsconfig.json', { stdio: 'inherit' });
