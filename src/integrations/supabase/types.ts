export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          description: string | null
          duration: number
          event_id: string
          id: string
          location: string | null
          title: string
        }
        Insert: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          description?: string | null
          duration: number
          event_id: string
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          description?: string | null
          duration?: number
          event_id?: string
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_speakers: {
        Row: {
          activity_id: string
          speaker_id: string
        }
        Insert: {
          activity_id: string
          speaker_id: string
        }
        Update: {
          activity_id?: string
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_speakers_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      celebrities: {
        Row: {
          area_fama: string
          created_at: string | null
          id: string
          speaker_id: string
        }
        Insert: {
          area_fama: string
          created_at?: string | null
          id?: string
          speaker_id: string
        }
        Update: {
          area_fama?: string
          created_at?: string | null
          id?: string
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebrities_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: true
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          issue_date: string | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          issue_date?: string | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          issue_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          check_in_date: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          qr_code: string | null
        }
        Insert: {
          check_in_date?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          qr_code?: string | null
        }
        Update: {
          check_in_date?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          confirmation_code: string | null
          created_at: string | null
          enrollment_date: string | null
          enrollment_status: Database["public"]["Enums"]["enrollment_status"]
          event_id: string
          id: string
          participant_id: string
          ticket_id: string | null
        }
        Insert: {
          confirmation_code?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          enrollment_status?: Database["public"]["Enums"]["enrollment_status"]
          event_id: string
          id?: string
          participant_id: string
          ticket_id?: string | null
        }
        Update: {
          confirmation_code?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          enrollment_status?: Database["public"]["Enums"]["enrollment_status"]
          event_id?: string
          id?: string
          participant_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          activity_id: string
          comment: string | null
          created_at: string | null
          evaluation_date: string | null
          id: string
          participant_id: string
          rating: number | null
        }
        Insert: {
          activity_id: string
          comment?: string | null
          created_at?: string | null
          evaluation_date?: string | null
          id?: string
          participant_id: string
          rating?: number | null
        }
        Update: {
          activity_id?: string
          comment?: string | null
          created_at?: string | null
          evaluation_date?: string | null
          id?: string
          participant_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          image_url: string | null
          location: string | null
          name: string
          organizer_id: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          organizer_id?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          organizer_id?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lectures: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          tema: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          tema: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          tema?: string
        }
        Relationships: [
          {
            foreignKeyName: "lectures_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          participant_type: Database["public"]["Enums"]["participant_type"]
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          participant_type: Database["public"]["Enums"]["participant_type"]
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          participant_type?: Database["public"]["Enums"]["participant_type"]
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          enrollment_id: string
          id: string
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          enrollment_id: string
          id?: string
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          enrollment_id?: string
          id?: string
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          cargo: string | null
          created_at: string | null
          empresa: string | null
          id: string
          participant_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          empresa?: string | null
          id?: string
          participant_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          empresa?: string | null
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          name: string
          photo_url: string | null
          speaker_type: Database["public"]["Enums"]["speaker_type"]
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          photo_url?: string | null
          speaker_type: Database["public"]["Enums"]["speaker_type"]
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          speaker_type?: Database["public"]["Enums"]["speaker_type"]
        }
        Relationships: []
      }
      specialists: {
        Row: {
          area_atuacao: string
          created_at: string | null
          id: string
          speaker_id: string
        }
        Insert: {
          area_atuacao: string
          created_at?: string | null
          id?: string
          speaker_id: string
        }
        Update: {
          area_atuacao?: string
          created_at?: string | null
          id?: string
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialists_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: true
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          id: string
          instituicao_ensino: string | null
          matricula: string | null
          participant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instituicao_ensino?: string | null
          matricula?: string | null
          participant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instituicao_ensino?: string | null
          matricula?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          price: number
          quantity_available: number
          ticket_type: Database["public"]["Enums"]["ticket_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          price: number
          quantity_available: number
          ticket_type: Database["public"]["Enums"]["ticket_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          price?: number
          quantity_available?: number
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workshops: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          instrutor: string
          vagas: number
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          instrutor: string
          vagas: number
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          instrutor?: string
          vagas?: number
        }
        Relationships: [
          {
            foreignKeyName: "workshops_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type: "palestra" | "oficina" | "mesa_redonda"
      app_role: "admin" | "user"
      enrollment_status: "confirmada" | "cancelada"
      event_type: "presencial" | "online" | "hibrido"
      participant_type: "estudante" | "profissional" | "vip"
      payment_method: "cartao_credito" | "cartao_debito" | "pix" | "boleto"
      speaker_type: "especialista" | "celebridade"
      ticket_type: "meia" | "inteira" | "vip"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: ["palestra", "oficina", "mesa_redonda"],
      app_role: ["admin", "user"],
      enrollment_status: ["confirmada", "cancelada"],
      event_type: ["presencial", "online", "hibrido"],
      participant_type: ["estudante", "profissional", "vip"],
      payment_method: ["cartao_credito", "cartao_debito", "pix", "boleto"],
      speaker_type: ["especialista", "celebridade"],
      ticket_type: ["meia", "inteira", "vip"],
    },
  },
} as const
