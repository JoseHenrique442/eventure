-- Permitir que admins gerenciem ingressos
CREATE POLICY "Admins can insert tickets"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tickets"
ON public.tickets
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));