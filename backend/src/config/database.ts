import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { seedDatabase } from '../database/seed';

dotenv.config();

const databasePath = path.resolve(process.cwd(), process.env.SQLITE_PATH || 'data/eventure.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
  );
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    location TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('presencial', 'online', 'hibrido')),
    image_url TEXT,
    organizer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    activity_date TEXT NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0),
    activity_type TEXT NOT NULL CHECK (activity_type IN ('palestra', 'oficina', 'mesa_redonda')),
    location TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS speakers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    speaker_type TEXT NOT NULL CHECK (speaker_type IN ('especialista', 'celebridade')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS activity_speakers (
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, speaker_id)
  );
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('estudante', 'profissional', 'vip')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    participant_id TEXT NOT NULL UNIQUE REFERENCES participants(id) ON DELETE CASCADE,
    instituicao_ensino TEXT,
    matricula TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    participant_id TEXT NOT NULL UNIQUE REFERENCES participants(id) ON DELETE CASCADE,
    empresa TEXT,
    cargo TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS specialists (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    speaker_id TEXT NOT NULL UNIQUE REFERENCES speakers(id) ON DELETE CASCADE,
    area_atuacao TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS celebrities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    speaker_id TEXT NOT NULL UNIQUE REFERENCES speakers(id) ON DELETE CASCADE,
    area_fama TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS lectures (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    activity_id TEXT NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    tema TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workshops (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    activity_id TEXT NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    instrutor TEXT NOT NULL,
    vagas INTEGER NOT NULL CHECK (vagas >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('meia', 'inteira', 'vip')),
    price REAL NOT NULL CHECK (price >= 0),
    quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE SET NULL,
    enrollment_status TEXT NOT NULL DEFAULT 'pendente' CHECK (enrollment_status IN ('pendente', 'confirmada', 'cancelada')),
    enrollment_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmation_code TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    payment_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount REAL NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cartao_credito', 'cartao_debito', 'pix', 'boleto')),
    payment_status TEXT NOT NULL DEFAULT 'pendente',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS check_ins (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    check_in_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    qr_code TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    issue_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    certificate_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    evaluation_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_activities_event ON activities(event_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_participant ON enrollments(participant_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_event ON enrollments(event_id);
  CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
  CREATE TRIGGER IF NOT EXISTS update_events_timestamp
  AFTER UPDATE ON events FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
  BEGIN
    UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

const getInsertedId = (table: string, rowId: number | bigint) => {
  const row = database.prepare(`SELECT id FROM ${table} WHERE rowid = ?`).get(rowId) as { id: string };
  return row.id;
};

seedDatabase(database);

export interface QueryResult {
  insertId: string | number;
  affectedRows: number;
}

export const queryRows = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> => {
  return database.prepare(sql).all(...params) as T[];
};

export const query = async (sql: string, params: unknown[] = []): Promise<QueryResult> => {
  const statement = database.prepare(sql);

  const result = statement.run(...params);
  const insertedTable = /^\s*INSERT\s+INTO\s+([a-z_]+)/i.exec(sql)?.[1];
  return {
    insertId: insertedTable ? getInsertedId(insertedTable, result.lastInsertRowid) : Number(result.lastInsertRowid),
    affectedRows: result.changes,
  } satisfies QueryResult;
};

export const transaction = <T>(operation: () => T): T => database.transaction(operation)();
export default database;
