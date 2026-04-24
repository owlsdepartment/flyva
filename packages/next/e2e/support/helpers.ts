import type { Page } from '@playwright/test';

export async function waitForTransitionIdle(page: Page, timeout = 20_000) {
	await page.waitForFunction(
		() => !/\bflyva-running\b/.test(document.documentElement.className),
		{ timeout },
	);
}

export function navLinkByHref(page: Page, href: string) {
	return page.locator('nav.nav a[href="' + href + '"]');
}

export function aboutLinkWithBadge(page: Page, badge: 'default' | 'bypass') {
	const href = badge === 'bypass' ? '/bypass' : '/about';
	return navLinkByHref(page, href).filter({ hasText: badge });
}
