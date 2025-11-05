-- Função para processar compra de ingresso de forma atômica
CREATE OR REPLACE FUNCTION public.purchase_ticket(
  p_participant_id UUID,
  p_event_id UUID,
  p_ticket_id UUID,
  p_amount NUMERIC,
  p_payment_method payment_method
) RETURNS TABLE(
  enrollment_id UUID, 
  payment_id UUID,
  confirmation_code TEXT
) AS $$
DECLARE
  v_enrollment_id UUID;
  v_payment_id UUID;
  v_confirmation_code TEXT;
BEGIN
  -- Gerar código de confirmação único
  v_confirmation_code := UPPER(
    SUBSTRING(p_event_id::TEXT FROM 1 FOR 8) || '-' || 
    FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT
  );
  
  -- 1. Criar inscrição (dentro da transação)
  INSERT INTO enrollments (
    participant_id, 
    event_id, 
    ticket_id, 
    enrollment_status,
    confirmation_code
  )
  VALUES (
    p_participant_id,
    p_event_id,
    p_ticket_id,
    'confirmada', -- Já confirmada pois pagamento será processado junto
    v_confirmation_code
  )
  RETURNING id INTO v_enrollment_id;
  
  -- 2. Criar pagamento (dentro da mesma transação)
  INSERT INTO payments (
    enrollment_id,
    amount,
    payment_method,
    payment_status
  )
  VALUES (
    v_enrollment_id,
    p_amount,
    p_payment_method,
    'confirmado'
  )
  RETURNING id INTO v_payment_id;
  
  -- 3. Retornar todos os IDs necessários
  RETURN QUERY SELECT v_enrollment_id, v_payment_id, v_confirmation_code;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, a transação faz rollback automático
    RAISE EXCEPTION 'Erro ao processar compra: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;