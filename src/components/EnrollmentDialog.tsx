import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParticipantProfile } from "@/hooks/useParticipantProfile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Ticket } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 dígitos"),
  participant_type: z.enum(["estudante", "profissional"], {
    required_error: "Selecione o tipo de participante",
  }),
  instituicao_ensino: z.string().optional(),
  matricula: z.string().optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
}).refine((data) => {
  if (data.participant_type === "estudante") {
    return data.instituicao_ensino && data.instituicao_ensino.length > 0;
  }
  return true;
}, {
  message: "Instituição de ensino é obrigatória para estudantes",
  path: ["instituicao_ensino"],
});

interface EnrollmentDialogProps {
  eventId: string;
  ticketId: string;
  onSuccess?: () => void;
}

export function EnrollmentDialog({ eventId, ticketId, onSuccess }: EnrollmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: existingProfile, isLoading: profileLoading } = useParticipantProfile(user?.id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: existingProfile?.full_name || "",
      email: existingProfile?.email || user?.email || "",
      phone: existingProfile?.phone || "",
      participant_type: existingProfile?.participant_type || "estudante",
      instituicao_ensino: existingProfile?.student?.instituicao_ensino || "",
      matricula: existingProfile?.student?.matricula || "",
      empresa: existingProfile?.professional?.empresa || "",
      cargo: existingProfile?.professional?.cargo || "",
    },
  });

  const participantType = form.watch("participant_type");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("Você precisa estar logado para se inscrever");
      return;
    }

    setIsSubmitting(true);

    try {
      let participantId = existingProfile?.id;

      // Se não existe perfil, criar um novo
      if (!participantId) {
        const { data: participant, error: participantError } = await supabase
          .from("participants")
          .insert({
            user_id: user.id,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            participant_type: values.participant_type,
          })
          .select()
          .single();

        if (participantError) throw participantError;
        participantId = participant.id;

        // Criar registro de especialização
        if (values.participant_type === "estudante") {
          const { error: studentError } = await supabase
            .from("students")
            .insert({
              participant_id: participantId,
              instituicao_ensino: values.instituicao_ensino || null,
              matricula: values.matricula || null,
            });

          if (studentError) throw studentError;
        } else {
          const { error: professionalError } = await supabase
            .from("professionals")
            .insert({
              participant_id: participantId,
              empresa: values.empresa || null,
              cargo: values.cargo || null,
            });

          if (professionalError) throw professionalError;
        }
      }

      // Criar inscrição
      const confirmationCode = `${eventId.substring(0, 8)}-${Date.now()}`.toUpperCase();
      
      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert({
          participant_id: participantId,
          event_id: eventId,
          ticket_id: ticketId,
          confirmation_code: confirmationCode,
          enrollment_status: "confirmada",
        });

      if (enrollmentError) throw enrollmentError;

      toast.success("Inscrição realizada com sucesso!");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao realizar inscrição:", error);
      toast.error(error.message || "Erro ao realizar inscrição");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gradient-primary text-white" size="lg">
          <Ticket className="mr-2 h-5 w-5" />
          Inscrever-se no Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscrição no Evento</DialogTitle>
          <DialogDescription>
            Preencha seus dados para confirmar a inscrição
          </DialogDescription>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="participant_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Participante *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="estudante" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Estudante
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="profissional" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Profissional
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {participantType === "estudante" && (
                <>
                  <FormField
                    control={form.control}
                    name="instituicao_ensino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instituição de Ensino *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da instituição" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="matricula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matrícula</FormLabel>
                        <FormControl>
                          <Input placeholder="Número da matrícula" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {participantType === "profissional" && (
                <>
                  <FormField
                    control={form.control}
                    name="empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu cargo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Inscrição
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
