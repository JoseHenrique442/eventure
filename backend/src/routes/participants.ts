import { getErrorMessage } from '../utils/errors';
import express from 'express';
import { query, queryRows } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = express.Router();

interface ParticipantRow extends Record<string, unknown> {
  participant_type: 'estudante' | 'profissional' | 'vip';
  instituicao_ensino: string | null;
  matricula: string | null;
  empresa: string | null;
  cargo: string | null;
}

const withSpecialization = (participant: ParticipantRow) => ({
  ...participant,
  student: participant.participant_type === 'estudante' ? {
    instituicao_ensino: participant.instituicao_ensino,
    matricula: participant.matricula,
  } : null,
  professional: participant.participant_type === 'profissional' ? {
    empresa: participant.empresa,
    cargo: participant.cargo,
  } : null,
});

// GET participant by user_id
router.get('/by-user', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const [participant] = await queryRows<ParticipantRow>(
      `SELECT 
        p.*,
        s.instituicao_ensino,
        s.matricula,
        pr.empresa,
        pr.cargo
      FROM participants p
      LEFT JOIN students s ON p.id = s.participant_id
      LEFT JOIN professionals pr ON p.id = pr.participant_id
      WHERE p.user_id = ?`,
      [req.userId]
    );
    
    res.json(participant ? withSpecialization(participant) : null);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// GET participants by category
router.get('/by-category', async (req, res) => {
  try {
    const { category } = req.query;
    
    let sql = `
      SELECT 
        p.full_name,
        p.email,
        p.phone,
        p.participant_type,
        s.instituicao_ensino,
        s.matricula,
        pr.empresa,
        pr.cargo
      FROM participants p
      LEFT JOIN students s ON p.id = s.participant_id
      LEFT JOIN professionals pr ON p.id = pr.participant_id
    `;
    
    const params = [];
    if (category) {
      sql += ' WHERE p.participant_type = ?';
      params.push(category);
    }
    
    const participants = await queryRows<ParticipantRow>(sql, params);
    res.json(participants.map(withSpecialization));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// POST create participant
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { full_name, email, phone, participant_type } = req.body;
    const student_data = req.body.student_data || req.body.student;
    const professional_data = req.body.professional_data || req.body.professional;
    
    const result = await query(
      'INSERT INTO participants (user_id, full_name, email, phone, participant_type) VALUES (?, ?, ?, ?, ?)',
      [req.userId, full_name, email, phone, participant_type]
    );
    
    const participantId = result.insertId;
    
    // Insert specialized data
    if (participant_type === 'estudante' && student_data) {
      await query(
        'INSERT INTO students (participant_id, instituicao_ensino, matricula) VALUES (?, ?, ?)',
        [participantId, student_data.instituicao_ensino, student_data.matricula]
      );
    } else if (participant_type === 'profissional' && professional_data) {
      await query(
        'INSERT INTO professionals (participant_id, empresa, cargo) VALUES (?, ?, ?)',
        [participantId, professional_data.empresa, professional_data.cargo]
      );
    }
    
    res.status(201).json({ id: participantId, message: 'Participant created' });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// PUT update participant
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { full_name, email, phone } = req.body;
    const student_data = req.body.student_data || req.body.student;
    const professional_data = req.body.professional_data || req.body.professional;
    
    await query(
      'UPDATE participants SET full_name = ?, email = ?, phone = ? WHERE id = ? AND user_id = ?',
      [full_name, email, phone, req.params.id, req.userId]
    );
    
    if (student_data) {
      await query(
        'UPDATE students SET instituicao_ensino = ?, matricula = ? WHERE participant_id = ?',
        [student_data.instituicao_ensino, student_data.matricula, req.params.id]
      );
    } else if (professional_data) {
      await query(
        'UPDATE professionals SET empresa = ?, cargo = ? WHERE participant_id = ?',
        [professional_data.empresa, professional_data.cargo, req.params.id]
      );
    }
    
    res.json({ message: 'Participant updated' });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
