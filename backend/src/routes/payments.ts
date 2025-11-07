import express from 'express';
import { query } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST create payment
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { enrollment_id, amount, payment_method } = req.body;
    
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
