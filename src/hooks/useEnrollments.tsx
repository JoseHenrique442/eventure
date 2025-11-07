import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api";

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
    queryFn: () => enrollmentsApi.getMyEnrollments(),
    enabled: !!userId,
  });
};
