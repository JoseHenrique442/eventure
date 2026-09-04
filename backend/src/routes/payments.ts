import express from 'express';
import { query } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST create payment
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { enrollment_id, amount, payment_method } = req.body;

    const ownedEnrollment = await query(`
      SELECT e.id FROM enrollments e
      INNER JOIN participants p ON p.id = e.participant_id
      WHERE e.id = ? AND p.user_id = ?
    `, [enrollment_id, req.userId]) as any[];
    if (!ownedEnrollment.length) return res.status(404).json({ error: 'Inscrição não encontrada' });
    
    const result = await query(
      'INSERT INTO payments (enrollment_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)',
      [enrollment_id, amount, payment_method, 'confirmado']
    ) as any;
    
    // Atualizar status da inscrição
    await query(
      'UPDATE enrollments SET enrollment_status = ? WHERE id = ?',
      ['confirmada', enrollment_id]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Payment created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
