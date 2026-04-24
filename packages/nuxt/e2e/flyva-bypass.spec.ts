import { expect, test } from '@playwright/test';

import { aboutLinkWithBadge, waitForTransitionIdle } from './support/helpers';

test.describe('FlyvaLink bypass', () => {
	test('bypass link navigates to bypass page', async ({ page }) => {
		await page.goto('/');
		await aboutLinkWithBadge(page, 'bypass').click();
		await page.waitForURL('**/bypass');
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'Bypass' })).toBeVisible();
	});
});
