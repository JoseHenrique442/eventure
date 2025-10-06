import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParticipantProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  participant_type: 'estudante' | 'profissional';
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

export const useParticipantProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['participant-profile', userId],
    queryFn: async () => {
      let query = supabase
        .from('participants')
        .select(`
          *,
          students (
            instituicao_ensino,
            matricula
          ),
          professionals (
            empresa,
            cargo
          )
        `);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      return data as ParticipantProfile | null;
    },
    enabled: !!userId,
  });
};
