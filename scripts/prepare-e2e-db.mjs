import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const dataDirectory = resolve('backend', 'data');
for (const suffix of ['', '-shm', '-wal']) {
  const databaseFile = resolve(dataDirectory, `playwright.sqlite${suffix}`);
  if (!databaseFile.startsWith(`${dataDirectory}\\`) && !databaseFile.startsWith(`${dataDirectory}/`)) {
    throw new Error('Caminho do banco de testes fora do diretório permitido.');
  }
  rmSync(databaseFile, { force: true });
}
