import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";

export interface EventWithCelebrities {
  id: string;
  name: string;
  start_date: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
}

export const useEventsWithCelebrities = () => {
  return useQuery({
    queryKey: ['events-with-celebrities'],
    queryFn: () => eventsApi.getWithCelebrities(),
  });
};
