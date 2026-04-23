import { expect, test } from '@playwright/test';

import { navLinkByHref, waitForTransitionIdle } from './support/helpers';

test.describe('history', () => {
	test('browser back returns to Home after client navigation', async ({ page }) => {
		await page.goto('/');
		await navLinkByHref(page, '/about').filter({ hasText: 'default' }).click();
		await page.waitForURL('**/about');
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();

		await page.goBack();
		await page.waitForURL('**/');
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
	});
});
