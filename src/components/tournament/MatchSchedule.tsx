import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Zap,
  Check,
  Filter,
  MoreVertical,
  AlertTriangle,
  X,
  Radio,
  Flame,
  Inbox,
  Plus,
  GripVertical,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfDay, endOfDay, isWithinInterval, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { courtAPI } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Match {
  _id: string;
  team1: {
    _id: string;
    name?: string;
    players: Array<{ _id: string; name: string }>;
  };
  team2?: {
    _id: string;
    name?: string;
    players: Array<{ _id: string; name: string }>;
  };
  scheduledTime?: string;
  courtNumber?: number;
  status: string;
  score?: {
    team1Score: number;
    team2Score: number;
  };
  pool?: {
    _id: string;
    name: string;
  };
  event?: {
    _id: string;
    name: string;
  };
  bracket?: string;
  round?: number;
}

interface MatchScheduleProps {
  matches: Match[];
  pools?: Array<{ _id: string; name: string; event?: { _id: string; name: string } }>;
  events?: Array<{ _id: string; name: string }>;
  selectedEventId?: string;
  onEventChange?: (eventId: string) => void;
  tournamentId?: string;
}

const EVENT_DOT_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-blue-500",
  "bg-amber-500",
];

const MatchSchedule = ({
  matches,
  pools = [],
  events = [],
  selectedEventId = "all",
  onEventChange,
  tournamentId,
}: MatchScheduleProps) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"scheduler" | "live" | "auto">("scheduler");
  const [conflictCount, setConflictCount] = useState<number | null>(null);
  const [showConflictBanner, setShowConflictBanner] = useState(true);
  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null);
  const [addedCourts, setAddedCourts] = useState<number[]>([]);
  const [collapsedPools, setCollapsedPools] = useState<Set<string>>(new Set());

  const getTeamName = (team: Match["team1"]) => {
    if (team.name) return team.name;
    return team.players?.map((p) => p.name).join(" / ") || "TBD";
  };

  const getMatchLabel = (match: Match) => {
    const eventName = match.event?.name || match.pool?.name || "";
    const short = eventName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const round = match.round ?? match.pool?.name?.replace(/\D/g, "") ?? "";
    return `${short || "M"}-${round || match._id.slice(-3)}`;
  };

  const eventColor = (eventId: string) => {
    const idx = events.findIndex((e) => e._id === eventId);
    return EVENT_DOT_COLORS[idx % EVENT_DOT_COLORS.length];
  };

  // Unscheduled matches (match pool)
  const unscheduledMatches = matches.filter(
    (m) => !m.scheduledTime || !m.courtNumber
  );

  // Scheduled for selected date
  const scheduledMatches = matches.filter((m) => {
    if (!m.scheduledTime) return false;
    const d = new Date(m.scheduledTime);
    return isWithinInterval(d, {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    });
  });

  const filteredPoolMatches = unscheduledMatches.filter((m) => {
    const eventMatch =
      selectedEventId === "all" || m.event?._id === selectedEventId;
    const searchMatch =
      !searchQuery ||
      getTeamName(m.team1).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.team2 && getTeamName(m.team2).toLowerCase().includes(searchQuery.toLowerCase())) ||
      getMatchLabel(m).toLowerCase().includes(searchQuery.toLowerCase());
    const poolMatch =
      !poolFilter ||
      (m.pool?.name?.toLowerCase().includes(poolFilter.toLowerCase()));
    return eventMatch && searchMatch && poolMatch;
  });

  // Group filtered pool matches by pool
  const matchesByPool = filteredPoolMatches.reduce((acc, match) => {
    const poolId = match.pool?._id || "ungrouped";
    if (!acc[poolId]) acc[poolId] = [];
    acc[poolId].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const poolGroups = Object.entries(matchesByPool).map(([poolId, poolMatches]) => {
    const poolInfo = pools.find((p) => p._id === poolId);
    return {
      poolId,
      poolName: poolInfo?.name || poolMatches[0]?.pool?.name || "Ungrouped",
      matches: poolMatches,
    };
  });

  const sortedScheduled = [...scheduledMatches].sort(
    (a, b) =>
      new Date(a.scheduledTime!).getTime() -
      new Date(b.scheduledTime!).getTime()
  );

  const matchesByCourt = sortedScheduled.reduce(
    (acc, match) => {
      const court = match.courtNumber ?? 0;
      if (!acc[court]) acc[court] = [];
      acc[court].push(match);
      return acc;
    },
    {} as Record<number, Match[]>
  );

  const courtNumbers = Array.from(
    new Set(scheduledMatches.map((m) => m.courtNumber).filter(Boolean))
  ) as number[];

  // Merge scheduled court numbers with manually added courts
  const allCourtNumbers = Array.from(new Set([
    ...courtNumbers,
    ...addedCourts,
    ...(courtNumbers.length === 0 && addedCourts.length === 0 ? [1, 2] : []),
  ])).sort((a, b) => a - b);

  const togglePoolCollapse = (poolId: string) => {
    setCollapsedPools((prev) => {
      const next = new Set(prev);
      if (next.has(poolId)) next.delete(poolId);
      else next.add(poolId);
      return next;
    });
  };

  // ── Drag & Drop handlers ──
  const handleDragStart = (match: Match) => {
    setDraggedMatch(match);
  };

  const handleDragEnd = () => {
    setDraggedMatch(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCourt = async (courtNumber: number) => {
    if (!draggedMatch) return;
    try {
      // Use selectedDate with a default time for scheduling
      const scheduleTime = new Date(selectedDate);
      scheduleTime.setHours(9, 0, 0, 0); // Default to 9 AM
      await courtAPI.assignMatch(draggedMatch._id, {
        courtNumber,
        scheduledTime: scheduleTime.toISOString(),
        courtName: `Court ${courtNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      toast.success(`Match assigned to Court ${String(courtNumber).padStart(2, "0")}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to assign match");
    }
    setDraggedMatch(null);
  };

  // ── Add Court handler ──
  const handleAddCourt = async () => {
    const maxExisting = Math.max(...allCourtNumbers, 0);
    const newNumber = maxExisting + 1;
    setAddedCourts((prev) => [...prev, newNumber]);

    if (tournamentId) {
      try {
        const allCourts = [...allCourtNumbers, newNumber].map((num) => ({
          number: num,
          name: `Court ${num}`,
          type: "indoor" as const,
          available: true,
        }));
        await courtAPI.updateConfiguration(tournamentId, {
          courts: allCourts,
          scheduling: {},
        });
        toast.success(`Court ${String(newNumber).padStart(2, "0")} added`);
      } catch {
        toast.error("Failed to save court configuration");
      }
    }
  };

  const handleAutoSchedule = async () => {
    if (!tournamentId) {
      toast.error("Tournament context required for auto-schedule");
      return;
    }
    try {
      await courtAPI.autoSchedule(tournamentId, "balanced");
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      toast.success("Schedule generated. Review and publish when ready.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Auto-schedule failed");
    }
  };

  const handleCheckConflicts = async () => {
    if (!tournamentId) return;
    try {
      const result = await courtAPI.checkConflicts(tournamentId);
      const count = result?.data?.conflicts?.length ?? result?.conflicts?.length ?? 0;
      setConflictCount(count);
      setShowConflictBanner(true);
      if (count > 0) toast.warning(`${count} scheduling conflict(s) found`);
      else toast.success("No conflicts found");
    } catch {
      setConflictCount(0);
    }
  };

  const handlePublish = () => {
    if (conflictCount && conflictCount > 0) {
      toast.error("Resolve conflicts before publishing");
      return;
    }
    toast.success("Changes published");
  };

  // —— Match card (pool and court) ——
  const MatchCard = ({
    match,
    variant = "pool",
  }: {
    match: Match;
    variant?: "pool" | "court";
  }) => {
    const label = getMatchLabel(match);
    const eventId = match.event?._id ?? "";
    const dotClass = eventColor(eventId);
    const isLive = match.status === "in-progress" || match.status === "in_progress";
    const isCompleted = match.status === "completed";
    const isWarmUp = match.status === "warm-up" || match.status === "warm_up";
    const scoreStr =
      match.score != null
        ? `${match.score.team1Score}-${match.score.team2Score}`
        : null;
    const timeStr = match.scheduledTime
      ? format(new Date(match.scheduledTime), "h:mm a")
      : null;

    return (
      <div
        draggable={variant === "pool"}
        onDragStart={variant === "pool" ? () => handleDragStart(match) : undefined}
        onDragEnd={variant === "pool" ? handleDragEnd : undefined}
        className={cn(
          "glass-card-hover rounded-xl p-3 space-y-2 transition-all duration-200",
          isLive && "ring-1 ring-destructive/30",
          variant === "pool" && "cursor-grab active:cursor-grabbing"
        )}
      >
        {/* Top row: label + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {variant === "pool" && (
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-display font-semibold text-primary-foreground",
                dotClass
              )}
            >
              {label}
            </span>
          </div>
          {variant === "court" && (
            <div className="flex items-center gap-1">
              {isLive && (
                <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
                  <Radio className="w-3 h-3" />
                  LIVE
                </Badge>
              )}
              {isWarmUp && !isLive && (
                <Badge className="bg-blue-500/90 text-xs gap-1">
                  <Flame className="w-3 h-3" />
                  WARM UP
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="text-xs">Done</Badge>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
          {variant === "pool" && (
            <span className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded">45m</span>
          )}
        </div>

        {/* Teams */}
        <div className="font-display font-bold text-sm leading-snug">
          {getTeamName(match.team1)} <span className="text-muted-foreground font-normal">vs</span> {match.team2 ? getTeamName(match.team2) : "TBD"}
        </div>

        {/* Pool info / Court info */}
        {variant === "pool" && (
          <p className="text-xs text-muted-foreground">
            {match.status === "pending"
              ? "Awaiting assignment"
              : match.pool?.name ?? "Match pool"}
          </p>
        )}
        {variant === "court" && (
          <>
            {scoreStr && (
              <p className="text-sm font-display font-bold text-foreground">{scoreStr}</p>
            )}
            {timeStr && (
              <p className="text-xs text-muted-foreground">
                Est. {timeStr} END
              </p>
            )}
            {isWarmUp && !scoreStr && (
              <p className="text-xs text-muted-foreground">Starting soon</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Control Panel ── */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        {/* Row 1: Date nav + Event filters + Mode tabs */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-display font-bold text-foreground min-w-[170px] text-center">
              {format(selectedDate, "MMMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Event Filter Chips */}
          {events.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onEventChange?.("all")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  selectedEventId === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "glass text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                All
              </button>
              {events.map((ev) => (
                <button
                  key={ev._id}
                  type="button"
                  onClick={() => onEventChange?.(ev._id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    selectedEventId === ev._id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "glass text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", eventColor(ev._id))} />
                  {ev.name}
                </button>
              ))}
            </div>
          )}

          {/* Mode Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="shrink-0"
          >
            <TabsList className="bg-muted/50 border border-border/50 p-1 rounded-xl">
              <TabsTrigger
                value="scheduler"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm"
              >
                Scheduler
              </TabsTrigger>
              <TabsTrigger value="live" className="rounded-lg text-sm">
                Live View
              </TabsTrigger>
              <TabsTrigger value="auto" className="rounded-lg gap-1.5 text-sm">
                <Zap className="w-3.5 h-3.5" />
                Auto
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Row 2: Search + Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search matches or players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 glass rounded-xl text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {tournamentId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-sm"
                  onClick={handleAutoSchedule}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Auto-Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-sm"
                  onClick={handleCheckConflicts}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  Check Conflicts
                </Button>
              </>
            )}
            <Button
              size="sm"
              className="rounded-xl bg-primary text-primary-foreground hover:shadow-glow text-sm"
              onClick={handlePublish}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* ── Conflict Banner ── */}
      {showConflictBanner && conflictCount != null && conflictCount > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-1 bg-destructive" />
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-destructive">
                  {conflictCount} Scheduling Conflict{conflictCount !== 1 ? "s" : ""} Found
                </p>
                <p className="text-xs text-muted-foreground">
                  Resolve before publishing
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={() => setShowConflictBanner(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Board: Match Pool + Courts ── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[400px] lg:min-h-[480px]">
        {/* Left: Match Pool — grouped by pool */}
        <div className="w-full lg:max-w-[300px] lg:shrink-0 flex flex-col glass-card rounded-2xl overflow-hidden max-h-[320px] lg:max-h-none min-h-0">
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-foreground">
                Match Pool
              </h3>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-display font-bold">
                {filteredPoolMatches.length}
              </Badge>
            </div>
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by pool..."
                value={poolFilter}
                onChange={(e) => setPoolFilter(e.target.value)}
                className="pl-8 h-8 text-sm glass rounded-lg"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-1 pr-1">
              {filteredPoolMatches.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No matches in pool</p>
                </div>
              ) : (
                poolGroups.map(({ poolId, poolName, matches: groupMatches }) => {
                  const isCollapsed = collapsedPools.has(poolId);
                  return (
                    <div key={poolId} className="mb-2">
                      {/* Pool group header */}
                      <button
                        type="button"
                        onClick={() => togglePoolCollapse(poolId)}
                        className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                              isCollapsed && "-rotate-90"
                            )}
                          />
                          <span className="font-display font-semibold text-xs uppercase tracking-wider text-foreground truncate">
                            {poolName}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-display font-bold shrink-0">
                          {groupMatches.length}
                        </Badge>
                      </button>
                      {/* Pool matches */}
                      {!isCollapsed && (
                        <div className="space-y-2 mt-1 ml-1">
                          {groupMatches.map((match) => (
                            <MatchCard key={match._id} match={match} variant="pool" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Court columns */}
        <div className="flex-1 min-w-0 flex gap-5 overflow-x-auto pb-2 scrollbar-hide min-h-[280px]">
          {allCourtNumbers.map((courtNum) => {
            const courtMatches = matchesByCourt[courtNum] ?? [];
            const isDropTarget = !!draggedMatch;
            return (
              <div
                key={courtNum}
                className={cn(
                  "w-[280px] shrink-0 flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-200",
                  isDropTarget && "ring-2 ring-primary/30 ring-dashed"
                )}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnCourt(courtNum)}
              >
                <div className="px-4 py-3 border-b border-border/40">
                  <h3 className="font-display font-bold text-foreground">
                    Court {String(courtNum).padStart(2, "0")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {courtMatches.length} match{courtMatches.length !== 1 ? "es" : ""}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] transition-colors duration-200",
                    isDropTarget && "bg-primary/5"
                  )}
                >
                  {courtMatches.map((match) => (
                    <MatchCard key={match._id} match={match} variant="court" />
                  ))}
                  {/* Drop zone placeholder */}
                  <div
                    className={cn(
                      "w-full rounded-xl border-2 border-dashed",
                      "flex flex-col items-center justify-center py-8 px-4",
                      "transition-all duration-200",
                      isDropTarget
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/50 hover:border-primary/30 hover:bg-primary/5 group"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors",
                      isDropTarget ? "bg-primary/20" : "bg-muted/60 group-hover:bg-primary/10"
                    )}>
                      <Plus className={cn(
                        "w-5 h-5 transition-colors",
                        isDropTarget ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )} />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isDropTarget ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )}>
                      {isDropTarget ? "Drop here" : "Queue Match"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Court button */}
          <button
            type="button"
            onClick={handleAddCourt}
            className={cn(
              "w-[200px] shrink-0 flex flex-col items-center justify-center",
              "glass-card rounded-2xl border-2 border-dashed border-border/40",
              "hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-muted/60 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-display font-bold text-sm text-muted-foreground group-hover:text-primary transition-colors">
              Add Court
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchSchedule;
