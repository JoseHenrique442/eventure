import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, ArrowLeft, Users, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useActivitiesWithDetails } from "@/hooks/useActivitiesWithDetails";

const eventTypeLabels = {
  presencial: "Presencial",
  online: "Online",
  hibrido: "Híbrido",
};

const activityTypeLabels = {
  palestra: "Palestra",
  oficina: "Oficina",
};

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: activities, isLoading: activitiesLoading } = useActivitiesWithDetails(id);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", id);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar palestrantes das atividades
  const { data: speakers } = useQuery({
    queryKey: ["event-speakers", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_speakers")
        .select(`
          speaker_id,
          speakers (
            id,
            name,
            bio,
            photo_url,
            speaker_type,
            specialists (area_atuacao),
            celebrities (area_fama)
          )
        `)
        .in("activity_id", activities?.map(a => a.id) || []);

      if (error) throw error;
      
      // Remover duplicatas
      const uniqueSpeakers = Array.from(
        new Map(data.map(item => [item.speakers.id, item.speakers])).values()
      );
      
      return uniqueSpeakers;
    },
    enabled: !!activities && activities.length > 0,
  });

  if (eventLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
            <Button onClick={() => navigate("/")}>Voltar para início</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="relative h-96 bg-cover bg-center"
          style={{
            backgroundImage: event.image_url 
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${event.image_url})`
              : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
          }}
        >
          <div className="container h-full flex flex-col justify-end pb-12">
            <Button 
              variant="ghost" 
              className="self-start mb-4 text-white hover:bg-white/20"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <Badge className="self-start mb-4" variant="secondary">
              {eventTypeLabels[event.event_type as keyof typeof eventTypeLabels]}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {event.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {format(new Date(event.start_date), "dd 'de' MMMM", { locale: ptBR })}
                  {event.end_date && event.end_date !== event.start_date && 
                    ` - ${format(new Date(event.end_date), "dd 'de' MMMM", { locale: ptBR })}`
                  }
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Sobre o Evento */}
              <Card>
                <CardHeader>
                  <CardTitle>Sobre o Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {event.description || "Sem descrição disponível."}
                  </p>
                </CardContent>
              </Card>

              {/* Atividades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Programação
                  </CardTitle>
                  <CardDescription>
                    Confira as atividades programadas para este evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                    </div>
                  ) : activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">
                                  {activityTypeLabels[activity.activity_type]}
                                </Badge>
                                {activity.activity_type === 'palestra' && activity.lecture && (
                                  <span className="text-sm text-muted-foreground">
                                    Tema: {activity.lecture.tema}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-lg">{activity.title}</h4>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(activity.activity_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {activity.duration} minutos
                            </div>
                            {activity.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {activity.location}
                              </div>
                            )}
                          </div>

                          {activity.activity_type === 'oficina' && activity.workshop && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Instrutor: <span className="font-medium text-foreground">{activity.workshop.instrutor}</span>
                                </span>
                                <span className="text-muted-foreground">
                                  Vagas: <span className="font-medium text-foreground">{activity.workshop.vagas}</span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma atividade programada ainda.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Palestrantes */}
              {speakers && speakers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Palestrantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {speakers.map((speaker: any) => (
                        <div key={speaker.id} className="flex gap-4 p-4 border rounded-lg">
                          {speaker.photo_url ? (
                            <img 
                              src={speaker.photo_url} 
                              alt={speaker.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                              {speaker.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{speaker.name}</h4>
                            <Badge variant="secondary" className="mb-2">
                              {speaker.speaker_type === 'especialista' ? 'Especialista' : 'Celebridade'}
                            </Badge>
                            {speaker.specialists && (
                              <p className="text-sm text-muted-foreground">
                                {speaker.specialists.area_atuacao}
                              </p>
                            )}
                            {speaker.celebrities && (
                              <p className="text-sm text-muted-foreground">
                                {speaker.celebrities.area_fama}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ingressos */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingressos</CardTitle>
                  <CardDescription>Escolha seu ingresso</CardDescription>
                </CardHeader>
                <CardContent>
                  {ticketsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
                    </div>
                  ) : tickets && tickets.length > 0 ? (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold capitalize">{ticket.ticket_type}</h4>
                              {ticket.description && (
                                <p className="text-sm text-muted-foreground">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-lg">
                              {Number(ticket.price) === 0 
                                ? "Grátis" 
                                : `R$ ${Number(ticket.price).toFixed(2)}`
                              }
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.quantity_available} disponíveis
                          </p>
                        </div>
                      ))}
                      <Separator />
                      <Button className="w-full gradient-primary text-white" size="lg">
                        Inscrever-se no Evento
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Ingressos em breve
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Informações Adicionais */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Data de Início</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  
                  {event.end_date && (
                    <div>
                      <h4 className="font-semibold mb-1">Data de Término</h4>
                      <p className="text-muted-foreground">
                        {format(new Date(event.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  
                  {event.location && (
                    <div>
                      <h4 className="font-semibold mb-1">Local</h4>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-1">Modalidade</h4>
                    <p className="text-muted-foreground">
                      {eventTypeLabels[event.event_type as keyof typeof eventTypeLabels]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetails;
