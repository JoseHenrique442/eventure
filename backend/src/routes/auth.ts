import { getErrorMessage } from '../utils/errors';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import express from 'express';
import { promisify } from 'util';
import database, { transaction } from '../config/database';
import { authenticateUser, AuthRequest, createAccessToken } from '../middleware/auth';

const router = express.Router();
const scrypt = promisify(scryptCallback);

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
}

const publicUser = (user: UserRow) => ({
  id: user.id,
  email: user.email,
  user_metadata: { full_name: user.full_name },
});

const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
};

const passwordMatches = async (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const storedBuffer = Buffer.from(hash, 'hex');
  const derivedBuffer = (await scrypt(password, salt, storedBuffer.length)) as Buffer;
  return timingSafeEqual(storedBuffer, derivedBuffer);
};

router.post('/signup', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const fullName = String(req.body.fullName || '').trim();
    if (!email || !email.includes('@') || password.length < 6 || fullName.length < 3) {
      return res.status(400).json({ error: 'Dados de cadastro inválidos' });
    }

    const passwordHash = await hashPassword(password);
    const user = transaction(() => {
      const inserted = database.prepare(`
        INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?) RETURNING *
      `).get(email, passwordHash, fullName) as UserRow;
      database.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(inserted.id, 'user');
      return inserted;
    });

    const safeUser = publicUser(user);
    res.status(201).json({
      user: safeUser,
      session: { access_token: createAccessToken(user.id), user: safeUser },
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error
      && String(error.code).includes('SQLITE_CONSTRAINT_UNIQUE')) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

router.post('/signin', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

  if (!user || !(await passwordMatches(password, user.password_hash))) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  const safeUser = publicUser(user);
  res.json({
    user: safeUser,
    session: { access_token: createAccessToken(user.id), user: safeUser },
  });
});

router.get('/me', authenticateUser, (req: AuthRequest, res) => {
  const user = database.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ user: publicUser(user) });
});

export default router;
