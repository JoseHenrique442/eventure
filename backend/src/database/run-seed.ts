import database from '../config/database';

const counts = database.prepare(`
  SELECT
    (SELECT COUNT(*) FROM events) AS events,
    (SELECT COUNT(*) FROM activities) AS activities,
    (SELECT COUNT(*) FROM speakers) AS speakers,
    (SELECT COUNT(*) FROM tickets) AS tickets,
    (SELECT COUNT(*) FROM evaluations) AS evaluations
`).get();

console.log('Dados de demonstração disponíveis:', counts);
database.close();
