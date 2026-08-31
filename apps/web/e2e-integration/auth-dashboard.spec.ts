import { expect, test } from '@playwright/test';

test('uses the real API for registration, device, PIN and dashboard', async ({ page, request }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await request.post(`${process.env.E2E_API_URL ?? 'http://127.0.0.1:3001'}/auth/studio/register`, {
    data: {
      studioName: `Studio E2E ${suffix}`,
      email: `admin-${suffix}@example.test`,
      password: 'E2ePassword!123',
      adminName: 'Admin E2E',
      adminPin: '9071',
      deviceName: 'Playwright E2E',
    },
  });
  expect(response.status()).toBe(201);

  await page.goto('/login');
  await page.getByLabel('E-mail do estudio').fill(`admin-${suffix}@example.test`);
  await page.getByLabel('Senha').fill('E2ePassword!123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/unlock$/);
  for (const digit of ['9', '0', '7', '1']) await page.getByRole('button', { name: digit, exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Aulas de hoje')).toBeVisible();
  for (const label of ['Presencas pendentes', 'Pagamentos vencidos', 'Pagamentos proximos', 'Cadastros aguardando revisao', 'Avaliacoes pendentes', 'Reposicoes disponiveis', 'Reposicoes em 30 dias', 'Reposicoes em 7 dias', 'Horarios proximos da capacidade']) {
    await expect(page.getByText(label)).toBeVisible();
  }
});
