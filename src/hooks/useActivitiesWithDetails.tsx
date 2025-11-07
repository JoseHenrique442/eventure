import { useQuery } from "@tanstack/react-query";
import { activitiesApi } from "@/lib/api";

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
    queryFn: () => activitiesApi.getWithDetails(eventId),
  });
};
