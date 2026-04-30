import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const defaultOut = join(root, 'site-public');
const outDir = process.env.SITE_OUTPUT_DIR?.trim() || defaultOut;

const sources = [
	{ from: join(root, 'sites/landing/out'), to: '.' },
	{ from: join(root, 'docs/.vitepress/dist'), to: 'docs' },
	{ from: join(root, 'playground/next/out'), to: join('playground', 'next') },
	{ from: join(root, 'playground/next-vt/out'), to: join('playground', 'next-vt') },
	{ from: join(root, 'playground/nuxt/.output/public'), to: join('playground', 'nuxt') },
	{ from: join(root, 'playground/nuxt-vt/.output/public'), to: join('playground', 'nuxt-vt') },
];

async function assertDir(path, label) {
	try {
		const s = await stat(path);
		if (!s.isDirectory()) {
			throw new Error(`${label}: not a directory: ${relative(root, path)}`);
		}
	} catch (e) {
		if (e && e.code === 'ENOENT') {
			throw new Error(`${label}: missing directory — build it first: ${relative(root, path)}`);
		}
		throw e;
	}
}

async function copyTreeInto(src, destRoot) {
	await mkdir(destRoot, { recursive: true });
	const names = await readdir(src);
	for (const name of names) {
		const from = join(src, name);
		const to = join(destRoot, name);
		await cp(from, to, { recursive: true });
	}
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const { from, to } of sources) {
	await assertDir(from, to === '.' ? 'landing' : to);
	const dest = to === '.' ? outDir : join(outDir, to);
	if (to === '.') {
		await copyTreeInto(from, dest);
	} else {
		await cp(from, dest, { recursive: true });
	}
}

console.log(`Assembled static site at ${relative(root, outDir) || '.'}`);
