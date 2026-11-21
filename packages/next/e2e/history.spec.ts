import { expect, type Page, test } from '@playwright/test';

import { navLinkByHref, pathUrl, waitForTransitionIdle } from './support/helpers';

interface HistoryDemoSettings {
	strategy: 'noop' | 'snapshot' | 'intercept' | 'off';
	transition?: string;
	interceptTimeout?: number;
}

interface Recording {
	keys: string[];
	clones: Array<{ outgoing: string | null; h1: string | null }>;
	cloneClasses: string[];
	samples: Array<{ path: string; h1s: string[] }>;
	enterOffsets: number[];
}

async function setup(
	page: Page,
	settings: HistoryDemoSettings,
	options: { blockReplay?: boolean } = {},
) {
	await page.addInitScript(
		([value, blockReplay]) => {
			sessionStorage.setItem('flyva-demo:history', value);

			if (blockReplay) {
				window.addEventListener('popstate', event => {
					if (!event.isTrusted) event.stopImmediatePropagation();
				});
			}

			const rec: Recording = {
				keys: [],
				clones: [],
				cloneClasses: [],
				samples: [],
				enterOffsets: [],
			};
			(window as unknown as { __rec: Recording }).__rec = rec;

			new MutationObserver(mutations => {
				for (const m of mutations) {
					if (m.type === 'attributes' && m.attributeName === 'data-flyva-transition') {
						const key = document.documentElement.getAttribute('data-flyva-transition');
						if (key && rec.keys[rec.keys.length - 1] !== key) rec.keys.push(key);
					} else if (m.type === 'attributes' && m.target instanceof HTMLElement) {
						if (m.target.classList.contains('flyva-clone'))
							rec.cloneClasses.push(m.target.className);
					} else if (m.type === 'childList') {
						for (const node of Array.from(m.addedNodes)) {
							if (node instanceof HTMLElement && node.classList.contains('flyva-clone')) {
								rec.clones.push({
									outgoing: node.dataset.demoOutgoing ?? null,
									h1: node.querySelector('h1')?.textContent ?? null,
								});
							}
						}
					}
				}
			}).observe(document, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ['data-flyva-transition', 'class'],
			});

			let last = '';
			const sample = () => {
				const entry = {
					path: location.pathname,
					h1s: Array.from(document.querySelectorAll('h1'), h => h.textContent ?? ''),
				};
				const serialized = JSON.stringify(entry);
				if (serialized !== last) {
					last = serialized;
					rec.samples.push(entry);
				}
				if (document.documentElement.classList.contains('flyva-enter-active')) {
					const content = document.querySelector(
						'main [data-demo-page-content]:not(.flyva-clone *)',
					);
					const wrapper = content?.closest('main > div');
					if (content && wrapper) {
						rec.enterOffsets.push(Math.round(wrapper.getBoundingClientRect().top + window.scrollY));
					}
				}
				requestAnimationFrame(sample);
			};
			requestAnimationFrame(sample);
		},
		[JSON.stringify(settings), !!options.blockReplay] as const,
	);
}

async function recording(page: Page) {
	return page.evaluate(() => (window as unknown as { __rec: Recording }).__rec);
}

async function resetRecording(page: Page) {
	await page.evaluate(() => {
		const rec = (window as unknown as { __rec: Recording }).__rec;
		rec.keys = [];
		rec.clones = [];
		rec.cloneClasses = [];
		rec.samples = [];
		rec.enterOffsets = [];
	});
}

async function visit(page: Page, href: string, heading: string) {
	await navLinkByHref(page, href).first().click();
	await page.waitForURL(pathUrl(href));
	await waitForTransitionIdle(page);
	await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

async function traverse(page: Page, direction: 'back' | 'forward', path: string, heading: string) {
	if (direction === 'back') await page.goBack({ waitUntil: 'commit' });
	else await page.goForward({ waitUntil: 'commit' });
	await page.waitForURL(pathUrl(path));
	await waitForTransitionIdle(page);
	await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
	await expect(page.locator('.flyva-clone')).toHaveCount(0);
	await expect(page.locator('h1')).toHaveCount(1);
}

async function startOnAbout(page: Page) {
	await page.goto('/');
	await waitForTransitionIdle(page);
	await visit(page, '/about', 'About');
	await resetRecording(page);
}

const navigationAttr = (page: Page) => page.locator('html').getAttribute('data-demo-navigation');

test.describe('history', () => {
	test('browser back returns to Home after client navigation', async ({ page }) => {
		await page.goto('/');
		await navLinkByHref(page, '/about').filter({ hasText: 'default' }).click();
		await page.waitForURL(pathUrl('/about'));
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();

		await page.goBack();
		await page.waitForURL(pathUrl('/'));
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
	});

	test('noop: no clone, fallback transition runs with navigation context', async ({ page }) => {
		await setup(page, { strategy: 'noop' });
		await startOnAbout(page);

		await traverse(page, 'back', '/', 'Home');

		const rec = await recording(page);
		expect(rec.keys).toEqual(['historyTransition']);
		expect(rec.clones).toEqual([]);
		expect(await navigationAttr(page)).toBe('back:-1:noop');
	});

	test('snapshot: the old page leaves as a prepared clone while the new page renders', async ({
		page,
	}) => {
		await setup(page, { strategy: 'snapshot' });
		await startOnAbout(page);

		await traverse(page, 'back', '/', 'Home');

		const rec = await recording(page);
		expect(rec.keys).toEqual(['historyTransition']);
		expect(rec.clones).toEqual([{ outgoing: 'clone', h1: 'About' }]);
		expect(
			rec.samples.some(s => s.path === '/' && s.h1s.includes('About') && s.h1s.includes('Home')),
		).toBe(true);
		expect(await navigationAttr(page)).toBe('back:-1:snapshot');

		const settledOffset = await page.evaluate(() =>
			Math.round(
				document.querySelector('main > div')!.getBoundingClientRect().top + window.scrollY,
			),
		);
		expect(rec.enterOffsets.length).toBeGreaterThan(0);
		expect(Math.max(...rec.enterOffsets)).toBe(settledOffset);
	});

	test('snapshot: forward is detected', async ({ page }) => {
		await setup(page, { strategy: 'snapshot' });
		await startOnAbout(page);
		await traverse(page, 'back', '/', 'Home');

		await traverse(page, 'forward', '/about', 'About');

		expect(await navigationAttr(page)).toBe('forward:1:snapshot');
	});

	test('intercept: the live page leaves before Next swaps it', async ({ page }) => {
		await setup(page, { strategy: 'intercept' });
		await startOnAbout(page);

		await traverse(page, 'back', '/', 'Home');

		const rec = await recording(page);
		expect(rec.keys).toEqual(['historyTransition']);
		expect(rec.clones).toEqual([]);
		expect(
			rec.samples.some(s => s.path === '/' && s.h1s.length === 1 && s.h1s[0] === 'About'),
		).toBe(true);
		expect(await navigationAttr(page)).toBe('back:-1:intercept');
	});

	for (const strategy of ['snapshot', 'intercept'] as const) {
		test(`${strategy}: matched concurrent transition runs on history moves`, async ({ page }) => {
			await setup(page, { strategy });
			await page.goto('/');
			await waitForTransitionIdle(page);
			await visit(page, '/work', 'Work');
			await visit(page, '/about', 'About');
			await resetRecording(page);

			await traverse(page, 'back', '/work', 'Work');

			const rec = await recording(page);
			expect(rec.keys).toEqual(['slideTransition']);
			expect(rec.clones.map(c => c.h1)).toEqual(['About']);
		});
	}

	test('snapshot: cssMode transition gets leave classes on the clone', async ({ page }) => {
		await setup(page, { strategy: 'snapshot', transition: 'cssFadeTransition' });
		await startOnAbout(page);

		await traverse(page, 'back', '/', 'Home');

		const rec = await recording(page);
		expect(rec.keys).toEqual(['cssFadeTransition']);
		expect(rec.cloneClasses.some(c => c.includes('cssFadeTransition-leave-active'))).toBe(true);
	});

	test('strategy returning false skips the transition', async ({ page }) => {
		await setup(page, { strategy: 'off' });
		await startOnAbout(page);

		await traverse(page, 'back', '/', 'Home');

		const rec = await recording(page);
		expect(rec.keys).toEqual([]);
		expect(rec.clones).toEqual([]);
	});

	test('hash-only history moves are ignored', async ({ page }) => {
		await setup(page, { strategy: 'snapshot' });
		await startOnAbout(page);
		await page.evaluate(() => {
			location.hash = 'section';
		});
		await page.waitForURL(/#section$/);

		await page.goBack({ waitUntil: 'commit' });
		await page.waitForURL(pathUrl('/about'));

		const rec = await recording(page);
		expect(rec.keys).toEqual([]);
		expect(rec.clones).toEqual([]);
	});

	for (const strategy of ['snapshot', 'intercept'] as const) {
		test(`${strategy}: a second move during a transition jumps without leftovers`, async ({
			page,
		}) => {
			await setup(page, { strategy });
			await page.goto('/');
			await waitForTransitionIdle(page);
			await visit(page, '/about', 'About');
			await visit(page, '/history-demo', 'History');

			await page.goBack({ waitUntil: 'commit' });
			await page.waitForTimeout(100);
			await traverse(page, 'back', '/', 'Home');

			expect(await page.locator('[style*="pointer-events: none"]').count()).toBe(0);
			await expect(page.locator('html')).not.toHaveClass(/\bflyva-running\b/);
		});
	}

	test('intercept: watchdog finishes the transition when Next never swaps', async ({ page }) => {
		await setup(page, { strategy: 'intercept', interceptTimeout: 1000 }, { blockReplay: true });
		await startOnAbout(page);

		await page.goBack({ waitUntil: 'commit' });
		await page.waitForURL(pathUrl('/'));
		await waitForTransitionIdle(page, 5000);

		await expect(page.locator('.flyva-clone')).toHaveCount(0);
		const rec = await recording(page);
		expect(rec.keys).toEqual(['historyTransition']);
	});
});
