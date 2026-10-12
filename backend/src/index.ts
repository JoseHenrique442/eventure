import { getErrorMessage } from './utils/errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRouter from './routes/events';
import enrollmentsRouter from './routes/enrollments';
import activitiesRouter from './routes/activities';
import participantsRouter from './routes/participants';
import ticketsRouter from './routes/tickets';
import speakersRouter from './routes/speakers';
import paymentsRouter from './routes/payments';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevelopment = !origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (isLocalDevelopment || configuredOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Eventure Backend running' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/speakers', speakersRouter);
app.use('/api/payments', paymentsRouter);

// Error handling
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: getErrorMessage(err) });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
