import { createRequire } from 'node:module';
import path from 'node:path';

import { defineConfig, type UserConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';
import { withMermaid } from 'vitepress-plugin-mermaid';

import { getSitePrefix, getVitePressBase } from './site-base';

type VitePlugins = NonNullable<NonNullable<UserConfig['vite']>['plugins']>;

const docsPublicOrigin = process.env.DOCS_PUBLIC_ORIGIN?.replace(/\/+$/, '');
const llmsDomain = docsPublicOrigin && docsPublicOrigin.length > 0 ? docsPublicOrigin : undefined;
const sitePrefix = getSitePrefix();

const requireFromRoot = createRequire(path.join(process.cwd(), 'package.json'));
const dayjsEsm = path.join(
	path.dirname(requireFromRoot.resolve('dayjs/package.json')),
	'esm/index.js',
);

export default withMermaid(
	defineConfig({
		base: getVitePressBase(),
		ignoreDeadLinks: [/^\/playground\//],
		title: 'Flyva',
		description: 'Seamless page transitions for Next.js and Nuxt',
		themeConfig: {
			nav: [
				{ text: 'Guide', link: '/guide/getting-started' },
				{ text: 'Demos', link: '/demos' },
				{ text: 'API', link: '/api/shared' },
				{
					text: 'About',
					items: [
						{ text: 'Authors', link: '/about/authors' },
						{ text: 'Links', link: '/about/links' },
						{ text: 'Contributing', link: '/about/contributing' },
						{ text: 'License', link: '/about/license' },
					],
				},
			],
			sidebar: [
				{
					text: 'Guide',
					items: [
						{ text: 'Getting Started', link: '/guide/getting-started' },
						{
							text: 'Next.js',
							collapsed: false,
							items: [
								{ text: 'Overview', link: '/guide/next/' },
								{ text: 'Transition modes', link: '/guide/next/transition-modes' },
								{ text: 'View Transition API', link: '/guide/next/view-transition-api' },
								{ text: 'Writing transitions', link: '/guide/next/writing-transitions' },
								{ text: 'FlyvaLink', link: '/guide/next/flyva-link' },
								{ text: 'Hooks', link: '/guide/next/hooks' },
								{ text: 'Ref Stack', link: '/guide/next/ref-stack' },
							],
						},
						{
							text: 'Nuxt',
							collapsed: false,
							items: [
								{ text: 'Overview', link: '/guide/nuxt/' },
								{ text: 'Transition modes', link: '/guide/nuxt/transition-modes' },
								{ text: 'View Transition API', link: '/guide/nuxt/view-transition-api' },
								{ text: 'Writing transitions', link: '/guide/nuxt/writing-transitions' },
								{ text: 'FlyvaLink', link: '/guide/nuxt/flyva-link' },
								{ text: 'Hooks', link: '/guide/nuxt/hooks' },
								{ text: 'Ref Stack', link: '/guide/nuxt/ref-stack' },
							],
						},
						{ text: 'Demos', link: '/demos' },
					],
				},
				{
					text: 'API Reference',
					items: [
						{ text: '@flyva/shared', link: '/api/shared' },
						{ text: '@flyva/next', link: '/api/next' },
						{ text: '@flyva/nuxt', link: '/api/nuxt' },
					],
				},
				{
					text: 'About',
					items: [
						{ text: 'Authors', link: '/about/authors' },
						{ text: 'Links', link: '/about/links' },
						{ text: 'Contributing', link: '/about/contributing' },
						{ text: 'License', link: '/about/license' },
					],
				},
			],
			socialLinks: [
				{ icon: 'github', link: 'https://github.com/owlsdepartment/flyva' },
			],
		},
		mermaid: {
			theme: 'neutral',
			flowchart: { useMaxWidth: true },
		},
		vite: {
			plugins: [
				...llmstxt({
					...(llmsDomain ? { domain: llmsDomain } : {}),
					title: 'Flyva',
					description: 'Seamless page transitions for Next.js and Nuxt',
					details: sitePrefix
						? `Site prefix: ${sitePrefix}. Documentation and LLM bundles live under ${getVitePressBase()}.`
						: 'Documentation and LLM bundles are served from /docs/.',
				}),
			] as VitePlugins,
			resolve: {
				alias: [
					// Only the bare `dayjs` entry - subpaths like `dayjs/plugin/isoWeek` must stay intact.
					{ find: /^dayjs$/, replacement: dayjsEsm },
				],
			},
			optimizeDeps: {
				include: ['mermaid'],
			},
		},
	}),
);
