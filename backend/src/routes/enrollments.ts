import express from 'express';
import { query } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET user enrollments with details
router.get('/my-enrollments', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const enrollments = await query(`
      SELECT 
        e.*,
        JSON_OBJECT(
          'id', ev.id,
          'name', ev.name,
          'description', ev.description,
          'start_date', ev.start_date,
          'end_date', ev.end_date,
          'location', ev.location,
          'image_url', ev.image_url,
          'event_type', ev.event_type
        ) as event,
        JSON_OBJECT(
          'id', t.id,
          'ticket_type', t.ticket_type,
          'price', t.price,
          'description', t.description
        ) as ticket
      FROM enrollments e
      INNER JOIN participants p ON e.participant_id = p.id
      INNER JOIN events ev ON e.event_id = ev.id
      LEFT JOIN tickets t ON e.ticket_id = t.id
      WHERE p.user_id = ?
      ORDER BY e.enrollment_date DESC
    `, [req.userId]);
    
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET enrollment by ID with full details
router.get('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const [enrollment] = await query(`
      SELECT 
        e.*,
        JSON_OBJECT(
          'id', ev.id,
          'name', ev.name,
          'description', ev.description,
          'start_date', ev.start_date,
          'end_date', ev.end_date,
          'location', ev.location,
          'image_url', ev.image_url,
          'event_type', ev.event_type
        ) as event,
        JSON_OBJECT(
          'id', t.id,
          'ticket_type', t.ticket_type,
          'price', t.price,
          'description', t.description
        ) as ticket,
        JSON_OBJECT(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email
        ) as participant,
        JSON_OBJECT(
          'payment_status', pay.payment_status,
          'amount', pay.amount,
          'payment_date', pay.payment_date
        ) as payment
      FROM enrollments e
      INNER JOIN participants p ON e.participant_id = p.id
      INNER JOIN events ev ON e.event_id = ev.id
      LEFT JOIN tickets t ON e.ticket_id = t.id
      LEFT JOIN payments pay ON e.id = pay.enrollment_id
      WHERE e.id = ?
    `, [req.params.id]);
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    res.json(enrollment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET enrollments with payment status
router.get('/with-payment-status', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const enrollments = await query(`
      SELECT 
        e.id,
        e.enrollment_status,
        e.enrollment_date,
        p.full_name as participant_name,
        p.email as participant_email,
        ev.name as event_name,
        ev.start_date as event_start_date,
        COALESCE(pay.payment_status, 'pendente') as payment_status,
        pay.amount as payment_amount,
        pay.payment_date
      FROM enrollments e
      INNER JOIN participants p ON e.participant_id = p.id
      INNER JOIN events ev ON e.event_id = ev.id
      LEFT JOIN payments pay ON e.id = pay.enrollment_id
      ORDER BY e.enrollment_date DESC
    `);
    
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create enrollment (chamada pela procedure purchase_ticket)
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { participant_id, event_id, ticket_id } = req.body;
    
    const confirmation_code = `${event_id.substring(0, 8)}-${Date.now()}`.toUpperCase();
    
    const result = await query(
      `INSERT INTO enrollments (participant_id, event_id, ticket_id, enrollment_status, confirmation_code) 
       VALUES (?, ?, ?, 'confirmada', ?)`,
      [participant_id, event_id, ticket_id, confirmation_code]
    ) as any;
    
    res.status(201).json({ 
      id: result.insertId, 
      confirmation_code,
      message: 'Enrollment created' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST purchase ticket (transação atômica)
router.post('/purchase-ticket', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { participant_id, event_id, ticket_id, amount, payment_method } = req.body;
    
    // Chamar stored procedure MySQL
    const result = await query(
      'CALL purchase_ticket(?, ?, ?, ?, ?)',
      [participant_id, event_id, ticket_id, amount, payment_method]
    ) as any;
    
    const purchaseResult = result[0][0];
    
    res.json({
      enrollment_id: purchaseResult.enrollment_id,
      payment_id: purchaseResult.payment_id,
      confirmation_code: purchaseResult.confirmation_code
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
