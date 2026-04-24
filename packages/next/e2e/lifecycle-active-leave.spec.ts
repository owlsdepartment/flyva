import { expect, test } from '@playwright/test';

import { waitForTransitionIdle } from './support/helpers';

test.describe('active lifecycle leave vs navigation', () => {
	test('default transition waits for long active leave before route change', async ({ page }) => {
		await page.goto('/lifecycle-demo');
		const t0 = Date.now();
		await page.getByRole('link', { name: /Go to About \(with indicator\)/ }).click();
		await page.waitForURL('**/about');
		const elapsed = Date.now() - t0;
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
		// playground ActiveProgressBar leave: 400 + 500 + 300ms; default fade ~400ms — Promise.all must take ~1200ms
		expect(elapsed).toBeGreaterThan(900);
	});

	test('concurrent transition navigates before leave animation completes', async ({ page }) => {
		await page.goto('/');
		const t0 = Date.now();
		await page.locator('nav[data-demo-nav] a[href="/work"]').click();
		await page.waitForURL('**/work');
		const elapsed = Date.now() - t0;
		await waitForTransitionIdle(page);
		await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();
		// slideTransition.leave animates ~400ms; URL must update without waiting for that
		expect(elapsed).toBeLessThan(250);
	});
});
