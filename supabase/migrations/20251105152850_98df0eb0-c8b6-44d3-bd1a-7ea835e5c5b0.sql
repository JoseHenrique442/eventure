-- Adicionar política RLS para permitir usuários criarem pagamentos de suas próprias inscrições
CREATE POLICY "Users can create payments for their own enrollments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  enrollment_id IN (
    SELECT enrollments.id
    FROM enrollments
    WHERE enrollments.participant_id IN (
      SELECT participants.id
      FROM participants
      WHERE participants.user_id = auth.uid()
    )
  )
);