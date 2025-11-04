-- Adicionar o status 'pendente' ao enum enrollment_status
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'pendente';