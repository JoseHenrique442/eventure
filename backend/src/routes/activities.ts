import express from 'express';
import { query } from '../config/database';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

const withSpecialization = (activity: any) => ({
  ...activity,
  lecture: activity.lecture_tema ? { tema: activity.lecture_tema } : null,
  workshop: activity.workshop_instrutor ? {
    instrutor: activity.workshop_instrutor,
    vagas: activity.workshop_vagas,
  } : null,
});

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
    res.json((activities as any[]).map(withSpecialization));
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
    const sql = `
      SELECT 
        a.*,
        l.tema as lecture_tema,
        w.instrutor as workshop_instrutor,
        w.vagas as workshop_vagas
      FROM activities a
      LEFT JOIN lectures l ON a.id = l.activity_id
      LEFT JOIN workshops w ON a.id = w.activity_id
      WHERE a.event_id = ?
      ORDER BY a.activity_date ASC
    `;
    
    const activities = await query(sql, [req.params.eventId]);
    res.json((activities as any[]).map(withSpecialization));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create activity (requires auth)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { event_id, title, description, activity_type, activity_date, duration, location } = req.body;
    
    const result = await query(
      `INSERT INTO activities (event_id, title, description, activity_type, activity_date, duration, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_id, title, description, activity_type, activity_date, duration, location]
    );
    
    if (activity_type === 'palestra' && req.body.lecture_data?.tema) {
      await query('INSERT INTO lectures (activity_id, tema) VALUES (?, ?)', [
        result.insertId, req.body.lecture_data.tema,
      ]);
    } else if (activity_type === 'oficina' && req.body.workshop_data) {
      await query('INSERT INTO workshops (activity_id, instrutor, vagas) VALUES (?, ?, ?)', [
        result.insertId, req.body.workshop_data.instrutor, req.body.workshop_data.vagas,
      ]);
    }

    res.status(201).json({ id: result.insertId, message: 'Activity created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
