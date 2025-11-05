import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrollmentWithPaymentStatus {
  id: string;
  enrollment_status: string;
  enrollment_date: string;
  participant_name: string;
  participant_email: string;
  event_name: string;
  event_start_date: string;
  payment_status: 'pago' | 'pendente';
  payment_amount: number | null;
  payment_date: string | null;
}

export const useEnrollmentsWithPaymentStatus = () => {
  return useQuery({
    queryKey: ['enrollments-with-payment-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrollment_status,
          enrollment_date,
          participants (
            full_name,
            email
          ),
          events (
            name,
            start_date
          ),
          payments (
            payment_status,
            amount,
            payment_date
          )
        `);

      if (error) throw error;

      // Transformar os dados para incluir o status de pagamento com CASE
      return data.map(enrollment => ({
        id: enrollment.id,
        enrollment_status: enrollment.enrollment_status,
        enrollment_date: enrollment.enrollment_date,
        participant_name: enrollment.participants?.full_name || '',
        participant_email: enrollment.participants?.email || '',
        event_name: enrollment.events?.name || '',
        event_start_date: enrollment.events?.start_date || '',
        payment_status: enrollment.payments ? 'pago' : 'pendente',
        payment_amount: enrollment.payments?.amount || null,
        payment_date: enrollment.payments?.payment_date || null,
      })) as EnrollmentWithPaymentStatus[];
    },
  });
};
