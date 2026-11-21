import { expect, test } from '@playwright/test';

import { navLinkByHref, pathUrl, waitForTransitionIdle } from './support/helpers';

test.describe('navigation', () => {
	test('home loads with nav and main content', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('navigation')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
	});

	test('FlyvaLink navigates to About with default transition', async ({ page }) => {
		await page.goto('/');
		await navLinkByHref(page, '/about').filter({ hasText: 'default' }).click();
		await page.waitForURL(pathUrl('/about'));
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
	});

	test('FlyvaLink navigates to Work (condition-selected slide)', async ({ page }) => {
		await page.goto('/');
		await navLinkByHref(page, '/work').click();
		await page.waitForURL(pathUrl('/work'));
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();
	});
});
