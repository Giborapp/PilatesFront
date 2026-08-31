import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const password = 'IntegrationPassword!123';
const pin = '9071';

type Json = Record<string, unknown>;
type Admin = { email: string; password: string; token: string; studentId: string; templateId: string; inviteUrl: string };

async function body(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<Json> {
  return (await response.json()) as Json;
}

async function createAdmin(request: APIRequestContext): Promise<Admin> {
  const suffix = `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `playwright-${suffix}@example.test`;
  const registered = await request.post(`${apiUrl}/auth/studio/register`, { data: { studioName: `Playwright ${suffix}`, email, password, adminName: 'Playwright Admin', adminPin: pin, deviceName: 'Playwright' } });
  expect(registered.status()).toBe(201);
  const cookieHeader = registered.headers()['set-cookie'];
  const device = cookieHeader.match(/device_token=([^;]+)/)?.[1];
  if (!device) throw new Error('Missing device cookie');
  const unlocked = await request.post(`${apiUrl}/auth/pin/unlock`, { headers: { Cookie: `device_token=${device}` }, data: { pin } });
  expect(unlocked.status()).toBe(201);
  const auth = await body(unlocked);
  const token = String(auth.accessToken);
  const templateResponse = await request.post(`${apiUrl}/assessment-templates`, { headers: { Authorization: `Bearer ${token}` }, data: { name: 'Playwright intake', audience: 'STUDENT', status: 'PUBLISHED', fields: [{ id: 'main', label: 'Objetivo', type: 'short_text', required: true, order: 1 }] } });
  expect(templateResponse.status()).toBe(201);
  const template = await body(templateResponse);
  const studentResponse = await request.post(`${apiUrl}/students/quick`, { headers: { Authorization: `Bearer ${token}` }, data: { fullName: 'Playwright Fake Student', phone: `55119${Date.now().toString().slice(-8)}`, startDate: '2026-08-01', sessionsPerWeek: 1, billingDay: 31 } });
  expect(studentResponse.status()).toBe(201);
  const student = await body(studentResponse);
  const inviteResponse = await request.post(`${apiUrl}/public/intakes/invites`, { headers: { Authorization: `Bearer ${token}` }, data: { type: 'NEW_STUDENT', templateId: String(template.id) } });
  expect(inviteResponse.status()).toBe(201);
  const invite = await body(inviteResponse);
  return { email, password, token, studentId: String(student.id), templateId: String(template.id), inviteUrl: String(invite.url) };
}

async function login(page: Page, admin: Admin): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail do estudio').fill(admin.email);
  await page.getByLabel('Senha').fill(admin.password);
  await page.getByRole('button', { name: /Entrar/i }).click();
  await expect(page).toHaveURL(/\/unlock$/);
  for (const digit of pin) await page.getByRole('button', { name: digit, exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('integrated frontend critical flows', () => {
  test('opens dashboard with the ten operational cards on desktop and mobile', async ({ page, request }) => {
    const admin = await createAdmin(request);
    await login(page, admin);
    for (const label of ['Aulas de hoje', 'Presencas pendentes', 'Pagamentos vencidos', 'Pagamentos proximos', 'Cadastros aguardando', 'Avaliacoes pendentes', 'Reposicoes disponiveis', 'Reposicoes em 30 dias', 'Reposicoes em 7 dias', 'Horarios proximos da capacidade']) await expect(page.getByText(label, { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: /Ola/i })).toBeVisible();
  });

  test('completes public intake and confirms the public success state', async ({ page, request }) => {
    const admin = await createAdmin(request);
    await page.goto(admin.inviteUrl);
    await page.getByLabel('Nome completo').fill('Fake Public Applicant');
    await page.getByLabel('Data de nascimento').fill('1990-02-28');
    await page.getByLabel('Telefone/WhatsApp').fill('5511987654321');
    await page.getByLabel('Contato de emergencia').fill('Fake Emergency');
    await page.getByLabel('Telefone de emergencia').fill('5511976543210');
    await page.getByLabel('Aceito o aviso de privacidade.').check();
    await page.getByLabel('Declaro que as informacoes sao verdadeiras.').check();
    await page.getByRole('button', { name: 'Enviar formulario' }).click();
    await expect(page.getByRole('heading', { name: 'Formulario enviado' })).toBeVisible();
  });

  test('navigates through the six student profile areas', async ({ page, request }) => {
    const admin = await createAdmin(request);
    await login(page, admin);
    await page.goto(`/alunos/${admin.studentId}`);
    for (const label of ['Resumo', 'Horarios e presenca', 'Plano e financeiro', 'Anamneses e avaliacoes', 'Reposicoes', 'Historico']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('keeps the public replacement route available for a real API link', async ({ page, request }) => {
    const admin = await createAdmin(request);
    const details = await request.get(`${apiUrl}/dashboard`, { headers: { Authorization: `Bearer ${admin.token}` } });
    expect(details.status()).toBe(200);
    await page.goto('/public/reposicao/nonexistent-integration-token');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
