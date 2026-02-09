import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Trophy, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ExportButtons from "@/components/tournament/ExportButtons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusConfig = {
  open: {
    label: "Registration Open",
    className: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary",
  },
  closed: {
    label: "Registration Closed",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-accent text-accent-foreground border-accent-foreground/20",
    dotClass: "bg-accent-foreground",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

interface DashboardTopBarProps {
  tournament: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStartTournament: () => void;
  onDeleteTournament: () => void;
}

const DashboardTopBar = ({
  tournament,
  isFavorite,
  onToggleFavorite,
  onStartTournament,
  onDeleteTournament,
}: DashboardTopBarProps) => {
  const statusInfo =
    statusConfig[tournament.status as keyof typeof statusConfig] ||
    statusConfig.draft;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
      {/* Left: Back + Name + Status + Date */}
      <div className="flex items-center gap-4 min-w-0">
        <Link
          to="/tournaments"
          className="shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-2xl truncate">
              {tournament.name}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "font-medium border shrink-0",
                statusInfo.className
              )}
            >
              <span
                className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)}
              />
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(tournament.startDate), "MMM dd, yyyy")} –{" "}
            {format(new Date(tournament.endDate), "MMM dd, yyyy")}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {(tournament.status === "open" || tournament.status === "closed") && (
          <Button
            size="sm"
            className="bg-court-green text-white hover:bg-court-green-dark shadow-lg"
            onClick={onStartTournament}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Start Tournament
          </Button>
        )}

        <ExportButtons
          tournament={tournament}
          matches={tournament.matches || []}
          teams={tournament.teams || []}
          events={tournament.events || []}
          variant="outline"
        />

        <Button
          variant="outline"
          size="icon"
          className="hover:shadow-glow transition-shadow"
          onClick={onToggleFavorite}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite && "fill-red-500 text-red-500"
            )}
          />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="hover:shadow-glow transition-shadow"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          onClick={onDeleteTournament}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardTopBar;
