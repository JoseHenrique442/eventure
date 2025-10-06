import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityWithDetails {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  activity_date: string;
  duration: number;
  activity_type: 'palestra' | 'oficina';
  location: string | null;
  // Campos de especialização
  lecture?: {
    tema: string;
  };
  workshop?: {
    instrutor: string;
    vagas: number;
  };
}

export const useActivitiesWithDetails = (eventId?: string) => {
  return useQuery({
    queryKey: ['activities-with-details', eventId],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select(`
          *,
          lectures (
            tema
          ),
          workshops (
            instrutor,
            vagas
          )
        `);
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ActivityWithDetails[];
    },
  });
};
