import { Menu, Search, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import eventureLogoUrl from "@/assets/eventure-logo.png";
import { useEventSearch } from "@/hooks/useEventSearch";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { searchTerm, setSearchTerm } = useEventSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const { user, signOut } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole(user?.id);

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
            <button 
              onClick={() => navigate('/')} 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Eventos
            </button>
            {user && !roleLoading && userRole === 'admin' && (
              <button 
                onClick={() => navigate('/criar-evento')} 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Criar Evento
              </button>
            )}
            {user && (
              <button 
                onClick={() => navigate('/meus-ingressos')} 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Meus Ingressos
              </button>
            )}
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden md:flex gap-2">
                  <User className="h-4 w-4" />
                  Minha Conta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    {!roleLoading && userRole === 'admin' && (
                      <p className="text-xs leading-none text-muted-foreground">Administrador</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/meus-ingressos')}>
                  Meus Ingressos
                </DropdownMenuItem>
                {!roleLoading && userRole === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/criar-evento')}>
                    Criar Evento
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" className="hidden md:flex" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
              <Button className="hidden md:flex gradient-primary text-primary-foreground" onClick={() => navigate('/auth')}>
                Cadastrar
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
