import { useQuery } from "@tanstack/react-query";
import { activitiesApi } from "@/lib/api";

export interface ActivityRanking {
  id: string;
  title: string;
  total_avaliacoes: number;
  media_notas: number;
}

export const useActivitiesRanking = (limit: number = 5) => {
  return useQuery({
    queryKey: ['activities-ranking', limit],
    queryFn: () => activitiesApi.getRanking(limit),
  });
};
