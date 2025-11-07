import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// GET activities with details (lectures/workshops)
router.get('/with-details', async (req, res) => {
  try {
    const { event_id } = req.query;
    
    let sql = `
      SELECT 
        a.*,
        l.tema as lecture_tema,
        w.instrutor as workshop_instrutor,
        w.vagas as workshop_vagas
      FROM activities a
      LEFT JOIN lectures l ON a.id = l.activity_id
      LEFT JOIN workshops w ON a.id = w.activity_id
    `;
    
    const params = [];
    if (event_id) {
      sql += ' WHERE a.event_id = ?';
      params.push(event_id);
    }
    
    sql += ' ORDER BY a.activity_date ASC';
    
    const activities = await query(sql, params);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET activities ranking
router.get('/ranking', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const ranking = await query(`
      SELECT 
        a.id,
        a.title,
        COUNT(ev.id) as total_avaliacoes,
        AVG(ev.rating) as media_notas
      FROM activities a
      LEFT JOIN evaluations ev ON a.id = ev.activity_id
      GROUP BY a.id, a.title
      HAVING total_avaliacoes > 0
      ORDER BY media_notas DESC, total_avaliacoes DESC
      LIMIT ?
    `, [parseInt(limit as string)]);
    
    res.json(ranking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET activities by event
router.get('/by-event/:eventId', async (req, res) => {
  try {
    const activities = await query(
      'SELECT * FROM activities WHERE event_id = ? ORDER BY activity_date ASC',
      [req.params.eventId]
    );
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
