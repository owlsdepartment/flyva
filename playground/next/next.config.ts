import type { NextConfig } from 'next';

function playgroundBasePath(): string {
	const raw = process.env.PLAYGROUND_BASE_PATH?.trim();
	if (!raw || raw === '/') return '';
	return raw.replace(/\/+$/, '') || '';
}

const basePath = playgroundBasePath();

const nextConfig: NextConfig = {
	transpilePackages: ['@flyva/next', '@flyva/shared'],
	output: 'export',
	trailingSlash: true,
	...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
	env: {
		NEXT_PUBLIC_DEMO_DOCS_HREF:
			process.env.NEXT_PUBLIC_DEMO_DOCS_HREF ?? 'https://flyva.js.org/docs/guide/getting-started',
		NEXT_PUBLIC_DEMO_GITHUB_HREF:
			process.env.NEXT_PUBLIC_DEMO_GITHUB_HREF ?? 'https://github.com/owlsdepartment/flyva',
	},
};

export default nextConfig;
