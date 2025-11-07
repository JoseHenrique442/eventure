import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// GET tickets by event
router.get('/by-event/:eventId', async (req, res) => {
  try {
    const tickets = await query(
      'SELECT * FROM tickets WHERE event_id = ? ORDER BY price ASC',
      [req.params.eventId]
    );
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
