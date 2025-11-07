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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Eventure Backend running' });
});

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/speakers', speakersRouter);
app.use('/api/payments', paymentsRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
