-- ============================================
-- REFATORAÇÃO: GENERALIZAÇÕES COM TABELAS SEPARADAS
-- ============================================

-- 1. PARTICIPANTE (GENERALIZAÇÃO)
-- Remover campos específicos de estudante e profissional da tabela participants
ALTER TABLE participants 
DROP COLUMN IF EXISTS instituicao_ensino,
DROP COLUMN IF EXISTS matricula,
DROP COLUMN IF EXISTS empresa,
DROP COLUMN IF EXISTS cargo,
DROP COLUMN IF EXISTS beneficios_exclusivos;

-- Criar tabela students (especialização de participante)
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
  instituicao_ensino text,
  matricula text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela professionals (especialização de participante)
CREATE TABLE IF NOT EXISTS public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
  empresa text,
  cargo text,
  created_at timestamptz DEFAULT now()
);

-- 2. PALESTRANTE (GENERALIZAÇÃO)
-- Remover campos específicos de especialista e celebridade da tabela speakers
ALTER TABLE speakers 
DROP COLUMN IF EXISTS area_atuacao,
DROP COLUMN IF EXISTS area_fama;

-- Criar tabela specialists (especialização de palestrante)
CREATE TABLE IF NOT EXISTS public.specialists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_id uuid NOT NULL REFERENCES speakers(id) ON DELETE CASCADE UNIQUE,
  area_atuacao text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela celebrities (especialização de palestrante)
CREATE TABLE IF NOT EXISTS public.celebrities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_id uuid NOT NULL REFERENCES speakers(id) ON DELETE CASCADE UNIQUE,
  area_fama text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. ATIVIDADE (GENERALIZAÇÃO)
-- Remover campos específicos de palestra e oficina da tabela activities
ALTER TABLE activities 
DROP COLUMN IF EXISTS tema,
DROP COLUMN IF EXISTS instrutor,
DROP COLUMN IF EXISTS vagas;

-- Criar tabela lectures/palestras (especialização de atividade)
CREATE TABLE IF NOT EXISTS public.lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE UNIQUE,
  tema text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela workshops/oficinas (especialização de atividade)
CREATE TABLE IF NOT EXISTS public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE UNIQUE,
  instrutor text NOT NULL,
  vagas integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Students policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own data"
ON public.students FOR SELECT
USING (participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
));

CREATE POLICY "Students can insert their own data"
ON public.students FOR INSERT
WITH CHECK (participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
));

CREATE POLICY "Students can update their own data"
ON public.students FOR UPDATE
USING (participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
));

-- Professionals policies
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own data"
ON public.professionals FOR SELECT
USING (participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
));

CREATE POLICY "Professionals can insert their own data"
ON public.professionals FOR INSERT
WITH CHECK (participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
));

CREATE POLICY "Professionals can update their own data"
ON public.professionals FOR UPDATE
USING (participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
));

-- Specialists policies
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists are viewable by everyone"
ON public.specialists FOR SELECT
USING (true);

-- Celebrities policies
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Celebrities are viewable by everyone"
ON public.celebrities FOR SELECT
USING (true);

-- Lectures policies
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectures are viewable by everyone"
ON public.lectures FOR SELECT
USING (true);

-- Workshops policies
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshops are viewable by everyone"
ON public.workshops FOR SELECT
USING (true);