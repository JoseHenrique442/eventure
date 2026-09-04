import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const API_PORT = '3103';
const API_URL = `http://127.0.0.1:${API_PORT}`;
const rootDirectory = resolve('.');
const dataDirectory = resolve(rootDirectory, 'backend', 'data');
const resultDirectory = resolve(rootDirectory, 'test-results', 'jmeter');
const planFile = resolve(rootDirectory, 'tests', 'jmeter', 'eventure.jmx');
let backend;

function removeTestDatabase() {
  for (const suffix of ['', '-shm', '-wal']) {
    const file = resolve(dataDirectory, `jmeter.sqlite${suffix}`);
    assert.ok(file.startsWith(dataDirectory), 'Banco de teste fora do diretório permitido');
    rmSync(file, { force: true });
  }
}

function prepareResultDirectory() {
  assert.ok(resultDirectory.startsWith(rootDirectory), 'Resultados fora do projeto');
  rmSync(resultDirectory, { recursive: true, force: true });
  mkdirSync(resultDirectory, { recursive: true });
}

function executableCandidates() {
  const executable = process.platform === 'win32' ? 'jmeter.bat' : 'jmeter';
  const candidates = [];
  if (process.env.JMETER_BIN) candidates.push(resolve(process.env.JMETER_BIN));
  if (process.env.JMETER_HOME) candidates.push(resolve(process.env.JMETER_HOME, 'bin', executable));
  for (const entry of (process.env.PATH || '').split(delimiter).filter(Boolean)) {
    candidates.push(resolve(entry, executable));
  }
  return candidates;
}

function findJMeter() {
  const candidate = executableCandidates().find(existsSync);
  if (candidate && process.platform === 'win32') {
    const launcher = resolve(dirname(candidate), 'ApacheJMeter.jar');
    if (existsSync(launcher)) {
      return { command: 'java', prefixArguments: ['-jar', launcher], cwd: dirname(launcher) };
    }
  }
  if (candidate) return { command: candidate, prefixArguments: [], cwd: rootDirectory };
  throw new Error(
    'Apache JMeter não encontrado. Instale o JMeter 5.6.3 e adicione bin ao PATH, ' +
    'ou defina JMETER_HOME (ou JMETER_BIN).'
  );
}

async function waitForBackend() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (backend.exitCode !== null) throw new Error('O backend encerrou antes de iniciar.');
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch {
      // O serviço ainda está iniciando.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error('Tempo esgotado aguardando o backend de testes.');
}

function stopBackend() {
  if (!backend?.pid || backend.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(backend.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try { process.kill(-backend.pid, 'SIGTERM'); } catch { /* já encerrado */ }
  }
}

function assertSuccessfulResults(resultFile, users, loops) {
  const lines = readFileSync(resultFile, 'utf8').trim().split(/\r?\n/);
  assert.ok(lines.length > 1, 'O JMeter não produziu amostras.');
  const columns = lines[0].split(';');
  const successIndex = columns.indexOf('success');
  const labelIndex = columns.indexOf('label');
  assert.notEqual(successIndex, -1, 'A coluna success não foi encontrada no JTL.');
  const samples = lines.slice(1).map((line) => line.split(';'));
  const failures = samples
    .filter((values) => values[successIndex] !== 'true')
    .map((values) => values[labelIndex] || 'Amostra sem nome');
  assert.deepEqual(failures, [], `Amostras com falha: ${failures.join(', ')}`);

  const expectedLabels = [
    'Teste 1 - Listagem de eventos',
    'GET /api/events',
    'Teste 2 - Autenticação e sessão',
    'POST /api/auth/signin',
    'GET /api/auth/me',
    'Teste 3 - Inscrição e checkout',
    'GET /api/participants/by-user',
    'GET /api/tickets/by-event',
    'POST /api/enrollments',
    'GET /api/enrollments/{id} - checkout',
  ];
  const labels = samples.map((values) => values[labelIndex]);
  const executions = users * loops;
  assert.equal(
    labels.length,
    expectedLabels.length * executions,
    'Quantidade inesperada de amostras no JTL.'
  );
  for (const label of expectedLabels) {
    assert.equal(
      labels.filter((sampleLabel) => sampleLabel === label).length,
      executions,
      `Quantidade incorreta de execuções para: ${label}`
    );
  }
}

function runScenario(jmeter, { name, slug, users, rampUp, loops }) {
  const scenarioDirectory = resolve(resultDirectory, slug);
  mkdirSync(scenarioDirectory, { recursive: true });
  const resultFile = resolve(scenarioDirectory, 'results.jtl');
  const logFile = resolve(scenarioDirectory, 'jmeter.log');
  const reportDirectory = resolve(scenarioDirectory, 'report');

  console.log(`\nExecutando ${name}: ${users} usuário(s), ramp-up ${rampUp}s, ${loops} repetição(ões).`);
  const run = spawnSync(jmeter.command, [
    ...jmeter.prefixArguments,
    '-n',
    '-t', planFile,
    '-l', resultFile,
    '-j', logFile,
    '-e',
    '-o', reportDirectory,
    `-Japi_port=${API_PORT}`,
    `-Jusers=${users}`,
    `-Jramp_up=${rampUp}`,
    `-Jloops=${loops}`,
    '-Jjmeter.save.saveservice.output_format=csv',
    '-Jjmeter.save.saveservice.default_delimiter=;',
    '-Jjmeter.save.saveservice.print_field_names=true',
  ], {
    cwd: jmeter.cwd,
    shell: false,
    stdio: 'inherit',
  });
  if (run.error) throw run.error;
  assert.equal(run.status, 0, `O JMeter terminou com erro no cenário ${name}.`);
  assert.ok(existsSync(resultFile), `O JMeter não gerou resultados para ${name}.`);
  assertSuccessfulResults(resultFile, users, loops);

  const statisticsFile = resolve(reportDirectory, 'statistics.json');
  assert.ok(existsSync(statisticsFile), `O relatório não foi gerado para ${name}.`);
  const total = JSON.parse(readFileSync(statisticsFile, 'utf8')).Total;
  return {
    scenario: name,
    users,
    rampUpSeconds: rampUp,
    loops,
    requests: total.sampleCount,
    averageMs: Number(total.meanResTime.toFixed(2)),
    medianMs: Number(total.medianResTime.toFixed(2)),
    p90Ms: Number(total.pct1ResTime.toFixed(2)),
    maxMs: Number(total.maxResTime.toFixed(2)),
    errorPercentage: Number(total.errorPct.toFixed(2)),
    requestsPerSecond: Number(total.throughput.toFixed(2)),
  };
}

function writeComparison(results) {
  writeFileSync(
    resolve(resultDirectory, 'comparison.json'),
    `${JSON.stringify(results, null, 2)}\n`,
    'utf8'
  );
  const rows = results.map((result) =>
    `| ${result.scenario} | ${result.users} | ${result.rampUpSeconds}s | ${result.loops} | ` +
    `${result.requests} | ${result.averageMs} ms | ${result.p90Ms} ms | ` +
    `${result.errorPercentage}% | ${result.requestsPerSecond} req/s |`
  );
  writeFileSync(resolve(resultDirectory, 'COMPARISON.md'), [
    '# Comparação dos cenários JMeter',
    '',
    '| Cenário | Usuários | Ramp-up | Repetições | Requisições | Média | P90 | Erros | Throughput |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows,
    '',
    'Resultados produzidos localmente. Compare aumento de latência, taxa de erros e throughput.',
    '',
  ].join('\n'), 'utf8');
}

async function main() {
  const jmeter = findJMeter();
  removeTestDatabase();
  prepareResultDirectory();

  const build = spawnSync('npm', ['--prefix', 'backend', 'run', 'build'], {
    cwd: rootDirectory,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  assert.equal(build.status, 0, 'O build do backend falhou.');

  backend = spawn('npm', ['--prefix', 'backend', 'start'], {
    cwd: rootDirectory,
    env: {
      ...process.env,
      PORT: API_PORT,
      SQLITE_PATH: 'data/jmeter.sqlite',
      AUTH_SECRET: 'eventure-jmeter-test-secret',
      DEMO_USER_PASSWORD: 'eventure123',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });

  try {
    await waitForBackend();
    const results = [
      runScenario(jmeter, { name: 'Carga base', slug: '1-user', users: 1, rampUp: 1, loops: 1 }),
      runScenario(jmeter, { name: 'Carga concorrente', slug: '10-users', users: 10, rampUp: 10, loops: 1 }),
    ];
    writeComparison(results);
    console.table(results);
    console.log('JMeter: os 2 cenários de carga foram executados sem falhas.');
  } finally {
    stopBackend();
  }
}

main().catch((error) => {
  stopBackend();
  console.error(error.message);
  process.exitCode = 1;
});
