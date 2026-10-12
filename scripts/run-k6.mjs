import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const API_PORT = '3104';
const API_URL = `http://127.0.0.1:${API_PORT}`;
const rootDirectory = resolve('.');
const dataDirectory = resolve(rootDirectory, 'backend', 'data');
const resultDirectory = resolve(rootDirectory, 'test-results', 'k6');
const testFile = resolve(rootDirectory, 'tests', 'k6', 'eventure.js');
const testDatabaseName = `k6-${process.pid}-${Date.now()}.sqlite`;
let backend;

function removeTestDatabase() {
  for (const suffix of ['', '-shm', '-wal']) {
    const file = resolve(dataDirectory, `${testDatabaseName}${suffix}`);
    assert.ok(file.startsWith(dataDirectory), 'Banco de teste fora do diretório permitido');
    try {
      rmSync(file, { force: true });
    } catch (error) {
      if (error?.code !== 'EBUSY') throw error;
      console.warn(`Aviso: o Windows ainda mantém ${file} aberto; ele pode ser removido depois.`);
    }
  }
}

function prepareResultDirectory() {
  assert.ok(resultDirectory.startsWith(rootDirectory), 'Resultados fora do projeto');
  rmSync(resultDirectory, { recursive: true, force: true });
  mkdirSync(resultDirectory, { recursive: true });
}

function findK6() {
  const executable = process.platform === 'win32' ? 'k6.exe' : 'k6';
  const candidates = [];
  if (process.env.K6_BIN) candidates.push(resolve(process.env.K6_BIN));
  for (const entry of (process.env.PATH || '').split(delimiter).filter(Boolean)) candidates.push(resolve(entry, executable));
  const candidate = candidates.find(existsSync);
  if (candidate) return candidate;
  throw new Error('Grafana k6 não encontrado. Instale o k6 e adicione-o ao PATH, ou defina K6_BIN.');
}

async function waitForBackend() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (backend.exitCode !== null) throw new Error('O backend encerrou antes de iniciar.');
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch { /* O serviço ainda está iniciando. */ }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error('Tempo esgotado aguardando o backend de testes.');
}

function stopBackend() {
  if (!backend?.pid || backend.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(backend.pid), '/T', '/F'], { stdio: 'ignore', timeout: 5_000 });
  }
  else try { process.kill(-backend.pid, 'SIGTERM'); } catch { /* já encerrado */ }
}

function metricValue(summary, metric, property) {
  const value = summary.metrics?.[metric]?.values?.[property];
  assert.equal(typeof value, 'number', `Métrica ausente no resumo do k6: ${metric}.${property}`);
  return value;
}

function runScenario(k6, { name, slug, users, rampUp, loops }) {
  const scenarioDirectory = resolve(resultDirectory, slug);
  mkdirSync(scenarioDirectory, { recursive: true });
  const summaryFile = resolve(scenarioDirectory, 'summary.json');

  console.log(`\nExecutando ${name}: ${users} usuário(s), ramp-up ${rampUp}s, ${loops} repetição(ões).`);
  const run = spawnSync(k6, ['run', '--quiet', testFile], {
    cwd: rootDirectory,
    env: { ...process.env, API_URL, USERS: String(users), RAMP_UP_SECONDS: String(rampUp), LOOPS: String(loops), SUMMARY_PATH: summaryFile },
    shell: false,
    stdio: 'inherit',
  });
  if (run.error) throw run.error;
  assert.equal(run.status, 0, `O k6 terminou com erro no cenário ${name}.`);
  assert.ok(existsSync(summaryFile), `O k6 não gerou o resumo para ${name}.`);

  const summary = JSON.parse(readFileSync(summaryFile, 'utf8'));
  assert.equal(metricValue(summary, 'iterations', 'count'), users * loops, 'Número inesperado de iterações.');
  assert.equal(
    metricValue(summary, 'business_requests', 'count'),
    users * loops * 7,
    'Número inesperado de requisições de negócio.'
  );
  assert.equal(metricValue(summary, 'checks', 'rate'), 1, 'Um ou mais checks falharam.');

  return {
    scenario: name, users, rampUpSeconds: rampUp, loops,
    requests: metricValue(summary, 'http_reqs', 'count'),
    averageMs: Number(metricValue(summary, 'http_req_duration', 'avg').toFixed(2)),
    medianMs: Number(metricValue(summary, 'http_req_duration', 'med').toFixed(2)),
    p90Ms: Number(metricValue(summary, 'http_req_duration', 'p(90)').toFixed(2)),
    maxMs: Number(metricValue(summary, 'http_req_duration', 'max').toFixed(2)),
    errorPercentage: Number((metricValue(summary, 'http_req_failed', 'rate') * 100).toFixed(2)),
    requestsPerSecond: Number(metricValue(summary, 'http_reqs', 'rate').toFixed(2)),
  };
}

function writeComparison(results) {
  writeFileSync(resolve(resultDirectory, 'comparison.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  const rows = results.map((result) =>
    `| ${result.scenario} | ${result.users} | ${result.rampUpSeconds}s | ${result.loops} | ${result.requests} | ` +
    `${result.averageMs} ms | ${result.p90Ms} ms | ${result.errorPercentage}% | ${result.requestsPerSecond} req/s |`
  );
  writeFileSync(resolve(resultDirectory, 'COMPARISON.md'), [
    '# Comparação dos cenários Grafana k6', '',
    '| Cenário | Usuários | Ramp-up | Repetições | Requisições | Média | P90 | Erros | Throughput |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows, '',
    'Resultados produzidos localmente. Compare aumento de latência, taxa de erros e throughput.', '',
  ].join('\n'), 'utf8');
}

async function main() {
  const k6 = findK6();
  removeTestDatabase();
  prepareResultDirectory();
  const build = spawnSync('npm', ['--prefix', 'backend', 'run', 'build'], {
    cwd: rootDirectory, shell: process.platform === 'win32', stdio: 'inherit',
  });
  assert.equal(build.status, 0, 'O build do backend falhou.');

  backend = spawn(process.execPath, ['dist/index.js'], {
    cwd: resolve(rootDirectory, 'backend'),
    env: { ...process.env, PORT: API_PORT, SQLITE_PATH: `data/${testDatabaseName}`, AUTH_SECRET: 'eventure-k6-test-secret', DEMO_USER_PASSWORD: 'eventure123' },
    shell: false, stdio: 'ignore', detached: process.platform !== 'win32',
  });
  try {
    await waitForBackend();
    const results = [
      runScenario(k6, { name: 'Carga base', slug: '1-user', users: 1, rampUp: 1, loops: 1 }),
      runScenario(k6, { name: 'Carga concorrente', slug: '10-users', users: 10, rampUp: 10, loops: 1 }),
    ];
    writeComparison(results);
    console.table(results);
    console.log('Grafana k6: os 2 cenários de carga foram executados sem falhas.');
  } finally {
    stopBackend();
    removeTestDatabase();
  }
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  stopBackend();
  console.error(error.message);
  process.exit(1);
});
