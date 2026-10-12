import { expect, Page, test } from '@playwright/test';

const DEMO_EMAIL = 'demo@eventure.local';
const DEMO_PASSWORD = 'eventure123';

async function signIn(page: Page) {
  await page.goto('/auth');
  await page.getByLabel('Email', { exact: true }).fill(DEMO_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Minha Conta' })).toBeVisible();
}

test('lista os eventos na página inicial', async ({ page }) => {
  const eventsResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/events') && response.status() === 200
  );

  await page.goto('/');
  const response = await eventsResponse;
  const events = await response.json() as unknown[];

  await expect(page.getByRole('heading', { name: 'Eventos em Destaque' })).toBeVisible();
  expect(events.length).toBeGreaterThan(0);
  await expect(page.getByTestId('event-card')).toHaveCount(events.length);

  const summit = page.getByTestId('event-card').filter({ hasText: 'Tech Summit Eventure' });
  await expect(summit.getByRole('heading', { name: 'Tech Summit Eventure' })).toBeVisible();
  await expect(summit).toContainText('Centro de Convenções Frei Caneca');
  await expect(summit.getByRole('img', { name: 'Tech Summit Eventure' })).toBeVisible();
});

test('autentica e mantém a sessão após recarregar', async ({ page }) => {
  await signIn(page);

  await page.getByRole('button', { name: 'Minha Conta' }).click();
  await expect(page.getByText(DEMO_EMAIL)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Minha Conta' })).toBeVisible();
  await page.getByRole('button', { name: 'Minha Conta' }).click();
  await expect(page.getByText(DEMO_EMAIL)).toBeVisible();
});

test('rejeita autenticação com senha incorreta', async ({ page }) => {
  await page.goto('/auth');
  await page.getByLabel('Email', { exact: true }).fill(DEMO_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta');

  const signInResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/auth/signin') && response.status() === 401
  );
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await signInResponse;

  await expect(page).toHaveURL('/auth');
  await expect(page.getByText('Email ou senha inválidos', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Minha Conta' })).toHaveCount(0);
});

test('cria uma inscrição e abre o checkout com o valor correto', async ({ page }) => {
  await signIn(page);

  const eventCard = page.getByTestId('event-card').filter({ hasText: 'Women in Tech Brasil' });
  await eventCard.getByRole('link', { name: 'Ver Detalhes' }).click();
  await expect(page.getByRole('heading', { name: 'Women in Tech Brasil' })).toBeVisible();

  await page.getByRole('button', { name: 'Inscrever-se no Evento' }).click();
  const dialog = page.getByRole('dialog', { name: 'Inscrição no Evento' });
  await expect(dialog).toBeVisible();
  await dialog.getByTestId('ticket-option').filter({ hasText: 'inteira' }).getByRole('radio').click();
  await dialog.getByLabel('Nome Completo *').fill('Usuário Demonstração');
  await dialog.getByLabel('Email *').fill(DEMO_EMAIL);
  await dialog.getByLabel('Telefone *').fill('(11) 99999-0000');
  await dialog.getByTestId('participant-type-profissional').click();

  const enrollmentResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/enrollments') &&
      response.request().method() === 'POST' && response.status() === 201
  );
  await dialog.getByRole('button', { name: 'Confirmar Inscrição' }).click();
  await enrollmentResponse;

  await expect(page).toHaveURL(/\/checkout\/[a-f0-9]+\?price=179\.9/);
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  // Valor permanece o mesmo para passar no Chech
  await expect(page.getByText('R$ 179.90', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Women in Tech Brasil' })).toBeVisible();
});
