import { expect, test } from '@playwright/test';

import { navLinkByHref, pathUrl, waitForTransitionIdle } from './support/helpers';

test.describe('lifecycle html classes', () => {
	test('documentElement receives flyva leave/enter active classes during navigation', async ({
		page,
	}) => {
		await page.goto('/');

		const sawLifecycleClass = page.waitForFunction(
			() => /\bflyva-(leave|enter)-active\b/.test(document.documentElement.className),
			{ timeout: 15_000 },
		);

		await navLinkByHref(page, '/about').filter({ hasText: 'default' }).click();
		await sawLifecycleClass;
		await page.waitForURL(pathUrl('/about'));
		await waitForTransitionIdle(page);

		await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
	});
});
