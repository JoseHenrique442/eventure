-- ============================================
-- CORREÇÃO DOS RELACIONAMENTOS
-- ============================================

-- 1. ENROLLMENTS: Garantir identificador composto (participant_id + event_id)
-- Relacionamento N:N entre Participante e Evento
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_participant_event_unique;

ALTER TABLE enrollments
ADD CONSTRAINT enrollments_participant_event_unique 
UNIQUE (participant_id, event_id);

-- 2. ENROLLMENTS: ticket_id deve ser NOT NULL (Inscrição possui Ingresso 1:1)
-- Temporariamente permitir NULL para não quebrar dados existentes
-- Em produção, você deve primeiro garantir que todos enrollments tenham ticket_id
COMMENT ON COLUMN enrollments.ticket_id IS 'FK para tickets - cada inscrição deve ter um tipo de ingresso';

-- 3. PAYMENTS: Garantir relacionamento 1:1 com Inscrição
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_enrollment_unique;

ALTER TABLE payments
ADD CONSTRAINT payments_enrollment_unique 
UNIQUE (enrollment_id);

-- 4. ACTIVITY_SPEAKERS: Definir PK composta para relacionamento N:N
-- Palestrante ministra Atividade (N:N)
ALTER TABLE activity_speakers
DROP CONSTRAINT IF EXISTS activity_speakers_pkey CASCADE;

ALTER TABLE activity_speakers
ADD CONSTRAINT activity_speakers_pkey 
PRIMARY KEY (activity_id, speaker_id);

-- 5. EVALUATIONS: Garantir identificador composto (participant_id + activity_id)
-- Um participante pode avaliar uma atividade apenas uma vez
ALTER TABLE evaluations
DROP CONSTRAINT IF EXISTS evaluations_participant_activity_unique;

ALTER TABLE evaluations
ADD CONSTRAINT evaluations_participant_activity_unique 
UNIQUE (participant_id, activity_id);

-- ============================================
-- VERIFICAR FOREIGN KEYS
-- ============================================

-- Garantir que todas as FKs estão corretas

-- activities.event_id -> events.id (1:N)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activities_event_id_fkey'
  ) THEN
    ALTER TABLE activities
    ADD CONSTRAINT activities_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- enrollments.participant_id -> participants.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'enrollments_participant_id_fkey'
  ) THEN
    ALTER TABLE enrollments
    ADD CONSTRAINT enrollments_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- enrollments.event_id -> events.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'enrollments_event_id_fkey'
  ) THEN
    ALTER TABLE enrollments
    ADD CONSTRAINT enrollments_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- enrollments.ticket_id -> tickets.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'enrollments_ticket_id_fkey'
  ) THEN
    ALTER TABLE enrollments
    ADD CONSTRAINT enrollments_ticket_id_fkey
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- payments.enrollment_id -> enrollments.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_enrollment_id_fkey'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT payments_enrollment_id_fkey
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- activity_speakers.activity_id -> activities.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_speakers_activity_id_fkey'
  ) THEN
    ALTER TABLE activity_speakers
    ADD CONSTRAINT activity_speakers_activity_id_fkey
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- activity_speakers.speaker_id -> speakers.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_speakers_speaker_id_fkey'
  ) THEN
    ALTER TABLE activity_speakers
    ADD CONSTRAINT activity_speakers_speaker_id_fkey
    FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- evaluations.participant_id -> participants.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'evaluations_participant_id_fkey'
  ) THEN
    ALTER TABLE evaluations
    ADD CONSTRAINT evaluations_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- evaluations.activity_id -> activities.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'evaluations_activity_id_fkey'
  ) THEN
    ALTER TABLE evaluations
    ADD CONSTRAINT evaluations_activity_id_fkey
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
  END IF;
END $$;