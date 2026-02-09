import { Link } from "react-router-dom";
import { Calendar, MapPin, Heart, Share2, Signal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
  featured,
  entryFee,
  skillLevel,
  imageUrl,
  organizerId,
}: TournamentCardProps) => {
  const { user } = useAuth();
  const isOwner = user?._id === organizerId || user?.role === 'admin';
  const isLive = status === "in-progress";

  // Extract city/state from location
  const locationParts = location?.split(",") || [];
  const shortLocation = locationParts.length >= 2
    ? `${locationParts[0].trim()}, ${locationParts[locationParts.length - 1].trim()}`
    : location;

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      {/* Image Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Signal className="w-8 h-8 text-primary/40" />
            </div>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* LIVE Badge */}
        {isLive && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground font-display text-xs px-3 py-1 shadow-md border-0 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              LIVE
            </Badge>
          </div>
        )}

        {/* Entry Fee Badge */}
        {entryFee !== undefined && entryFee > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-foreground/80 text-background font-display text-xs px-3 py-1 shadow-md border-0 backdrop-blur-sm">
              ${entryFee} Entry
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location + Favorite */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-display font-semibold tracking-wider text-primary uppercase">
            {shortLocation}
          </span>
          <button className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Tournament Name */}
        <h3 className="text-lg font-display font-bold text-foreground mb-3 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Date + Skill */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{startDate} - {endDate}</span>
          </div>
          {skillLevel && (
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <span>{skillLevel}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 font-display text-sm h-10 shadow-sm"
            asChild
          >
            <Link to={isOwner ? `/tournaments/${id}` : status === "open" ? `/tournaments/${id}/register` : `/tournaments/${id}`}>
              {isOwner
                ? "View Details"
                : status === "open"
                  ? "Register Now"
                  : status === "in-progress"
                    ? "Watch Live"
                    : "View Details"}
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
