import { expect, type Page, test } from '@playwright/test';

import { pathUrl, waitForTransitionIdle } from './support/helpers';

type Strategy = 'noop' | 'snapshot' | 'intercept' | 'off';

async function useStrategy(page: Page, strategy: Strategy) {
	await page.addInitScript(value => {
		sessionStorage.setItem('flyva-demo:history', value);
	}, JSON.stringify({ strategy }));
}

async function scrollTo(page: Page, top: number) {
	await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
	await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(top);
	await page.waitForTimeout(250);
}

const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));

/** Clicks without Playwright scrolling the link into view first. */
async function clickLink(page: Page, selector: string) {
	await page.evaluate(sel => (document.querySelector(sel) as HTMLElement).click(), selector);
}

async function open(page: Page, path: string, heading: string) {
	await page.goto(path);
	await waitForTransitionIdle(page);
	await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

async function navigate(page: Page, selector: string, path: string, heading: string) {
	await clickLink(page, selector);
	await page.waitForURL(pathUrl(path));
	await waitForTransitionIdle(page);
	await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

async function traverse(page: Page, direction: 'back' | 'forward', path: string) {
	if (direction === 'back') await page.goBack({ waitUntil: 'commit' });
	else await page.goForward({ waitUntil: 'commit' });
	await page.waitForURL(pathUrl(path));
	await waitForTransitionIdle(page);
}

const aboutLink = 'nav[data-demo-nav] a[href^="/about"]';
const historyDemoLink = 'nav[data-demo-nav] a[href^="/history-demo"]';
const bypassLink = 'nav[data-demo-nav] a[href^="/bypass"]';

test.describe('scroll', () => {
	test('push keeps the position during leave and lands at the top', async ({ page }) => {
		await useStrategy(page, 'snapshot');
		await open(page, '/scroll-demo', 'Scroll');
		await scrollTo(page, 1500);

		await page.evaluate(() => {
			const samples: Array<[string, number]> = [];
			(window as unknown as { __scrollSamples: typeof samples }).__scrollSamples = samples;
			const tick = () => {
				samples.push([location.pathname, Math.round(window.scrollY)]);
				requestAnimationFrame(tick);
			};
			tick();
		});

		await navigate(page, aboutLink, '/about', 'About');

		const samples = await page.evaluate(
			() => (window as unknown as { __scrollSamples: Array<[string, number]> }).__scrollSamples,
		);
		const beforeSwap = samples.filter(([path]) => path.startsWith('/scroll-demo'));
		expect(beforeSwap.length).toBeGreaterThan(0);
		expect(beforeSwap.every(([, y]) => y === 1500)).toBe(true);
		expect(await scrollY(page)).toBe(0);
	});

	for (const strategy of ['noop', 'snapshot', 'intercept', 'off'] as const) {
		test(`${strategy}: back restores the saved position`, async ({ page }) => {
			await useStrategy(page, strategy);
			await open(page, '/scroll-demo', 'Scroll');
			await scrollTo(page, 1500);
			await navigate(page, aboutLink, '/about', 'About');

			await traverse(page, 'back', '/scroll-demo');

			await expect.poll(() => scrollY(page)).toBe(1500);
			if (strategy !== 'off') {
				await expect(page.locator('html')).toHaveAttribute('data-demo-scroll-restored', '1500');
			}
		});
	}

	test('back and forward each restore their own entry', async ({ page }) => {
		await useStrategy(page, 'snapshot');
		await open(page, '/scroll-demo', 'Scroll');
		await scrollTo(page, 1200);
		await navigate(page, historyDemoLink, '/history-demo', 'History');

		await traverse(page, 'back', '/scroll-demo');
		await expect.poll(() => scrollY(page)).toBe(1200);

		await traverse(page, 'forward', '/history-demo');
		await expect.poll(() => scrollY(page)).toBe(0);

		await traverse(page, 'back', '/scroll-demo');
		await expect.poll(() => scrollY(page)).toBe(1200);
	});

	test('reload restores the position', async ({ page }) => {
		await useStrategy(page, 'snapshot');
		await open(page, '/scroll-demo', 'Scroll');
		await scrollTo(page, 1300);

		await page.reload();

		await expect.poll(() => scrollY(page)).toBe(1300);
	});

	test('push with a hash lands on the anchor', async ({ page }) => {
		await useStrategy(page, 'snapshot');
		await open(page, '/history-demo', 'History');

		await navigate(page, 'a[href^="/scroll-demo"][href$="#section-5"]', '/scroll-demo', 'Scroll');

		await expect
			.poll(() =>
				page.evaluate(() =>
					Math.round(document.getElementById('section-5')!.getBoundingClientRect().top),
				),
			)
			.toBe(0);
	});

	test('hash-only back restores the position without a transition', async ({ page }) => {
		await useStrategy(page, 'snapshot');
		await open(page, '/scroll-demo', 'Scroll');
		await scrollTo(page, 400);

		await clickLink(page, 'a[href="#section-3"]');
		await page.waitForURL(/#section-3$/);
		await expect.poll(() => scrollY(page)).toBeGreaterThan(400);

		await page.goBack({ waitUntil: 'commit' });
		await page.waitForURL(pathUrl('/scroll-demo'));

		await expect.poll(() => scrollY(page)).toBe(400);
		await expect(page.locator('html')).not.toHaveAttribute('data-flyva-transition', /.+/);

		await page.evaluate(() => {
			(window as unknown as { __noReload: boolean }).__noReload = true;
		});
		await page.goForward({ waitUntil: 'commit' });
		await page.waitForURL(/#section-3$/);
		await expect.poll(() => scrollY(page)).toBeGreaterThan(400);
		expect(
			await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload),
		).toBe(true);
	});

	test('position is saved when leaving through a plain Next link', async ({ page }) => {
		await useStrategy(page, 'snapshot');
		await open(page, '/scroll-demo', 'Scroll');
		await scrollTo(page, 900);

		await navigate(page, bypassLink, '/bypass', 'Bypass');
		await traverse(page, 'back', '/scroll-demo');

		await expect.poll(() => scrollY(page)).toBe(900);
	});
});
