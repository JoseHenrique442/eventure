export interface TicketInput {
  ticket_type: 'meia' | 'inteira' | 'vip';
  price: number;
  quantity_available: number;
  description?: string | null;
}

export interface EventInput {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  location?: string | null;
  event_type: 'presencial' | 'online' | 'hibrido';
  image_url?: string | null;
  tickets?: TicketInput[];
}

export interface ActivityInput {
  event_id: string;
  title: string;
  description?: string | null;
  activity_type: 'palestra' | 'oficina' | 'mesa_redonda';
  activity_date: string;
  duration: number;
  location?: string | null;
  lecture_data?: { tema: string };
  workshop_data?: { instrutor: string; vagas: number };
}

interface StudentInput {
  instituicao_ensino: string | null;
  matricula: string | null;
}

interface ProfessionalInput {
  empresa: string | null;
  cargo: string | null;
}

export interface ParticipantInput {
  full_name: string;
  email: string;
  phone?: string | null;
  participant_type: 'estudante' | 'profissional' | 'vip';
  student?: StudentInput;
  student_data?: StudentInput;
  professional?: ProfessionalInput;
  professional_data?: ProfessionalInput;
}

export interface EnrollmentInput {
  participant_id: string;
  event_id: string;
  ticket_id?: string | null;
}

export interface PaymentInput {
  enrollment_id: string;
  amount: number;
  payment_method: 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto';
  payment_status?: string;
}

export type PurchaseTicketInput = EnrollmentInput & Omit<PaymentInput, 'enrollment_id'> & { ticket_id: string };
