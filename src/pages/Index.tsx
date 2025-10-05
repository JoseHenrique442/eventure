import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      
      <main className="flex-1">
        <section className="container py-16">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Eventos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Descubra os eventos mais populares e comece sua jornada
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events?.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  description={event.description || ""}
                  startDate={event.start_date}
                  endDate={event.end_date}
                  location={event.location || ""}
                  eventType={event.event_type}
                  imageUrl={event.image_url || undefined}
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Organize seu próximo evento
              </h2>
              <p className="text-lg text-muted-foreground">
                Crie, gerencie e acompanhe seus eventos com nossa plataforma completa
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="px-8 py-3 rounded-lg gradient-primary text-white font-medium hover:shadow-glow transition-all">
                  Criar Evento
                </button>
                <button className="px-8 py-3 rounded-lg border border-primary text-primary font-medium hover:bg-primary/10 transition-all">
                  Saiba Mais
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t py-12 mt-16">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="font-bold text-lg">Eventure</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 Eventure. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
