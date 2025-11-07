import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api";

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
    queryFn: () => enrollmentsApi.getWithPaymentStatus(),
  });
};
