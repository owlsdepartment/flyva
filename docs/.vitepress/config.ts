import { defineConfig } from 'vitepress';

export default defineConfig({
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
					{ text: 'Transitions', link: '/guide/transitions' },
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
});
