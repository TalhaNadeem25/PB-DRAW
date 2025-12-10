import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const statusColors = {
  open: "bg-primary text-primary-foreground",
  closed: "bg-muted text-muted-foreground",
  "in-progress": "bg-secondary text-secondary-foreground",
  completed: "bg-accent text-accent-foreground",
};

const statusLabels = {
  open: "Registration Open",
  closed: "Registration Closed",
  "in-progress": "In Progress",
  completed: "Completed",
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

  return (
    <div className="group relative bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-secondary text-secondary-foreground font-display">
            🏆 Featured
          </Badge>
        </div>
      )}

      {/* Header with gradient */}
      <div className="h-3 bg-hero-gradient" />

      <div className="p-6">
        {/* Status Badge */}
        <Badge className={`${statusColors[status]} mb-4`}>
          {statusLabels[status]}
        </Badge>

        {/* Tournament Name */}
        <h3 className="text-xl font-display font-bold mb-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{startDate}</div>
              <div className="text-muted-foreground text-xs">to {endDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{eventCount} Events</div>
              <div className="text-muted-foreground text-xs">Available</div>
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
            <span className="text-muted-foreground">{percentFull}% Full</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-hero-gradient rounded-full transition-all duration-500"
              style={{ width: `${percentFull}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="default" className="flex-1" asChild>
            <Link to={`/tournaments/${id}`}>View Details</Link>
          </Button>
          {status === "open" && (
            <Button variant="outline" asChild>
              <Link to={`/tournaments/${id}/register`}>Register</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
