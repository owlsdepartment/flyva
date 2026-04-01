export default defineNuxtConfig({
	modules: ['../../packages/nuxt/module'],
	flyva: {
		defaultKey: 'defaultTransition',
		transitionsDir: 'page-transitions',
		useNamedExports: true,
	},
	css: ['~/assets/css/main.css'],
	devtools: { enabled: true },
	compatibilityDate: '2026-03-30',
});
