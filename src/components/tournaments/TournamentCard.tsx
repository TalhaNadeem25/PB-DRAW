import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Trophy, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}

const statusConfig = {
  open: { 
    label: "Open", 
    className: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary"
  },
  closed: { 
    label: "Closed", 
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground"
  },
  "in-progress": { 
    label: "Live", 
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive animate-pulse"
  },
  completed: { 
    label: "Completed", 
    className: "bg-accent text-accent-foreground border-accent-foreground/20",
    dotClass: "bg-accent-foreground"
  },
};

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
  featured,
}: TournamentCardProps) => {
  const percentFull = Math.round((playerCount / maxPlayers) * 100);
  const statusInfo = statusConfig[status];

  return (
    <div className="group relative glass-card-hover rounded-2xl overflow-hidden">
      {/* Featured badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-secondary text-secondary-foreground font-display shadow-glow-yellow border-0">
            <Trophy className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}

      {/* Top gradient accent */}
      <div className="h-1.5 bg-hero-gradient" />

      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={cn("font-medium border", statusInfo.className)}>
            <span className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)} />
            {statusInfo.label}
          </Badge>
          
          {status === "in-progress" && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <Zap className="w-3 h-3" />
              <span>Live</span>
            </div>
          )}
        </div>

        {/* Tournament Name */}
        <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-muted-foreground mb-5">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="text-sm truncate">{location}</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{startDate}</div>
              <div className="text-xs text-muted-foreground">to {endDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{eventCount}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
          </div>
        </div>

        {/* Player Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium">{playerCount} / {maxPlayers}</span>
            </div>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              percentFull >= 90 ? "bg-destructive/10 text-destructive" :
              percentFull >= 70 ? "bg-warning/10 text-warning" :
              "bg-muted text-muted-foreground"
            )}>
              {percentFull}% Full
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                percentFull >= 90 ? "bg-destructive" :
                percentFull >= 70 ? "bg-warning" :
                "bg-hero-gradient"
              )}
              style={{ width: `${percentFull}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="default" 
            className="flex-1 group/btn shadow-md hover:shadow-glow transition-shadow" 
            asChild
          >
            <Link to={`/tournaments/${id}`}>
              View Details
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
          {status === "open" && (
            <Button variant="outline" className="hover-lift" asChild>
              <Link to={`/tournaments/${id}/register`}>Register</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
