import 'dotenv/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const tokenSecret = process.env.AUTH_SECRET || 'eventure-local-development-secret';

export interface AuthRequest extends Request {
  userId?: string;
}

interface TokenPayload {
  sub: string;
  exp: number;
}

const sign = (content: string) =>
  createHmac('sha256', tokenSecret).update(content).digest('base64url');

export const createAccessToken = (userId: string) => {
  const payload: TokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

const verifyAccessToken = (token: string): TokenPayload | null => {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(sign(encodedPayload));
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    return payload.sub && payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
};

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload) return res.status(401).json({ error: 'Token ausente ou inválido' });

  req.userId = payload.sub;
  next();
};
