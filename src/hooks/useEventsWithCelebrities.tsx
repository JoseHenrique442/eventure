import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventWithCelebrities {
  id: string;
  name: string;
  start_date: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
}

export const useEventsWithCelebrities = () => {
  return useQuery({
    queryKey: ['events-with-celebrities'],
    queryFn: async () => {
      // Subconsulta: buscar eventos que têm atividades com palestrantes celebridades
      const { data: activityIds, error: activityError } = await supabase
        .from('activity_speakers')
        .select(`
          activity_id,
          speakers!inner (
            speaker_type
          )
        `)
        .eq('speakers.speaker_type', 'celebridade');

      if (activityError) throw activityError;

      // Extrair IDs únicos de atividades
      const uniqueActivityIds = [...new Set(activityIds?.map(a => a.activity_id))];

      if (uniqueActivityIds.length === 0) {
        return [];
      }

      // Buscar eventos relacionados a essas atividades
      const { data: activities, error: eventsError } = await supabase
        .from('activities')
        .select(`
          event_id,
          events (
            id,
            name,
            start_date,
            description,
            location,
            image_url
          )
        `)
        .in('id', uniqueActivityIds);

      if (eventsError) throw eventsError;

      // Extrair eventos únicos
      const uniqueEvents = activities
        ?.map(a => a.events)
        .filter((event, index, self) => 
          event && self.findIndex(e => e?.id === event.id) === index
        ) || [];

      return uniqueEvents as EventWithCelebrities[];
    },
  });
};
