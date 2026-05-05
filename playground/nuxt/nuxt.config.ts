function playgroundBaseURL(): string {
	const raw = process.env.PLAYGROUND_BASE_PATH?.trim();
	if (!raw || raw === '/') return '/';
	const trimmed = raw.replace(/\/+$/, '');
	const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

export default defineNuxtConfig({
	app: {
		baseURL: playgroundBaseURL(),
		head: {
			link: [{ rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
		},
	},
	runtimeConfig: {
		public: {
			demoDocsHref:
				process.env.NUXT_PUBLIC_DEMO_DOCS_HREF ?? 'https://flyva.js.org/docs/guide/getting-started',
			demoGithubHref:
				process.env.NUXT_PUBLIC_DEMO_GITHUB_HREF ?? 'https://github.com/owlsdepartment/flyva',
		},
	},
	modules: ['../../packages/nuxt/module'],
	build: {
		transpile: ['../../packages/nuxt'],
	},
	nitro: {
		preset: 'static',
	},
	vite: {
		vueJsx: {},
	},
	flyva: {
		defaultKey: 'defaultTransition',
		transitionsDir: 'page-transitions',
		useNamedExports: true,
	},
	css: ['~/assets/css/main.css'],
	devtools: { enabled: true },
	compatibilityDate: '2026-03-30',
});
