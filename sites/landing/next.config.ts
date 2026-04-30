import type { NextConfig } from 'next';

function sitePrefixFromEnv(): string {
	const raw = process.env.SITE_BASE ?? '/';
	if (raw === '/' || raw === '') return '';
	const trimmed = raw.replace(/\/+$/, '');
	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const sitePrefix = sitePrefixFromEnv();

const nextConfig: NextConfig = {
	output: 'export',
	...(sitePrefix ? { basePath: sitePrefix, assetPrefix: `${sitePrefix}/` } : {}),
	env: {
		NEXT_PUBLIC_SITE_PREFIX: sitePrefix,
	},
};

export default nextConfig;
