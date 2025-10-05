import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import eventureLogoUrl from "@/assets/eventure-logo.png";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center">
            <img 
              src={eventureLogoUrl} 
              alt="Eventure" 
              className="h-10 w-auto"
            />
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Eventos
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Criar Evento
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Meus Ingressos
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar eventos..."
                className="pl-10 w-64"
              />
            </div>
          </div>

          <Button variant="outline" className="hidden md:flex">
            Entrar
          </Button>
          <Button className="hidden md:flex gradient-primary text-white">
            Cadastrar
          </Button>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
