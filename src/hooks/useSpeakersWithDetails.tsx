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

export const useSpeakersWithDetails = () => {
  return useQuery({
    queryKey: ['speakers-with-details'],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;

      return data as SpeakerWithDetails[];
    },
  });
};
