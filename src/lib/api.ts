import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = "http://localhost:3001/api";

// Helper para obter o token de autenticação
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper para fazer requisições com autenticação
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro na requisição" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Events
export const eventsApi = {
  getAll: () => fetchWithAuth("/events"),
  getFuture: () => fetchWithAuth("/events/future"),
  getWithCelebrities: () => fetchWithAuth("/events/with-celebrities"),
  getById: (id: string) => fetchWithAuth(`/events/${id}`),
  create: (data: any) => fetchWithAuth("/events", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchWithAuth(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchWithAuth(`/events/${id}`, {
    method: "DELETE",
  }),
};

// Activities
export const activitiesApi = {
  getWithDetails: (eventId?: string) => {
    const url = eventId 
      ? `/activities/by-event/${eventId}`
      : "/activities/with-details";
    return fetchWithAuth(url);
  },
  getRanking: (limit: number = 5) => 
    fetchWithAuth(`/activities/ranking?limit=${limit}`),
  create: (data: any) => fetchWithAuth("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

// Participants
export const participantsApi = {
  getByUser: () => fetchWithAuth("/participants/by-user"),
  getByCategory: (category?: string) => {
    const url = category 
      ? `/participants/by-category?category=${category}`
      : "/participants/by-category";
    return fetchWithAuth(url);
  },
  create: (data: any) => fetchWithAuth("/participants", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchWithAuth(`/participants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
};

// Enrollments
export const enrollmentsApi = {
  getMyEnrollments: () => fetchWithAuth("/enrollments/my-enrollments"),
  getWithPaymentStatus: () => fetchWithAuth("/enrollments/with-payment-status"),
  getById: (id: string) => fetchWithAuth(`/enrollments/${id}`),
  create: (data: any) => fetchWithAuth("/enrollments", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  purchaseTicket: (data: any) => fetchWithAuth("/enrollments/purchase-ticket", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

// Tickets
export const ticketsApi = {
  getByEvent: (eventId: string) => fetchWithAuth(`/tickets/by-event/${eventId}`),
};

// Speakers
export const speakersApi = {
  getWithDetails: () => fetchWithAuth("/speakers/with-details"),
  getByActivity: (activityId: string) => 
    fetchWithAuth(`/speakers/by-activity/${activityId}`),
};

// Payments
export const paymentsApi = {
  create: (data: any) => fetchWithAuth("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};
