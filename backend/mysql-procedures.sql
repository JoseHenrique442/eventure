-- ============================================
-- STORED PROCEDURES PARA MYSQL
-- ============================================

DELIMITER $$

-- Procedure: purchase_ticket (Transação atômica)
DROP PROCEDURE IF EXISTS purchase_ticket$$

CREATE PROCEDURE purchase_ticket(
  IN p_participant_id CHAR(36),
  IN p_event_id CHAR(36),
  IN p_ticket_id CHAR(36),
  IN p_amount DECIMAL(10,2),
  IN p_payment_method ENUM('pix', 'credito', 'debito', 'boleto'),
  OUT o_enrollment_id CHAR(36),
  OUT o_payment_id CHAR(36),
  OUT o_confirmation_code VARCHAR(50)
)
BEGIN
  DECLARE v_confirmation_code VARCHAR(50);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Em caso de erro, fazer rollback
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Erro ao processar compra';
  END;
  
  START TRANSACTION;
  
  -- Gerar código de confirmação único
  SET v_confirmation_code = UPPER(CONCAT(
    SUBSTRING(p_event_id, 1, 8), 
    '-', 
    UNIX_TIMESTAMP()
  ));
  
  -- Gerar UUID para enrollment
  SET o_enrollment_id = UUID();
  
  -- 1. Criar inscrição
  INSERT INTO enrollments (
    id,
    participant_id, 
    event_id, 
    ticket_id, 
    enrollment_status,
    confirmation_code
  )
  VALUES (
    o_enrollment_id,
    p_participant_id,
    p_event_id,
    p_ticket_id,
    'confirmada',
    v_confirmation_code
  );
  
  -- Gerar UUID para payment
  SET o_payment_id = UUID();
  
  -- 2. Criar pagamento
  INSERT INTO payments (
    id,
    enrollment_id,
    amount,
    payment_method,
    payment_status
  )
  VALUES (
    o_payment_id,
    o_enrollment_id,
    p_amount,
    p_payment_method,
    'confirmado'
  );
  
  SET o_confirmation_code = v_confirmation_code;
  
  COMMIT;
END$$

-- Trigger: validate_workshop_capacity (corrigido para activity_enrollments)
DROP TRIGGER IF EXISTS validate_workshop_capacity_before_insert$$

CREATE TRIGGER validate_workshop_capacity_before_insert
BEFORE INSERT ON enrollments
FOR EACH ROW
BEGIN
  DECLARE workshop_vagas INT;
  DECLARE current_enrollments INT;
  
  -- Verificar se a atividade é uma oficina
  SELECT w.vagas INTO workshop_vagas
  FROM workshops w
  WHERE w.activity_id = NEW.activity_id;
  
  IF workshop_vagas IS NOT NULL THEN
    -- Contar inscrições atuais
    SELECT COUNT(*) INTO current_enrollments
    FROM enrollments
    WHERE activity_id = NEW.activity_id;
    
    -- Validar capacidade
    IF current_enrollments >= workshop_vagas THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Oficina sem vagas disponíveis';
    END IF;
  END IF;
END$$

-- Trigger: update_enrollment_status_on_payment
DROP TRIGGER IF EXISTS update_enrollment_on_payment$$

CREATE TRIGGER update_enrollment_on_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  IF NEW.payment_status = 'confirmado' THEN
    UPDATE enrollments
    SET enrollment_status = 'confirmada'
    WHERE id = NEW.enrollment_id;
  END IF;
END$$

-- Trigger: update_updated_at (para events)
DROP TRIGGER IF EXISTS update_events_updated_at$$

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END$$

DELIMITER ;

-- ============================================
-- FIM DAS STORED PROCEDURES
-- ============================================
