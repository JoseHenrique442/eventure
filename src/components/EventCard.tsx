import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface EventCardProps {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  eventType: "presencial" | "online" | "hibrido";
  imageUrl?: string;
}

const eventTypeLabels = {
  presencial: "Presencial",
  online: "Online",
  hibrido: "Híbrido",
};

const eventTypeBadgeVariant = {
  presencial: "default" as const,
  online: "secondary" as const,
  hibrido: "outline" as const,
};

export const EventCard = ({
  id,
  name,
  description,
  startDate,
  endDate,
  location,
  eventType,
  imageUrl,
}: EventCardProps) => {
  const formattedStartDate = format(new Date(startDate), "dd MMM yyyy", {
    locale: ptBR,
  });

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={eventTypeBadgeVariant[eventType]}>
            {eventTypeLabels[eventType]}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl font-bold mb-2 line-clamp-2">{name}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-2 flex-1">
          {description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formattedStartDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Link to={`/evento/${id}`} className="w-full">
          <Button className="w-full gradient-primary text-white hover:shadow-glow">
            Ver Detalhes
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
