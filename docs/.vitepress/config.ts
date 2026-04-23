import { createRequire } from 'node:module';
import path from 'node:path';

import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const requireFromRoot = createRequire(path.join(process.cwd(), 'package.json'));
const dayjsEsm = path.join(
	path.dirname(requireFromRoot.resolve('dayjs/package.json')),
	'esm/index.js',
);

export default withMermaid(
	defineConfig({
		title: 'Flyva',
		description: 'Seamless page transitions for Next.js and Nuxt',
		themeConfig: {
			nav: [
				{ text: 'Guide', link: '/guide/getting-started' },
				{ text: 'API', link: '/api/shared' },
			],
			sidebar: [
				{
					text: 'Guide',
					items: [
						{ text: 'Getting Started', link: '/guide/getting-started' },
						{ text: 'Next.js', link: '/guide/next' },
						{ text: 'Nuxt', link: '/guide/nuxt' },
						{
							text: 'Transition modes',
							collapsed: false,
							items: [
								{ text: 'Overview', link: '/guide/modes/' },
								{ text: 'Lifecycle diagrams', link: '/guide/modes/lifecycle' },
								{ text: 'CSS mode', link: '/guide/modes/css-mode' },
								{ text: 'View Transitions', link: '/guide/modes/view-transitions' },
							],
						},
						{ text: 'Writing transitions', link: '/guide/transitions' },
						{ text: 'Ref Stack', link: '/guide/ref-stack' },
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
			resolve: {
				alias: [
					// Only the bare `dayjs` entry — subpaths like `dayjs/plugin/isoWeek` must stay intact.
					{ find: /^dayjs$/, replacement: dayjsEsm },
				],
			},
			optimizeDeps: {
				include: ['mermaid'],
			},
		},
	}),
);
