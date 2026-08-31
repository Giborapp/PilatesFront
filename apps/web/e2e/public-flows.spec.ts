import { expect, test } from '@playwright/test';

test.describe('public flows', () => {
  test('submits a public intake and shows confirmation', async ({ page }) => {
    await page.route('**/public/anamnese/test-token', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            studio: { name: 'Estudio Falso', brandColor: '#0f766e' },
            template: { name: 'Anamnese inicial', fields: [] },
          }),
        });
        return;
      }
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
    });

    await page.goto('/public/anamnese/test-token');
    await page.getByLabel('Nome completo').fill('Pessoa Falsa');
    await page.getByLabel('Data de nascimento').fill('1990-01-01');
    await page.getByLabel('Telefone/WhatsApp').fill('11999999999');
    await page.getByLabel('Contato de emergencia').fill('Contato Falso');
    await page.getByLabel('Telefone de emergencia').fill('11888888888');
    await page.getByLabel('Aceito o aviso de privacidade').check();
    await page.getByLabel('Declaro que as informacoes sao verdadeiras').check();
    await page.getByRole('button', { name: /enviar/i }).click();
    await expect(page.getByRole('heading', { name: /formulario enviado/i })).toBeVisible();
  });

  test('reserves a public replacement slot', async ({ page }) => {
    await page.route('**/replacement-links/test-token', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            studio: { name: 'Estudio Falso', brandColor: '#0f766e' },
            expiresAt: '2099-01-01T00:00:00.000Z',
            sessions: [{ id: 'session-1', startsAt: '2099-01-02T10:00:00.000Z', professionalName: 'Profissional Falso' }],
          }),
        });
        return;
      }
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ startsAt: '2099-01-02T10:00:00.000Z' }) });
    });
    await page.route('**/replacement-links/test-token/reserve', async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ startsAt: '2099-01-02T10:00:00.000Z' }) });
    });

    await page.goto('/public/reposicao/test-token');
    await page.getByRole('button', { name: /profissional falso/i }).click();
    await expect(page.getByRole('heading', { name: /reposicao agendada/i })).toBeVisible();
  });
});
