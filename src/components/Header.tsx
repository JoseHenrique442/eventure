import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import eventureLogoUrl from "@/assets/eventure-logo.png";
import { useEventSearch } from "@/hooks/useEventSearch";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export const Header = () => {
  const { searchTerm, setSearchTerm } = useEventSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(localSearchTerm);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
  };

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
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar eventos..."
                className="pl-10 pr-10 w-64"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
              {localSearchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

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
