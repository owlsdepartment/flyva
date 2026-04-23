import { expect, test } from '@playwright/test';

import { navLinkByHref, waitForTransitionIdle } from './support/helpers';

test.describe('navigation', () => {
	test('home loads with nav and main content', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('navigation')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
	});

	test('FlyvaLink navigates to About with default transition', async ({ page }) => {
		await page.goto('/');
		await navLinkByHref(page, '/about').filter({ hasText: 'default' }).click();
		await page.waitForURL('**/about');
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
	});

	test('FlyvaLink with flyvaTransition navigates to Work', async ({ page }) => {
		await page.goto('/');
		await navLinkByHref(page, '/work').click();
		await page.waitForURL('**/work');
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();
	});
});
