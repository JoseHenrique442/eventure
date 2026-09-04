import { useQuery } from "@tanstack/react-query";
import { speakersApi } from "@/lib/api";

export interface SpeakerWithDetails {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  speaker_type: 'especialista' | 'celebridade';
  // Campos de especialização
  specialists?: {
    area_atuacao: string;
  };
  celebrities?: {
    area_fama: string;
  };
}

export const useSpeakersWithDetails = (filterSpecialists: boolean = false) => {
  return useQuery({
    queryKey: ['speakers-with-details', filterSpecialists],
    queryFn: async () => {
      return speakersApi.getWithDetails(filterSpecialists) as Promise<SpeakerWithDetails[]>;
    },
  });
};
