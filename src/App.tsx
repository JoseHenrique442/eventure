import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EventDetails from "./pages/EventDetails";
import Auth from "./pages/Auth";
import MeusIngressos from "./pages/MeusIngressos";
import CriarEvento from "./pages/CriarEvento";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./components/AuthProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/evento/:id" element={<EventDetails />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/meus-ingressos" element={<MeusIngressos />} />
          <Route path="/criar-evento" element={<CriarEvento />} />
          <Route path="/checkout/:enrollmentId" element={<Checkout />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
