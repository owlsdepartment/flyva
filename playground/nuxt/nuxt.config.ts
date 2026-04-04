export default defineNuxtConfig({
	modules: ['../../packages/nuxt/module'],
	build: {
		transpile: ['../../packages/nuxt'],
	},
	vite: {
		vueJsx: true,
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
