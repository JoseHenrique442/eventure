-- Add missing fields to activities table for Palestra and Oficina specializations
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS tema TEXT,
ADD COLUMN IF NOT EXISTS instrutor TEXT,
ADD COLUMN IF NOT EXISTS vagas INTEGER;

COMMENT ON COLUMN activities.tema IS 'Tema da palestra (usado quando activity_type = palestra)';
COMMENT ON COLUMN activities.instrutor IS 'Instrutor da oficina (usado quando activity_type = oficina)';
COMMENT ON COLUMN activities.vagas IS 'Número de vagas disponíveis (usado quando activity_type = oficina)';