import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Calendar, MapPin, FileText } from "lucide-react";
import { useEnrollments } from "@/hooks/useEnrollments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const eventTypeLabels = {
  presencial: "Presencial",
  online: "Online",
  hibrido: "Híbrido",
};

const statusLabels = {
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  pendente: "Pendente",
};

const statusColors = {
  confirmada: "default",
  cancelada: "destructive",
  pendente: "secondary",
} as const;

export default function MeusIngressos() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Meus Ingressos</h1>
              <p className="text-muted-foreground">Visualize e gerencie suas inscrições em eventos</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Meus Ingressos</h1>
            <p className="text-muted-foreground">
              {enrollments && enrollments.length > 0
                ? `Você possui ${enrollments.length} inscrição${enrollments.length !== 1 ? 'ões' : ''}`
                : 'Visualize e gerencie suas inscrições em eventos'
              }
            </p>
          </div>

          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[200px_1fr] gap-0">
                    {enrollment.event.image_url ? (
                      <div
                        className="h-48 md:h-auto bg-cover bg-center"
                        style={{ backgroundImage: `url(${enrollment.event.image_url})` }}
                      />
                    ) : (
                      <div className="h-48 md:h-auto gradient-primary flex items-center justify-center">
                        <Ticket className="h-12 w-12 text-white" />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{enrollment.event.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant={statusColors[enrollment.enrollment_status as keyof typeof statusColors]}>
                              {statusLabels[enrollment.enrollment_status as keyof typeof statusLabels] || enrollment.enrollment_status}
                            </Badge>
                            <Badge variant="outline">
                              {eventTypeLabels[enrollment.event.event_type as keyof typeof eventTypeLabels]}
                            </Badge>
                            {enrollment.ticket && (
                              <Badge variant="secondary" className="capitalize">
                                {enrollment.ticket.ticket_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(enrollment.event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        
                        {enrollment.event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{enrollment.event.location}</span>
                          </div>
                        )}
                        
                        {enrollment.confirmation_code && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Código: <span className="font-mono font-medium text-foreground">{enrollment.confirmation_code}</span></span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="default"
                          onClick={() => navigate(`/evento/${enrollment.event.id}`)}
                          className="gradient-primary text-white"
                        >
                          Ver Evento
                        </Button>
                        {enrollment.ticket && Number(enrollment.ticket.price) > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">Valor:</span>
                            <span className="font-bold">R$ {Number(enrollment.ticket.price).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Nenhum ingresso encontrado
                </CardTitle>
                <CardDescription>
                  Você ainda não possui ingressos. Explore os eventos disponíveis e faça sua inscrição!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="default"
                  onClick={() => navigate('/')}
                  className="gradient-primary text-white"
                >
                  Explorar Eventos
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
