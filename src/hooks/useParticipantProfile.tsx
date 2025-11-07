import { useQuery } from "@tanstack/react-query";
import { participantsApi } from "@/lib/api";

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
    queryFn: () => participantsApi.getByUser(),
    enabled: !!userId,
  });
};
