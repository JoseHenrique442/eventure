import { getErrorMessage } from '../utils/errors';
import express from 'express';
import { query, queryRows } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await queryRows('SELECT * FROM events ORDER BY start_date DESC');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// GET future events
router.get('/future', async (req, res) => {
  try {
    const events = await queryRows(
      "SELECT * FROM events WHERE datetime(start_date) >= datetime('now') ORDER BY datetime(start_date) ASC"
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// GET events with celebrities
router.get('/with-celebrities', async (req, res) => {
  try {
    const events = await queryRows(`
      SELECT DISTINCT e.*
      FROM events e
      INNER JOIN activities a ON e.id = a.event_id
      INNER JOIN activity_speakers asp ON a.id = asp.activity_id
      INNER JOIN speakers s ON asp.speaker_id = s.id
      WHERE s.speaker_type = 'celebridade'
      ORDER BY e.start_date DESC
    `);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// GET single event by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching event with ID:', req.params.id);
    const [event] = await queryRows('SELECT * FROM events WHERE id = ?', [req.params.id]);
    console.log('Event found:', event);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// POST create event (admin only)
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { name, description, start_date, end_date, location, event_type, image_url } = req.body;
    
    const result = await query(
      `INSERT INTO events (name, description, start_date, end_date, location, event_type, image_url, organizer_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, start_date, end_date, location, event_type, image_url, req.userId]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Event created' });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// PUT update event
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { name, description, start_date, end_date, location, event_type, image_url } = req.body;
    
    await query(
      `UPDATE events 
       SET name = ?, description = ?, start_date = ?, end_date = ?, location = ?, event_type = ?, image_url = ?
       WHERE id = ?`,
      [name, description, start_date, end_date, location, event_type, image_url, req.params.id]
    );
    
    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// DELETE event
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
