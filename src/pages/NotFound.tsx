import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import illustration404 from "@/assets/404-illustration.png";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container flex items-center justify-center py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl">
          {/* Illustration */}
          <div className="flex justify-center">
            <img 
              src={illustration404} 
              alt="404 - Astronauta perdido no espaço" 
              className="w-full max-w-md animate-float"
            />
          </div>

          {/* Content */}
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              A página que você procura não foi encontrada :(
            </h1>
            
            <p className="text-muted-foreground text-lg">
              Ela pode não estar mais disponível ou ter tido o seu endereço alterado.
            </p>

            <div className="pt-4">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Erro 404
              </h2>
              <p className="text-muted-foreground mb-6">
                Enquanto tentamos descobrir o que aconteceu, você gostaria de procurar algum evento?
              </p>
              
              <Button 
                size="lg"
                onClick={() => navigate('/')}
                className="gradient-primary text-primary-foreground"
              >
                PROCURAR EVENTOS
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
