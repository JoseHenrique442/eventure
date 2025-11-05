import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityRanking {
  id: string;
  title: string;
  total_avaliacoes: number;
  media_notas: number;
}

export const useActivitiesRanking = (limit: number = 5) => {
  return useQuery({
    queryKey: ['activities-ranking', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities_ranking')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return data as ActivityRanking[];
    },
  });
};
