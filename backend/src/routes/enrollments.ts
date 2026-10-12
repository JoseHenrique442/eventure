import { getErrorMessage } from '../utils/errors';
import express from 'express';
import database, { query, queryRows, transaction } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

const parseDetails = (rows: Record<string, unknown>[]) => rows.map((row) => {
  for (const field of ['event', 'ticket', 'participant', 'payment']) {
    if (typeof row[field] === 'string') row[field] = JSON.parse(row[field]);
  }
  return row;
});

router.get('/my-enrollments', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const enrollments = await queryRows(`
      SELECT e.*,
        json_object('id', ev.id, 'name', ev.name, 'description', ev.description,
          'start_date', ev.start_date, 'end_date', ev.end_date, 'location', ev.location,
          'image_url', ev.image_url, 'event_type', ev.event_type) AS event,
        CASE WHEN t.id IS NULL THEN NULL ELSE json_object('id', t.id,
          'ticket_type', t.ticket_type, 'price', t.price, 'description', t.description) END AS ticket
      FROM enrollments e
      INNER JOIN participants p ON e.participant_id = p.id
      INNER JOIN events ev ON e.event_id = ev.id
      LEFT JOIN tickets t ON e.ticket_id = t.id
      WHERE p.user_id = ?
      ORDER BY datetime(e.enrollment_date) DESC
    `, [req.userId]);
    res.json(parseDetails(enrollments));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

router.get('/with-payment-status', authenticateUser, async (_req, res) => {
  try {
    const enrollments = await queryRows(`
      SELECT e.id, e.enrollment_status, e.enrollment_date,
        p.full_name AS participant_name, p.email AS participant_email,
        ev.name AS event_name, ev.start_date AS event_start_date,
        COALESCE(pay.payment_status, 'pendente') AS payment_status,
        pay.amount AS payment_amount, pay.payment_date
      FROM enrollments e
      INNER JOIN participants p ON e.participant_id = p.id
      INNER JOIN events ev ON e.event_id = ev.id
      LEFT JOIN payments pay ON e.id = pay.enrollment_id
      ORDER BY datetime(e.enrollment_date) DESC
    `);
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

router.post('/purchase-ticket', authenticateUser, (req: AuthRequest, res) => {
  try {
    const { participant_id, event_id, ticket_id, amount, payment_method } = req.body;
    const owner = database.prepare(
      'SELECT id FROM participants WHERE id = ? AND user_id = ?'
    ).get(participant_id, req.userId);
    if (!owner) return res.status(403).json({ error: 'Participante inválido para este usuário' });

    const result = transaction(() => {
      const ticket = database.prepare(`
        SELECT id, quantity_available FROM tickets WHERE id = ? AND event_id = ?
      `).get(ticket_id, event_id) as { id: string; quantity_available: number } | undefined;
      if (!ticket || ticket.quantity_available < 1) throw new Error('Ingresso indisponível');

      const confirmationCode = `${String(event_id).slice(0, 8)}-${Date.now()}`.toUpperCase();
      const enrollment = database.prepare(`
        INSERT INTO enrollments
          (participant_id, event_id, ticket_id, enrollment_status, confirmation_code)
        VALUES (?, ?, ?, 'confirmada', ?) RETURNING id
      `).get(participant_id, event_id, ticket_id, confirmationCode) as { id: string };
      const payment = database.prepare(`
        INSERT INTO payments (enrollment_id, amount, payment_method, payment_status)
        VALUES (?, ?, ?, 'confirmado') RETURNING id
      `).get(enrollment.id, amount, payment_method) as { id: string };
      database.prepare(
        'UPDATE tickets SET quantity_available = quantity_available - 1 WHERE id = ?'
      ).run(ticket_id);

      return {
        enrollment_id: enrollment.id,
        payment_id: payment.id,
        confirmation_code: confirmationCode,
      };
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

router.get('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const enrollments = await queryRows(`
      SELECT e.*,
        json_object('id', ev.id, 'name', ev.name, 'description', ev.description,
          'start_date', ev.start_date, 'end_date', ev.end_date, 'location', ev.location,
          'image_url', ev.image_url, 'event_type', ev.event_type) AS event,
        CASE WHEN t.id IS NULL THEN NULL ELSE json_object('id', t.id,
          'ticket_type', t.ticket_type, 'price', t.price, 'description', t.description) END AS ticket,
        json_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS participant,
        CASE WHEN pay.id IS NULL THEN NULL ELSE json_object('payment_status', pay.payment_status,
          'amount', pay.amount, 'payment_date', pay.payment_date) END AS payment
      FROM enrollments e
      INNER JOIN participants p ON e.participant_id = p.id
      INNER JOIN events ev ON e.event_id = ev.id
      LEFT JOIN tickets t ON e.ticket_id = t.id
      LEFT JOIN payments pay ON e.id = pay.enrollment_id
      WHERE e.id = ? AND p.user_id = ?
    `, [req.params.id, req.userId]);
    if (!enrollments[0]) return res.status(404).json({ error: 'Inscrição não encontrada' });
    res.json(parseDetails(enrollments)[0]);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { participant_id, event_id, ticket_id } = req.body;
    const owner = await queryRows(
      'SELECT id FROM participants WHERE id = ? AND user_id = ?',
      [participant_id, req.userId]
    );
    if (!owner.length) return res.status(403).json({ error: 'Participante inválido para este usuário' });

    const confirmationCode = `${String(event_id).slice(0, 8)}-${Date.now()}`.toUpperCase();
    const result = await query(`
      INSERT INTO enrollments (participant_id, event_id, ticket_id, enrollment_status, confirmation_code)
      VALUES (?, ?, ?, 'pendente', ?)
    `, [participant_id, event_id, ticket_id, confirmationCode]);
    res.status(201).json({ id: result.insertId, confirmation_code: confirmationCode });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
