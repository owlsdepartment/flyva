export default defineNuxtConfig({
	modules: ['../../packages/nuxt/module'],
	build: {
		transpile: ['../../packages/nuxt'],
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
