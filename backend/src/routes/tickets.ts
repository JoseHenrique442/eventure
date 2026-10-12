import { getErrorMessage } from '../utils/errors';
import express from 'express';
import { queryRows } from '../config/database';

const router = express.Router();

// GET tickets by event
router.get('/by-event/:eventId', async (req, res) => {
  try {
    const tickets = await queryRows(
      'SELECT * FROM tickets WHERE event_id = ? ORDER BY price ASC',
      [req.params.eventId]
    );
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
