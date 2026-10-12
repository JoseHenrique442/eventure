import type { ActivityInput, EnrollmentInput, EventInput, ParticipantInput, PaymentInput, PurchaseTicketInput } from './api-types';
import type { SpeakerWithDetails } from '@/hooks/useSpeakersWithDetails';

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const AUTH_STORAGE_KEY = "eventure-auth";

// Helper para obter o token de autenticação
function getAuthToken(): string | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null')?.access_token || null;
  } catch {
    return null;
  }
}

// Helper para fazer requisições com autenticação
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
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
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Events
export const eventsApi = {
  getAll: () => fetchWithAuth("/events"),
  getFuture: () => fetchWithAuth("/events/future"),
  getWithCelebrities: () => fetchWithAuth("/events/with-celebrities"),
  getById: (id: string) => fetchWithAuth(`/events/${id}`),
  create: (data: EventInput) => fetchWithAuth("/events", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: EventInput) => fetchWithAuth(`/events/${id}`, {
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
  create: (data: ActivityInput) => fetchWithAuth("/activities", {
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
  create: (data: ParticipantInput) => fetchWithAuth("/participants", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<ParticipantInput>) => fetchWithAuth(`/participants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
};

// Enrollments
export const enrollmentsApi = {
  getMyEnrollments: () => fetchWithAuth("/enrollments/my-enrollments"),
  getWithPaymentStatus: () => fetchWithAuth("/enrollments/with-payment-status"),
  getById: (id: string) => fetchWithAuth(`/enrollments/${id}`),
  create: (data: EnrollmentInput) => fetchWithAuth("/enrollments", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  purchaseTicket: (data: PurchaseTicketInput) => fetchWithAuth("/enrollments/purchase-ticket", {
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
  getWithDetails: (specialistsOnly = false) => fetchWithAuth(
    `/speakers/with-details${specialistsOnly ? '?type=especialista' : ''}`
  ),
  getByActivity: (activityId: string) => 
    fetchWithAuth(`/speakers/by-activity/${activityId}`) as Promise<SpeakerWithDetails[]>,
};

// Payments
export const paymentsApi = {
  create: (data: PaymentInput) => fetchWithAuth("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};
