import { spawn } from 'node:child_process';

const npmCli = process.env.npm_execpath;
const isBun = process.env.npm_config_user_agent?.startsWith('bun/');
if (!npmCli) throw new Error('Não foi possível localizar o gerenciador de pacotes.');

const command = isBun ? npmCli : process.execPath;
const runArguments = (script) => isBun
  ? ['run', script]
  : [npmCli, 'run', script];

const processes = [
  spawn(command, runArguments('dev:frontend'), { stdio: 'inherit' }),
  spawn(command, runArguments('dev:backend'), { stdio: 'inherit' }),
];

let stopping = false;
const stopAll = (exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  for (const process of processes) {
    if (!process.killed) process.kill('SIGTERM');
  }
  setTimeout(() => globalThis.process.exit(exitCode), 500);
};

for (const process of processes) {
  process.on('error', (error) => {
    console.error(error.message);
    stopAll(1);
  });
  process.on('exit', (code) => {
    if (!stopping) stopAll(code ?? 1);
  });
}

globalThis.process.on('SIGINT', () => stopAll());
globalThis.process.on('SIGTERM', () => stopAll());
