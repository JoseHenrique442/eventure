-- Política para admins criarem atividades
CREATE POLICY "Admins can insert activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política para admins atualizarem atividades
CREATE POLICY "Admins can update activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para admins deletarem atividades
CREATE POLICY "Admins can delete activities"
ON public.activities
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));