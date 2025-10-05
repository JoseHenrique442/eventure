import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="absolute inset-0 gradient-hero opacity-5"></div>
      
      <div className="container relative">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Transforme seus eventos em experiências inesquecíveis</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
            Descubra os{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              melhores eventos
            </span>{" "}
            perto de você
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Workshops, congressos, shows e palestras. Encontre e participe dos eventos que vão transformar sua carreira e expandir sua rede.
          </p>

          <div className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por evento, local ou categoria..."
                  className="pl-12 h-14 text-base"
                />
              </div>
              <Button size="lg" className="gradient-primary text-white h-14 px-8 hover:shadow-glow">
                Buscar Eventos
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>4.200+ eventos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>350+ palestrantes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span>150.000+ participantes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
