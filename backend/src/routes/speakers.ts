import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// GET speakers with details
router.get('/with-details', async (req, res) => {
  try {
    const speakers = await query(`
      SELECT 
        s.*,
        sp.area_atuacao as specialist_area,
        c.area_fama as celebrity_area
      FROM speakers s
      LEFT JOIN specialists sp ON s.id = sp.speaker_id
      LEFT JOIN celebrities c ON s.id = c.speaker_id
      ORDER BY s.name ASC
    `);
    res.json(speakers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET speakers by activity
router.get('/by-activity/:activityId', async (req, res) => {
  try {
    const speakers = await query(`
      SELECT 
        s.*,
        sp.area_atuacao as specialist_area,
        c.area_fama as celebrity_area
      FROM speakers s
      INNER JOIN activity_speakers asp ON s.id = asp.speaker_id
      LEFT JOIN specialists sp ON s.id = sp.speaker_id
      LEFT JOIN celebrities c ON s.id = c.speaker_id
      WHERE asp.activity_id = ?
    `, [req.params.activityId]);
    
    res.json(speakers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
