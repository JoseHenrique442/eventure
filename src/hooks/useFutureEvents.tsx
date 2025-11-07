import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";

export const useFutureEvents = () => {
  return useQuery({
    queryKey: ['future-events'],
    queryFn: () => eventsApi.getFuture(),
  });
};
