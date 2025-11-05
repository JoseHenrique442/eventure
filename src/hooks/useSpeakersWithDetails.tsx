import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpeakerWithDetails {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  speaker_type: 'especialista' | 'celebridade';
  // Campos de especialização
  specialist?: {
    area_atuacao: string;
  };
  celebrity?: {
    area_fama: string;
  };
}

export const useSpeakersWithDetails = (filterSpecialists: boolean = false) => {
  return useQuery({
    queryKey: ['speakers-with-details', filterSpecialists],
    queryFn: async () => {
      let query = supabase
        .from('speakers')
        .select(`
          *,
          specialists (
            area_atuacao
          ),
          celebrities (
            area_fama
          )
        `);

      // Se filtrar por especialistas, incluir apenas aqueles com atividades
      if (filterSpecialists) {
        query = query.eq('speaker_type', 'especialista');
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as SpeakerWithDetails[];
    },
  });
};
