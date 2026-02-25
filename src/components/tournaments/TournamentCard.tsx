import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface TournamentCardProps {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  playerCount: number;
  maxPlayers: number;
  eventCount: number;
  status: "open" | "closed" | "in-progress" | "completed";
  featured?: boolean;
  entryFee?: number;
  skillLevel?: string;
  imageUrl?: string;
  organizerId?: string;
  registrationDeadline?: string;
}

const TournamentCard = ({
  id,
  name,
  location,
  startDate,
  endDate,
  playerCount,
  maxPlayers,
  eventCount,
  status,
  entryFee,
  skillLevel,
  imageUrl,
  organizerId,
  registrationDeadline,
}: TournamentCardProps) => {
  const { user } = useAuth();
  const isOwner = user?._id === organizerId || user?.role === 'admin';
  const isLive = status === "in-progress";

  const locationParts = location?.split(",") || [];
  const shortLocation = locationParts.length >= 2
    ? `${locationParts[0].trim()}, ${locationParts[locationParts.length - 1].trim()}`
    : location;

  // Calculate spots
  const spotsTotal = maxPlayers || 100;
  const spotsFilled = playerCount || 0;
  const spotsRemaining = Math.max(0, spotsTotal - spotsFilled);
  const isFillingFast = spotsRemaining > 0 && spotsRemaining <= 20;

  // Calculate days until deadline
  const daysUntilDeadline = registrationDeadline 
    ? Math.ceil((new Date(registrationDeadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : null;
  const showUrgency = status === 'open' && daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 7;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden h-full group">
      <div className="relative h-48 w-full bg-cover bg-center bg-muted" style={{ backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined }}>
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Activity className="w-8 h-8 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded bg-white font-display font-black text-[10px] uppercase tracking-widest ${isLive ? 'text-amber' : status === 'open' ? 'text-primary' : 'text-muted-foreground'}`}>
            {isLive ? 'LIVE' : status}
          </span>
        </div>
        
        {((isLive || isFillingFast) || showUrgency) && status !== 'completed' && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {(isLive || isFillingFast) && (
              <span className={`font-display font-bold text-xs text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center justify-center gap-1.5 border border-white/20 ${isLive ? 'text-amber' : ''}`}>
                {isLive && <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />}
                {isLive ? 'Registering' : `${spotsRemaining} spots left`}
              </span>
            )}
            {showUrgency && (
              <span className="font-display font-bold text-xs text-white bg-destructive/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                Closes in {daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h4 className="text-xl font-display font-black uppercase tracking-tight leading-none mb-1 shadow-sm group-hover:text-primary transition-colors line-clamp-2">
            {name}
          </h4>
          <p className="font-medium text-xs text-white/90 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> {shortLocation} • {startDate}
          </p>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-center mb-4 text-sm font-semibold text-muted-foreground">
          <span className="bg-muted px-2 py-1 rounded-md text-xs">{skillLevel || "All Levels"}</span>
          <span className="text-foreground font-bold">{entryFee ? `$${entryFee}` : 'Free'} Entry</span>
        </div>
        
        <div className="mt-auto">
          {status !== 'completed' && (
            <>
              <div className="flex justify-between items-end mb-1 text-sm font-bold">
                <span className="text-foreground flex items-center gap-1.5 text-xs"><Users className="w-3.5 h-3.5 text-muted-foreground"/> {spotsFilled}/{spotsTotal} filled</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isFillingFast ? 'bg-amber' : 'bg-primary'}`} 
                  style={{ width: `${Math.min(100, (spotsFilled / spotsTotal) * 100)}%` }}
                ></div>
              </div>
            </>
          )}

          <Button
            className="w-full bg-foreground text-background hover:bg-primary font-display font-bold uppercase tracking-widest text-xs transition-colors py-5 rounded-xl shadow-none"
            asChild
          >
            <Link to={isOwner ? `/tournaments/${id}` : status === "open" ? `/tournaments/${id}/register` : `/tournaments/${id}`}>
              {isOwner
                ? "Manage Event"
                : status === "open"
                  ? "Register Now"
                  : isLive
                    ? "Watch Live"
                    : "View Details"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
