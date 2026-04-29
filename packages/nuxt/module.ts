import {
	addComponentsDir,
	addImports,
	addPlugin,
	addTemplate,
	createResolver,
	defineNuxtModule,
	updateTemplates,
} from '@nuxt/kit';
import fs from 'fs';
import path from 'path';

import { defuReplaceArray } from './utils';

export interface ModuleOptions {
	transitionsDir?: string;
	defaultKey?: string;
	useNamedExports?: boolean;
	viewTransition?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: 'flyva',
		configKey: 'flyva',
	},
	defaults: {},
	async setup(config, nuxt) {
		nuxt.options.runtimeConfig.flyva = defuReplaceArray(nuxt.options.runtimeConfig.flyva, {
			...config,
		});
		nuxt.options.runtimeConfig.public.flyva = {
			transitionsDir: nuxt.options.runtimeConfig.flyva.transitionsDir,
			defaultKey: nuxt.options.runtimeConfig.flyva.defaultKey,
			viewTransition: nuxt.options.runtimeConfig.flyva.viewTransition,
		};

		if (config.viewTransition && nuxt.options.app?.viewTransition) {
			console.warn(
				'[flyva] Both Nuxt app.viewTransition and Flyva viewTransition are enabled. ' +
					"Disable Nuxt's to avoid conflicts: app: { viewTransition: false }",
			);
		}

		const { resolve } = createResolver(import.meta.url);

		addPlugin(resolve('./runtime/plugin'));

		const { transitionsDir = 'flyva-transitions', useNamedExports = true } =
			nuxt.options.runtimeConfig.flyva;
		const objectDirectory = path.join(nuxt.options.rootDir, transitionsDir);

		const readFileList = () => {
			return fs
				.readdirSync(objectDirectory)
				.filter(file => file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx'))
				.reduce(
					(acc, file) => {
						acc[file] = path.join(objectDirectory, file);
						return acc;
					},
					{} as Record<string, string>,
				);
		};

		const loadedTemplates: string[] = [];

		const loadTemplates = () => {
			Object.entries(readFileList()).forEach(([name, path]) => {
				const objectName = name.replace(/\.(js|ts|tsx)$/, '');

				if (objectName === 'index') return;
				if (loadedTemplates.includes(objectName)) return;

				addTemplate({
					filename: `${transitionsDir}/${name}`,
					src: path,
				});

				loadedTemplates.push(objectName);
			});
		};

		loadTemplates();

		addTemplate({
			filename: 'flyva-transitions.ts',
			getContents: () => {
				const transitions: string[] = [];
				const imports: string[] = [];

				const files = readFileList();

				for (const [name] of Object.entries(files)) {
					const objectName = name.replace(/\.(js|ts|tsx)$/, '');

					if (objectName === 'index') continue;

					transitions.push(objectName);

					if (useNamedExports) {
						imports.push(`import { ${objectName} } from '#build/${transitionsDir}/${name}';`);
					} else {
						imports.push(
							`import default as ${objectName} from '#build/${transitionsDir}/${name}';`,
						);
					}
				}

				const code = `
				${imports.join('\n')}
				export const flyvaTransitions = {${transitions.join(',')}};
				`;

				return code;
			},
		});

		nuxt.hook('builder:watch', async (event, path) => {
			if (path.includes(transitionsDir)) {
				loadTemplates();
				updateTemplates({
					filter: t =>
						t.filename === 'flyva-transitions.ts' || t.filename.includes(`${transitionsDir}/`),
				});
			}
		});

		addImports(
			[
				'useDetachedRoot',
				'useFlyvaLifecycle',
				'useFlyvaStickyRef',
				'useFlyvaTransition',
				'useFlyvaState',
				'useRefStack',
				'globalGetRefStackItem',
				'globalGetRefStack',
			].map(key => ({
				name: key,
				as: key,
				from: resolve('runtime/composables'),
			})),
		);

		await addComponentsDir({
			path: resolve('runtime/components'),
			pathPrefix: false,
			pattern: '**/*.vue',
			transpile: 'auto',
			global: true,
		});

		addImports([
			{
				name: 'flyvaShared',
				from: '@flyva/shared',
			},
		]);

		nuxt.options.alias['@flyva/nuxt'] = resolve('.');
		nuxt.options.alias['@flyva/nuxt/*'] = resolve('.') + '/*';
	},
});

declare module '@nuxt/schema' {
	interface RuntimeConfig {
		flyva: ModuleOptions;
	}
	interface PublicRuntimeConfig {
		flyva: Pick<ModuleOptions, 'transitionsDir' | 'defaultKey' | 'viewTransition'>;
	}
}
