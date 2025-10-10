import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrollmentWithDetails {
  id: string;
  enrollment_date: string;
  enrollment_status: string;
  confirmation_code: string | null;
  event: {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    location: string | null;
    image_url: string | null;
    event_type: string;
  };
  ticket: {
    id: string;
    ticket_type: string;
    price: number;
    description: string | null;
  } | null;
}

export const useEnrollments = (userId?: string) => {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Primeiro, buscar o participant_id do usuário
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) throw participantError;
      if (!participant) return [];

      // Buscar inscrições com detalhes do evento e ingresso
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrollment_date,
          enrollment_status,
          confirmation_code,
          events (
            id,
            name,
            description,
            start_date,
            end_date,
            location,
            image_url,
            event_type
          ),
          tickets (
            id,
            ticket_type,
            price,
            description
          )
        `)
        .eq('participant_id', participant.id)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;

      return data.map(enrollment => ({
        id: enrollment.id,
        enrollment_date: enrollment.enrollment_date,
        enrollment_status: enrollment.enrollment_status,
        confirmation_code: enrollment.confirmation_code,
        event: enrollment.events,
        ticket: enrollment.tickets,
      })) as EnrollmentWithDetails[];
    },
    enabled: !!userId,
  });
};
