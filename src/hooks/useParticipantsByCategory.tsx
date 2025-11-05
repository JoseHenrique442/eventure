import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ParticipantCategory = 'estudante' | 'profissional';

export interface ParticipantWithCategory {
  full_name: string;
  email: string;
  phone: string | null;
  participant_type: ParticipantCategory;
  // Campos de especialização
  student?: {
    instituicao_ensino: string | null;
    matricula: string | null;
  };
  professional?: {
    empresa: string | null;
    cargo: string | null;
  };
}

export const useParticipantsByCategory = (category?: ParticipantCategory) => {
  return useQuery({
    queryKey: ['participants-by-category', category],
    queryFn: async () => {
      let query = supabase
        .from('participants')
        .select(`
          full_name,
          email,
          phone,
          participant_type,
          students (
            instituicao_ensino,
            matricula
          ),
          professionals (
            empresa,
            cargo
          )
        `);
      
      if (category) {
        query = query.eq('participant_type', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ParticipantWithCategory[];
    },
  });
};
