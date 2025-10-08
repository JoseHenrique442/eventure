-- Allow public (unauthenticated) users to view events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events are viewable by everyone"
ON public.events
FOR SELECT
USING (true);