-- FASE 2.1: VIEW - Ranking de Atividades
CREATE OR REPLACE VIEW public.activities_ranking AS
SELECT 
  a.id,
  a.title,
  COUNT(e.id) as total_avaliacoes,
  COALESCE(AVG(e.rating), 0) as media_notas
FROM activities a
LEFT JOIN evaluations e ON a.id = e.activity_id
GROUP BY a.id, a.title
ORDER BY total_avaliacoes DESC, media_notas DESC;

-- RLS para a VIEW
ALTER VIEW public.activities_ranking SET (security_invoker = true);

-- FASE 2.2: Tabela de inscrições em atividades (para controle de vagas em oficinas)
CREATE TABLE IF NOT EXISTS public.activity_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id, activity_id)
);

-- RLS para activity_enrollments
ALTER TABLE public.activity_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity enrollments"
ON public.activity_enrollments
FOR SELECT
USING (
  enrollment_id IN (
    SELECT id FROM enrollments 
    WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create their own activity enrollments"
ON public.activity_enrollments
FOR INSERT
WITH CHECK (
  enrollment_id IN (
    SELECT id FROM enrollments 
    WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

-- Função de validação de vagas em oficinas
CREATE OR REPLACE FUNCTION public.validate_workshop_capacity()
RETURNS TRIGGER AS $$
DECLARE
  workshop_vagas INT;
  current_enrollments INT;
BEGIN
  -- Verificar se a atividade é uma oficina
  SELECT w.vagas INTO workshop_vagas
  FROM workshops w
  WHERE w.activity_id = NEW.activity_id;
  
  IF FOUND THEN
    -- Contar inscrições atuais
    SELECT COUNT(*) INTO current_enrollments
    FROM activity_enrollments
    WHERE activity_id = NEW.activity_id;
    
    -- Validar capacidade
    IF current_enrollments >= workshop_vagas THEN
      RAISE EXCEPTION 'Oficina sem vagas disponíveis';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger de validação de vagas
CREATE TRIGGER check_workshop_capacity
BEFORE INSERT ON public.activity_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.validate_workshop_capacity();

-- FASE 2.3: Atualização automática de status de pagamento
CREATE OR REPLACE FUNCTION public.update_enrollment_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'confirmado' THEN
    UPDATE enrollments
    SET enrollment_status = 'confirmada'
    WHERE id = NEW.enrollment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger de atualização de status
CREATE TRIGGER payment_confirmation_trigger
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_enrollment_status_on_payment();