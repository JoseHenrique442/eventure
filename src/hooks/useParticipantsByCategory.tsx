import { useQuery } from "@tanstack/react-query";
import { participantsApi } from "@/lib/api";

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
    queryFn: () => participantsApi.getByCategory(category),
  });
};
