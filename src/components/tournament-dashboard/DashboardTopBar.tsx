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
    className: "bg-primary text-primary-foreground border-transparent",
    dotClass: "bg-background animate-[blink_2s_ease-in-out_infinite]",
  },
  closed: {
    label: "Registration Closed",
    className: "bg-muted text-foreground border-transparent",
    dotClass: "bg-muted-foreground",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-destructive text-destructive-foreground border-transparent",
    dotClass: "bg-white animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-foreground text-background border-transparent",
    dotClass: "bg-background",
  },
  draft: {
    label: "Draft",
    className: "bg-card text-muted-foreground border-border/80 border-2",
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
    <div className="flex flex-col gap-4 mb-6 animate-fade-in">
      {/* Top: Back + Name + Status + Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6 min-w-0 bg-card p-6 rounded-xl border-2 border-border shadow-sm">
        <Link
          to="/tournaments"
          className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border/80 self-start"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <h1 className="font-display font-black text-3xl sm:text-4xl truncate uppercase tracking-tight text-foreground">
              {tournament.name}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "font-bold text-xs uppercase tracking-widest px-2 py-0.5",
                statusInfo.className
              )}
            >
              <span
                className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)}
              />
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary font-bold tracking-widest uppercase mt-3">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {format(new Date(tournament.startDate), "MMM dd, yyyy")} –{" "}
              {format(new Date(tournament.endDate), "MMM dd, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: Actions — scrollable on mobile */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {(tournament.status === "open" || tournament.status === "closed") && (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 font-display font-bold text-base tracking-wide uppercase shrink-0 rounded-xl shadow-sm"
            onClick={onStartTournament}
          >
            <Trophy className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Start Tournament</span>
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
          className="h-12 w-12 rounded-xl border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-colors shrink-0"
          onClick={onToggleFavorite}
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isFavorite && "fill-destructive text-destructive"
            )}
          />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-colors shrink-0"
        >
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-muted-foreground transition-colors shrink-0"
          onClick={onDeleteTournament}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardTopBar;
