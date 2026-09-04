import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser, Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const FRONTEND_URL = 'http://127.0.0.1:4174';
const API_URL = 'http://127.0.0.1:3102';
const DEMO_EMAIL = 'demo@eventure.local';
const DEMO_PASSWORD = 'eventure123';
const services = [];

function removeTestDatabase() {
  const dataDirectory = resolve('backend', 'data');
  for (const suffix of ['', '-shm', '-wal']) {
    const file = resolve(dataDirectory, `selenium.sqlite${suffix}`);
    assert.ok(file.startsWith(dataDirectory), 'Banco de teste fora do diretório permitido');
    rmSync(file, { force: true });
  }
}

function runService(command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
  child.stderr.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
  child.recentOutput = () => output;
  services.push(child);
  return child;
}

async function waitForService(url, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Serviço encerrou antes de iniciar:\n${child.recentOutput()}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // O serviço ainda está iniciando.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Tempo esgotado aguardando ${url}\n${child.recentOutput()}`);
}

function stopService(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* já encerrado */ }
  }
}

async function createDriver() {
  const options = new chrome.Options()
    .addArguments('--headless=new', '--window-size=1440,1000', '--disable-dev-shm-usage');
  const driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
  await driver.manage().setTimeouts({ pageLoad: 20_000, script: 10_000 });
  return driver;
}

async function visible(driver, locator, timeout = 10_000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

async function signIn(driver) {
  await driver.get(`${FRONTEND_URL}/auth`);
  await (await visible(driver, By.css('[data-testid="signin-email"]'))).sendKeys(DEMO_EMAIL);
  await (await visible(driver, By.css('[data-testid="signin-password"]'))).sendKeys(DEMO_PASSWORD);
  await (await visible(driver, By.css('[data-testid="signin-submit"]'))).click();
  await driver.wait(async () => new URL(await driver.getCurrentUrl()).pathname === '/', 10_000);
  await visible(driver, By.css('[data-testid="account-menu"]'));
}

async function withDriver(testName, callback) {
  const driver = await createDriver();
  try {
    await callback(driver);
  } catch (error) {
    mkdirSync(resolve('test-results', 'selenium'), { recursive: true });
    writeFileSync(
      resolve('test-results', 'selenium', `${testName}.png`),
      await driver.takeScreenshot(),
      'base64'
    );
    throw error;
  } finally {
    await driver.quit();
  }
}

before(async () => {
  removeTestDatabase();
  const build = spawnSync('npm', ['--prefix', 'backend', 'run', 'build'], {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  assert.equal(build.status, 0, 'O build do backend falhou');

  const backend = runService('npm', ['--prefix', 'backend', 'start'], {
    PORT: '3102',
    SQLITE_PATH: 'data/selenium.sqlite',
    AUTH_SECRET: 'eventure-selenium-test-secret',
    DEMO_USER_PASSWORD: DEMO_PASSWORD,
  });
  const frontend = runService('bunx', ['vite', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
    VITE_API_URL: `${API_URL}/api`,
  });

  await Promise.all([
    waitForService(`${API_URL}/health`, backend),
    waitForService(FRONTEND_URL, frontend),
  ]);
}, { timeout: 120_000 });

after(() => {
  for (const service of services) stopService(service);
});

test('lista os eventos na página inicial', async () => {
  await withDriver('listagem-eventos', async (driver) => {
    const expectedEvents = await fetch(`${API_URL}/api/events`).then((response) => response.json());
    await driver.get(FRONTEND_URL);
    await visible(driver, By.xpath("//h2[normalize-space(.)='Eventos em Destaque']"));
    await driver.wait(
      async () => (await driver.findElements(By.css('[data-testid="event-card"]'))).length === expectedEvents.length,
      10_000
    );

    assert.ok(expectedEvents.length > 0);
    const cards = await driver.findElements(By.css('[data-testid="event-card"]'));
    const summit = (await Promise.all(cards.map(async (card) => ({ card, text: await card.getText() }))))
      .find(({ text }) => text.includes('Tech Summit Eventure'))?.card;
    assert.ok(summit, 'Card do Tech Summit não encontrado');
    assert.match(await summit.getText(), /Centro de Convenções Frei Caneca/);
    assert.equal(await (await summit.findElement(By.css('img'))).getAttribute('alt'), 'Tech Summit Eventure');
  });
});

test('autentica e mantém a sessão após recarregar', async () => {
  await withDriver('autenticacao', async (driver) => {
    await signIn(driver);
    await (await visible(driver, By.css('[data-testid="account-menu"]'))).click();
    assert.equal(await (await visible(driver, By.xpath(`//*[normalize-space(.)='${DEMO_EMAIL}']`))).getText(), DEMO_EMAIL);

    await driver.navigate().refresh();
    await (await visible(driver, By.css('[data-testid="account-menu"]'))).click();
    assert.equal(await (await visible(driver, By.xpath(`//*[normalize-space(.)='${DEMO_EMAIL}']`))).getText(), DEMO_EMAIL);
  });
});

test('rejeita autenticação com senha incorreta', async () => {
  await withDriver('autenticacao-invalida', async (driver) => {
    await driver.get(`${FRONTEND_URL}/auth`);
    await (await visible(driver, By.css('[data-testid="signin-email"]'))).sendKeys(DEMO_EMAIL);
    await (await visible(driver, By.css('[data-testid="signin-password"]'))).sendKeys('senha-incorreta');
    await (await visible(driver, By.css('[data-testid="signin-submit"]'))).click();

    await visible(driver, By.xpath("//*[normalize-space(.)='Email ou senha inválidos']"));
    assert.equal(new URL(await driver.getCurrentUrl()).pathname, '/auth');
    assert.equal((await driver.findElements(By.css('[data-testid="account-menu"]'))).length, 0);
  });
});

test('cria uma inscrição e abre o checkout com o valor correto', async () => {
  await withDriver('inscricao-checkout', async (driver) => {
    await signIn(driver);
    const cards = await driver.findElements(By.css('[data-testid="event-card"]'));
    const eventCard = (await Promise.all(cards.map(async (card) => ({ card, text: await card.getText() }))))
      .find(({ text }) => text.includes('Women in Tech Brasil'))?.card;
    assert.ok(eventCard, 'Evento Women in Tech Brasil não encontrado');
    await (await eventCard.findElement(By.xpath(".//a[normalize-space(.)='Ver Detalhes']"))).click();

    await visible(driver, By.xpath("//h1[normalize-space(.)='Women in Tech Brasil']"));
    await (await visible(driver, By.xpath("//button[contains(., 'Inscrever-se no Evento')]"))).click();
    const dialog = await visible(driver, By.css('[role="dialog"]'));
    const ticketOptions = await dialog.findElements(By.css('[data-testid="ticket-option"]'));
    const fullTicket = (await Promise.all(ticketOptions.map(async (option) => ({ option, text: await option.getText() }))))
      .find(({ text }) => /inteira/i.test(text))?.option;
    assert.ok(fullTicket, 'Ingresso inteiro não encontrado');
    await (await fullTicket.findElement(By.css('[role="radio"]'))).click();

    const fullNameInput = await dialog.findElement(By.css('[data-testid="enrollment-full-name"]'));
    const emailInput = await dialog.findElement(By.css('[data-testid="enrollment-email"]'));
    const phoneInput = await dialog.findElement(By.css('[data-testid="enrollment-phone"]'));
    await fullNameInput.sendKeys(Key.chord(Key.CONTROL, 'a'), 'Usuário Demonstração');
    await emailInput.sendKeys(Key.chord(Key.CONTROL, 'a'), DEMO_EMAIL);
    await phoneInput.sendKeys(Key.chord(Key.CONTROL, 'a'), '(11) 99999-0000');
    await (await dialog.findElement(By.css('[data-testid="participant-type-profissional"]'))).click();
    await (await dialog.findElement(By.xpath(".//button[normalize-space(.)='Confirmar Inscrição']"))).click();

    await driver.wait(async () => /\/checkout\/[a-f0-9]+\?price=179\.9/.test(await driver.getCurrentUrl()), 10_000);
    await visible(driver, By.xpath("//h1[normalize-space(.)='Checkout']"));
    const body = await (await driver.findElement(By.css('body'))).getText();
    assert.match(body, /Women in Tech Brasil/);
    assert.match(body, /R\$ 179\.90/);
  });
});
