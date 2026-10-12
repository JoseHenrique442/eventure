import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CalendarIcon, Loader2 } from "lucide-react";
import { activitiesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const activityFormSchema = z.object({
  title: z.string().min(3, "O título deve ter no mínimo 3 caracteres").max(200, "O título deve ter no máximo 200 caracteres"),
  description: z.string().max(1000, "A descrição deve ter no máximo 1000 caracteres").optional(),
  activity_type: z.enum(['palestra', 'oficina'], {
    required_error: "Selecione o tipo da atividade",
  }),
  activity_date: z.date({
    required_error: "A data e hora são obrigatórias",
  }),
  duration: z.number().min(1, "A duração deve ser maior que 0").max(480, "A duração deve ser no máximo 480 minutos"),
  location: z.string().max(200, "O local deve ter no máximo 200 caracteres").optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const activityTypeLabels = {
  palestra: 'Palestra',
  oficina: 'Oficina',
};

interface CreateActivityDialogProps {
  eventId: string;
  onSuccess: () => void;
}

export function CreateActivityDialog({ eventId, onSuccess }: CreateActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      location: "",
    },
  });

  const onSubmit = async (values: ActivityFormValues) => {
    setIsSubmitting(true);

    try {
      await activitiesApi.create({
        event_id: eventId,
        title: values.title,
        description: values.description || null,
        activity_type: values.activity_type,
        activity_date: values.activity_date.toISOString(),
        duration: values.duration,
        location: values.location || null,
      });

      toast({
        title: "Atividade criada com sucesso!",
        description: "A atividade foi adicionada à programação do evento.",
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro ao criar atividade",
        description: (error instanceof Error && error.message) || "Ocorreu um erro ao criar a atividade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          Adicionar Atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Atividade</DialogTitle>
          <DialogDescription>
            Adicione uma nova atividade à programação do evento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Atividade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Palestra sobre Inovação Tecnológica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o conteúdo da atividade..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo da Atividade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(activityTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="activity_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e Hora</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy HH:mm", { locale: ptBR })
                            ) : (
                              <span>Selecione data e hora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Data e hora de início da atividade
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        max="480"
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Tempo de duração em minutos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Auditório Principal, Sala 101"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Especifique o local dentro do evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gradient-primary text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Atividade'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
