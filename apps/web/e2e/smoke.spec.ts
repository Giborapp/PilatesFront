import { test, expect } from '@playwright/test';

test('renders login page', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Entrar no estudio' })).toBeVisible();
  await expect(page.getByLabel('E-mail do estudio')).toBeVisible();
});
