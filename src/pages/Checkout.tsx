import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, QrCode, Loader2, Calendar, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Checkout = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const ticketPrice = searchParams.get("price");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: enrollmentData, isLoading } = useQuery({
    queryKey: ["enrollment", enrollmentId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/enrollments/${enrollmentId}`);
      if (!response.ok) throw new Error("Falha ao buscar inscrição");
      return response.json();
    },
    enabled: !!enrollmentId && !!user,
  });

  // Adaptar estrutura de dados
  const enrollment = enrollmentData ? {
    ...enrollmentData,
    events: enrollmentData.event,
    tickets: enrollmentData.ticket,
    participants: enrollmentData.participant,
  } : null;

  const existingPayment = enrollmentData?.payment || null;

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!enrollment) throw new Error("Inscrição não encontrada");

      const price = Number(ticketPrice || enrollment.tickets?.price || 0);

      // Criar registro de pagamento via API
      await paymentsApi.create({
        enrollment_id: enrollmentId!,
        amount: price,
        payment_method: "pix",
        payment_status: "confirmado",
      });
    },
    onSuccess: () => {
      setPaymentProcessing(true);
      setTimeout(() => {
        toast.success("Pagamento confirmado com sucesso!");
        navigate("/meus-ingressos");
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Erro ao confirmar pagamento:", error);
      toast.error(error.message || "Erro ao confirmar pagamento");
    },
  });

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Inscrição não encontrada</h1>
            <Button onClick={() => navigate("/")}>Voltar para início</Button>
          </div>
        </main>
      </div>
    );
  }

  const price = Number(ticketPrice || enrollment.tickets?.price || 0);
  const isFree = price === 0;
  const isPaid = existingPayment?.payment_status === "confirmado" || enrollment.enrollment_status === "confirmada";

  // Se for grátis ou já pago, confirmar automaticamente
  if ((isFree || isPaid) && enrollment.enrollment_status !== "confirmada") {
    confirmPaymentMutation.mutate();
  }

  if (isPaid) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto">
            <Card className="border-primary">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
                <CardDescription>
                  Sua inscrição foi confirmada com sucesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">{enrollment.events.name}</p>
                  {enrollment.confirmation_code && (
                    <p className="text-sm text-muted-foreground">
                      Código de confirmação: <span className="font-mono font-medium text-foreground">{enrollment.confirmation_code}</span>
                    </p>
                  )}
                </div>

                <Separator />

                <Button
                  className="w-full gradient-primary text-white"
                  size="lg"
                  onClick={() => navigate("/meus-ingressos")}
                >
                  Ver Meus Ingressos
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete seu pagamento para confirmar a inscrição</p>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            {/* Área de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Pagamento via PIX
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code abaixo para realizar o pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code Fictício */}
                <div className="flex justify-center p-8 bg-muted rounded-lg">
                  <div className="w-64 h-64 bg-white rounded-lg border-4 border-foreground/10 flex items-center justify-center">
                    <QrCode className="h-32 w-32 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Chave PIX (fictícia):</p>
                    <p className="font-mono text-sm break-all">
                      00020126580014br.gov.bcb.pix0136{enrollment.id}520400005303986540{price.toFixed(2)}5802BR
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">R$ {price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>R$ {price.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full gradient-primary text-white"
                    size="lg"
                    onClick={() => confirmPaymentMutation.mutate()}
                    disabled={confirmPaymentMutation.isPending || paymentProcessing}
                  >
                    {(confirmPaymentMutation.isPending || paymentProcessing) && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    {paymentProcessing ? "Processando..." : "Marcar como Pago"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Este é um checkout fictício para demonstração. 
                    Clique no botão acima para simular o pagamento.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Resumo do Evento */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrollment.events.image_url && (
                    <img
                      src={enrollment.events.image_url}
                      alt={enrollment.events.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">{enrollment.events.name}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(enrollment.events.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {enrollment.events.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{enrollment.events.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {enrollment.tickets && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Tipo de Ingresso</span>
                        <Badge variant="secondary" className="capitalize">
                          <Ticket className="h-3 w-3 mr-1" />
                          {enrollment.tickets.ticket_type}
                        </Badge>
                      </div>
                      {enrollment.tickets.description && (
                        <p className="text-xs text-muted-foreground">
                          {enrollment.tickets.description}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados do Participante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{enrollment.participants.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{enrollment.participants.email}</p>
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

export default Checkout;
