import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, ShareNetwork, Trophy, Trash, Calendar, CheckCircle } from "@phosphor-icons/react";
import ExportButtons from "@/components/tournament/ExportButtons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Pill, PbBtn, Dot } from "@/components/ui/pb";
import { poolAPI, matchAPI, teamAPI } from "@/services/api";

const statusConfig = {
  open:        { label: "Registration Open", tone: "court"   as const, pulse: true  },
  closed:      { label: "Closed",            tone: "neutral" as const, pulse: false },
  "in-progress": { label: "Live",            tone: "amber"   as const, pulse: true  },
  completed:   { label: "Completed",         tone: "ink"     as const, pulse: false },
  draft:       { label: "Draft",             tone: "neutral" as const, pulse: false },
};

interface DashboardTopBarProps {
  tournament: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStartTournament: () => void;
  onCompleteTournament: () => void;
  onDeleteTournament: () => void;
}

const DashboardTopBar = ({
  tournament,
  isFavorite,
  onToggleFavorite,
  onStartTournament,
  onCompleteTournament,
  onDeleteTournament,
}: DashboardTopBarProps) => {
  const status = statusConfig[tournament.status as keyof typeof statusConfig] ?? statusConfig.draft;

  // Tournament documents don't carry matches/teams directly (those live under each
  // event's pools) — fetch them here so Print/Export has real data instead of the
  // always-empty tournament.matches / tournament.teams.
  const events: any[] = tournament.events || [];
  const { data: exportData } = useQuery({
    queryKey: ["tournament-export-data", tournament._id],
    queryFn: async () => {
      const allMatches: any[] = [];
      const allTeams: any[] = [];

      for (const event of events) {
        try {
          const teamsResponse = await teamAPI.getByEvent(event._id);
          allTeams.push(...(teamsResponse.data || []));
        } catch (error) {
          console.error(`Error fetching teams for event ${event._id}:`, error);
        }

        try {
          const poolsResponse = await poolAPI.getByEvent(event._id);
          const pools = poolsResponse.data || [];
          for (const pool of pools) {
            try {
              const matchesResponse = await matchAPI.getByPool(pool._id);
              const matches = matchesResponse.data || [];
              allMatches.push(
                ...matches.map((m: any) => ({ ...m, event: { _id: event._id, name: event.name } }))
              );
            } catch (error) {
              console.error(`Error fetching matches for pool ${pool._id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching pools for event ${event._id}:`, error);
        }
      }

      return { matches: allMatches, teams: allTeams };
    },
    enabled: events.length > 0,
  });

  return (
    <div className="mb-6 space-y-4">
      {/* Main card */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5 flex flex-col sm:flex-row sm:items-start gap-4">
        <Link
          to="/tournaments"
          className="shrink-0 w-9 h-9 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:text-pb-ink hover:border-pb-rule transition-colors self-start"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Eyebrow — dates */}
          <p className="flex items-center gap-1.5 text-[11px] font-mono text-pb-muted uppercase tracking-[0.08em] mb-2">
            <Calendar size={10} />
            {format(new Date(tournament.startDate), "MMM d")} – {format(new Date(tournament.endDate), "MMM d, yyyy")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-extrabold text-[clamp(22px,3vw,36px)] tracking-[-0.035em] leading-none text-pb-ink">
              {tournament.name}
            </h1>
            <Pill tone={status.tone} className="flex items-center gap-1.5 shrink-0">
              {status.pulse && <Dot color={status.tone === "amber" ? "amber" : "court"} size={5} pulse />}
              {status.label}
            </Pill>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
        {(tournament.status === "open" || tournament.status === "closed") && (
          <PbBtn variant="primary" size="md" onClick={onStartTournament} className="shrink-0">
            <Trophy size={14} /> Start Tournament
          </PbBtn>
        )}

        {tournament.status === "in-progress" && (
          <PbBtn variant="outline" size="md" onClick={onCompleteTournament} className="shrink-0">
            <CheckCircle size={14} /> Complete Tournament
          </PbBtn>
        )}

        <ExportButtons
          tournament={tournament}
          matches={exportData?.matches || []}
          teams={exportData?.teams || []}
          events={events}
          variant="outline"
        />

        <button
          onClick={onToggleFavorite}
          className="h-9 w-9 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors shrink-0"
        >
          <Heart
            size={15}
            className={cn("transition-colors", isFavorite && "fill-destructive text-destructive")}
          />
        </button>

        <button className="h-9 w-9 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors shrink-0">
          <ShareNetwork size={15} />
        </button>

        <button
          onClick={onDeleteTournament}
          className="h-9 w-9 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:border-destructive/50 hover:text-destructive transition-colors shrink-0"
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
};

export default DashboardTopBar;
