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
	flyva: {
		defaultKey: 'fadeTransition',
		transitionsDir: 'page-transitions',
		useNamedExports: true,
		viewTransition: true,
	},
	css: ['~/assets/css/main.css'],
	devtools: { enabled: true },
	compatibilityDate: '2026-03-30',
});
