import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  Lightning,
  Check,
  Funnel,
  DotsThreeVertical,
  Warning,
  X,
  Radio,
  Flame,
  Tray,
  Plus,
  DotsSixVertical,
  ArrowsLeftRight,
  XCircle,
  Trash,
  CircleNotch,
} from "@phosphor-icons/react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfDay, endOfDay, isWithinInterval, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { courtAPI } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PlayerScoreSubmit from "./PlayerScoreSubmit";

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
  /** Tournament start date – after auto-schedule we show this day so courts display the scheduled matches */
  tournamentStartDate?: string;
  /** Current logged-in user ID (for player score submission) */
  currentUserId?: string;
}

const EVENT_DOT_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-blue-500",
  "bg-amber-500",
];

const EVENT_BORDER_COLORS = [
  "border-primary",
  "border-secondary",
  "border-blue-500",
  "border-amber-500",
];

const MatchSchedule = ({
  matches,
  pools = [],
  events = [],
  tournamentStartDate,
  selectedEventId = "all",
  onEventChange,
  tournamentId,
  currentUserId,
}: MatchScheduleProps) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [conflictCount, setConflictCount] = useState<number | null>(null);
  const [conflictList, setConflictList] = useState<Array<{
    type: string;
    team?: string;
    court?: string;
    time: string;
    matches: string[];
  }>>([]);
  const [showConflictBanner, setShowConflictBanner] = useState(true);
  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null);
  const [addedCourts, setAddedCourts] = useState<number[]>([]);
  const [collapsedPools, setCollapsedPools] = useState<Set<string>>(new Set());
  const courtsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // New states for click-to-assign, dialogs, onboarding
  const [selectedPoolMatch, setSelectedPoolMatch] = useState<Match | null>(null);
  const [matchToRemove, setMatchToRemove] = useState<Match | null>(null);
  const [showAutoScheduleDialog, setShowAutoScheduleDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = courtsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollCourts = (direction: "left" | "right") => {
    const el = courtsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  };

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

  const eventBorderColor = (eventId: string) => {
    const idx = events.findIndex((e) => e._id === eventId);
    return EVENT_BORDER_COLORS[idx % EVENT_BORDER_COLORS.length];
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

  // Merge scheduled court numbers with manually added courts (always include 1 & 2 as defaults)
  const allCourtNumbers = Array.from(new Set([
    1, 2,
    ...courtNumbers,
    ...addedCourts,
  ])).sort((a, b) => a - b);

  useEffect(() => {
    const el = courtsScrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      ro.disconnect();
    };
  }, [updateScrollButtons, allCourtNumbers.length]);

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

  const getNextScheduleTime = (courtNumber: number) => {
    const courtMatches = matchesByCourt[courtNumber] ?? [];
    const scheduleTime = new Date(selectedDate);
    const lastMatch = courtMatches[courtMatches.length - 1];
    if (lastMatch?.scheduledTime) {
      const lastTime = new Date(lastMatch.scheduledTime);
      lastTime.setMinutes(lastTime.getMinutes() + 45);
      scheduleTime.setHours(lastTime.getHours(), lastTime.getMinutes(), 0, 0);
    } else {
      scheduleTime.setHours(9, 0, 0, 0);
    }
    return scheduleTime;
  };

  const handleDropOnCourt = async (courtNumber: number) => {
    if (!draggedMatch) return;
    try {
      const scheduleTime = getNextScheduleTime(courtNumber);
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

  // ── Click-to-assign handler ──
  const handleClickAssign = async (match: Match, courtNumber: number) => {
    try {
      const scheduleTime = getNextScheduleTime(courtNumber);
      await courtAPI.assignMatch(match._id, {
        courtNumber,
        scheduledTime: scheduleTime.toISOString(),
        courtName: `Court ${courtNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      toast.success(`Match assigned to Court ${String(courtNumber).padStart(2, "0")}`);
      setSelectedPoolMatch(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to assign match");
    }
  };

  // ── Move match between courts ──
  const handleMoveMatch = async (match: Match, targetCourt: number) => {
    try {
      await courtAPI.assignMatch(match._id, {
        courtNumber: targetCourt,
        scheduledTime: match.scheduledTime || new Date(selectedDate).toISOString(),
        courtName: `Court ${targetCourt}`,
      });
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      toast.success(`Match moved to Court ${String(targetCourt).padStart(2, "0")}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to move match");
    }
  };

  // ── Remove match from schedule ──
  const handleRemoveFromSchedule = async (match: Match) => {
    try {
      await courtAPI.assignMatch(match._id, {
        courtNumber: 0,
        scheduledTime: "",
        courtName: "",
      });
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      toast.success("Match removed from schedule");
      setMatchToRemove(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to remove match");
    }
  };

  // ── Reorder matches within a court ──
  const handleReorderMatch = async (
    match: Match,
    courtMatchList: Match[],
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= courtMatchList.length) return;
    const other = courtMatchList[targetIndex];
    try {
      await Promise.all([
        courtAPI.assignMatch(match._id, {
          courtNumber: match.courtNumber!,
          scheduledTime: other.scheduledTime!,
          courtName: `Court ${match.courtNumber}`,
        }),
        courtAPI.assignMatch(other._id, {
          courtNumber: other.courtNumber!,
          scheduledTime: match.scheduledTime!,
          courtName: `Court ${other.courtNumber}`,
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      toast.success("Match order updated");
    } catch {
      toast.error("Failed to reorder matches");
    }
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

  const handleCheckConflicts = async () => {
    if (!tournamentId) return;
    try {
      const result = await courtAPI.checkConflicts(tournamentId);
      const list = result?.data?.conflicts ?? result?.conflicts ?? [];
      const count = list.length;
      setConflictCount(count);
      setConflictList(
        list.map((c: any) => ({
          type: c.type,
          team: c.team,
          court: c.court,
          time: c.time ? new Date(c.time).toISOString() : "",
          matches: c.matches?.map((id: any) => String(id)) ?? [],
        }))
      );
      setShowConflictBanner(true);
      if (count > 0) toast.warning(`${count} scheduling conflict(s) found — see details below`);
      else toast.success("No conflicts found");
    } catch {
      setConflictCount(0);
      setConflictList([]);
    }
  };

  const handlePublish = () => {
    if (conflictCount != null && conflictCount > 0) {
      setShowConflictBanner(true);
      const first = conflictList[0];
      const where =
        first?.type === "team-overlap"
          ? `Team "${first.team}" has 2 matches at ${first.time ? format(new Date(first.time), "MMM d, h:mm a") : "same time"}`
          : first?.type === "court-double-booked"
            ? `${first.court || "Court"} double-booked at ${first.time ? format(new Date(first.time), "MMM d, h:mm a") : "same time"}`
            : `${conflictCount} conflict(s)`;
      toast.error(`Resolve conflicts before publishing. Example: ${where}. See full list below.`);
      return;
    }
    toast.success("Schedule published");
  };

  // —— Match card (pool and court) ——
  const MatchCard = ({
    match,
    variant = "pool",
    courtMatchList,
    matchIndex,
  }: {
    match: Match;
    variant?: "pool" | "court";
    courtMatchList?: Match[];
    matchIndex?: number;
  }) => {
    const label = getMatchLabel(match);
    const eventId = match.event?._id ?? "";
    const dotClass = eventColor(eventId);
    const borderClass = eventBorderColor(eventId);
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

    const cardContent = (
      <div
        draggable={variant === "pool"}
        onDragStart={variant === "pool" ? () => handleDragStart(match) : undefined}
        onDragEnd={variant === "pool" ? handleDragEnd : undefined}
        className={cn(
          "rounded-xl p-3 space-y-2 transition-all duration-200",
          variant === "pool" && "glass-card-hover border-l-4 cursor-pointer active:scale-[0.98]",
          variant === "pool" && borderClass,
          variant === "court" && "bg-card/60 border border-border/40",
          isLive && "ring-1 ring-destructive/30 bg-destructive/5",
          isCompleted && variant === "court" && "opacity-70"
        )}
      >
        {/* Top row: label + status/actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {variant === "pool" && (
              <DotsSixVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
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
              {/* Reorder arrows */}
              {courtMatchList && courtMatchList.length > 1 && matchIndex != null && (
                <div className="flex items-center gap-0.5 mr-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    disabled={matchIndex === 0}
                    onClick={() => handleReorderMatch(match, courtMatchList, matchIndex, "up")}
                  >
                    <CaretUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    disabled={matchIndex === courtMatchList.length - 1}
                    onClick={() => handleReorderMatch(match, courtMatchList, matchIndex, "down")}
                  >
                    <CaretDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                    <DotsThreeVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Match Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowsLeftRight className="w-3.5 h-3.5 mr-2" />
                      Move to Court
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {allCourtNumbers
                        .filter((c) => c !== match.courtNumber)
                        .map((courtNum) => (
                          <DropdownMenuItem
                            key={courtNum}
                            onClick={() => handleMoveMatch(match, courtNum)}
                          >
                            Court {String(courtNum).padStart(2, "0")}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setMatchToRemove(match)}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-2" />
                    Remove from Schedule
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            {match.pool?.name ?? "Awaiting assignment"}
          </p>
        )}
        {variant === "court" && (
          <>
            {scoreStr && (
              <p className="text-sm font-display font-bold text-foreground">{scoreStr}</p>
            )}
            {timeStr && (
              <p className="text-xs text-muted-foreground">
                {timeStr}
              </p>
            )}
            {isWarmUp && !scoreStr && (
              <p className="text-xs text-muted-foreground">Starting soon</p>
            )}
          </>
        )}
      </div>
    );

    // Pool variant: wrap in Popover for click-to-assign
    if (variant === "pool") {
      const showPlayerSubmit =
        !!currentUserId &&
        match.status !== "completed" &&
        match.status !== "cancelled";

      return (
        <div>
          <Popover
            open={selectedPoolMatch?._id === match._id}
            onOpenChange={(open) => { if (!open) setSelectedPoolMatch(null); }}
          >
            <PopoverTrigger asChild>
              <div onClick={() => setSelectedPoolMatch(match)}>
                {cardContent}
              </div>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-3">
              <p className="font-display font-bold text-sm mb-2">Assign to Court</p>
              <div className="grid grid-cols-2 gap-2">
                {allCourtNumbers.map((courtNum) => {
                  const count = (matchesByCourt[courtNum] ?? []).length;
                  return (
                    <Button
                      key={courtNum}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-sm font-display justify-between"
                      onClick={() => handleClickAssign(match, courtNum)}
                    >
                      <span>Court {String(courtNum).padStart(2, "0")}</span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          {showPlayerSubmit && (
            <PlayerScoreSubmit
              match={match}
              currentUserId={currentUserId}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
              }}
            />
          )}
        </div>
      );
    }

    return cardContent;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Control Panel ── */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        {/* Row 1: Date nav + Event filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <CaretLeft className="w-4 h-4" />
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
              <CaretRight className="w-4 h-4" />
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
        </div>

        {/* Row 2: Search + Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search matches or players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 glass rounded-xl text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {tournamentId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-sm"
                  onClick={() => setShowAutoScheduleDialog(true)}
                >
                  <Lightning className="w-3.5 h-3.5" />
                  Auto-Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-sm"
                  onClick={handleCheckConflicts}
                >
                  <Warning className="w-3.5 h-3.5 mr-1.5" />
                  Conflicts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash className="w-3.5 h-3.5 mr-1.5" />
                  Clear All
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

      {/* ── Conflict Banner (with details) ── */}
      {showConflictBanner && conflictCount != null && conflictCount > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-1 bg-destructive" />
          <div className="px-5 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <Warning className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-destructive">
                    {conflictCount} Scheduling Conflict{conflictCount !== 1 ? "s" : ""} Found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Resolve the following before publishing:
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                onClick={() => setShowConflictBanner(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ul className="mt-3 space-y-2 pl-12 sm:pl-0 sm:ml-12">
              {conflictList.map((c, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-destructive shrink-0">•</span>
                  {c.type === "team-overlap" ? (
                    <span>
                      <strong className="text-foreground">{c.team}</strong> has two matches at{" "}
                      <strong className="text-foreground">
                        {c.time ? format(new Date(c.time), "MMM d, h:mm a") : "same time"}
                      </strong>
                    </span>
                  ) : c.type === "court-double-booked" ? (
                    <span>
                      <strong className="text-foreground">{c.court || "Court"}</strong> is double-booked at{" "}
                      <strong className="text-foreground">
                        {c.time ? format(new Date(c.time), "MMM d, h:mm a") : "same time"}
                      </strong>
                    </span>
                  ) : (
                    <span>Conflict at {c.time ? format(new Date(c.time), "MMM d, h:mm a") : "scheduled time"}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Onboarding Banner ── */}
      {showOnboarding && scheduledMatches.length === 0 && unscheduledMatches.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-1 bg-hero-gradient" />
          <div className="flex items-start gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Lightning className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-foreground mb-1">
                Getting Started
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click any match in the pool on the left to pick a court, or drag it onto a court column.
                Use <strong className="text-foreground">Auto-Schedule</strong> to assign all matches automatically.
              </p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl shrink-0"
              onClick={() => setShowOnboarding(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Board: Match Pool + Courts ── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[400px] lg:min-h-[480px]">
        {/* Left: Match Pool — grouped by pool */}
        <div className="w-full lg:max-w-[300px] lg:shrink-0 flex flex-col glass-card rounded-2xl overflow-hidden max-h-[320px] lg:max-h-none min-h-0">
          <div className="h-1 bg-hero-gradient" />
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
              <Funnel className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
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
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    {unscheduledMatches.length === 0 ? (
                      <Check className="w-6 h-6 text-primary" />
                    ) : (
                      <Tray className="w-6 h-6 text-muted-foreground opacity-60" />
                    )}
                  </div>
                  <p className="font-display font-bold text-sm text-foreground mb-1">
                    {unscheduledMatches.length === 0
                      ? "All Matches Scheduled"
                      : "No Matches Found"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {unscheduledMatches.length === 0
                      ? "Every match has been assigned to a court. Use the Publish button when ready."
                      : searchQuery || poolFilter
                        ? "Try adjusting your search or filter."
                        : "Create events and pools first, then generate matches to start scheduling."}
                  </p>
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
                          <CaretDown
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
        <div className="flex-1 min-w-0 relative flex flex-col">
          {/* Court navigation header */}
          <div className="flex items-center justify-between gap-3 mb-3 px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-foreground">
                Courts
              </h3>
              <Badge variant="secondary" className="text-xs font-display font-bold">
                {allCourtNumbers.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => scrollCourts("left")}
                disabled={!canScrollLeft}
              >
                <CaretLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => scrollCourts("right")}
                disabled={!canScrollRight}
              >
                <CaretRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative flex-1 min-h-0">
          <div ref={courtsScrollRef} className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide min-h-[280px]">
            {allCourtNumbers.map((courtNum) => {
              const courtMatches = matchesByCourt[courtNum] ?? [];
              const isDropTarget = !!draggedMatch;
              const completedCount = courtMatches.filter((m) => m.status === "completed").length;
              const liveCount = courtMatches.filter(
                (m) => m.status === "in-progress" || m.status === "in_progress"
              ).length;
              return (
                <div
                  key={courtNum}
                  className={cn(
                    "w-[280px] shrink-0 flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-200",
                    isDropTarget && "ring-2 ring-primary/30"
                  )}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropOnCourt(courtNum)}
                >
                  <div className="h-1 bg-hero-gradient opacity-60" />
                  <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-foreground">
                        Court {String(courtNum).padStart(2, "0")}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-display font-bold",
                          courtMatches.length > 0 && "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {courtMatches.length}
                      </Badge>
                    </div>
                    {courtMatches.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedCount > 0 && `${completedCount} completed`}
                        {completedCount > 0 && liveCount > 0 && ", "}
                        {liveCount > 0 && `${liveCount} live`}
                        {completedCount === 0 && liveCount === 0 && `${courtMatches.length} pending`}
                      </p>
                    )}
                    {courtMatches.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Empty</p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] transition-colors duration-200",
                      isDropTarget && "bg-primary/5"
                    )}
                  >
                    {courtMatches.length === 0 && !isDropTarget ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                          <Tray className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p className="font-display font-bold text-sm text-muted-foreground mb-1">No matches yet</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                          Click a match in the pool, or drag one here
                        </p>
                      </div>
                    ) : (
                      <>
                        {courtMatches.map((match, idx) => (
                          <MatchCard
                            key={match._id}
                            match={match}
                            variant="court"
                            courtMatchList={courtMatches}
                            matchIndex={idx}
                          />
                        ))}
                        {/* Drop zone */}
                        <div
                          className={cn(
                            "w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-6 px-4 transition-all duration-200",
                            isDropTarget
                              ? "border-primary/40 bg-primary/10"
                              : "border-border/50 hover:border-primary/30 hover:bg-primary/5 group"
                          )}
                        >
                          <Plus className={cn(
                            "w-5 h-5 mb-1 transition-colors",
                            isDropTarget ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          )} />
                          <span className={cn(
                            "text-xs font-medium transition-colors",
                            isDropTarget ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          )}>
                            {isDropTarget ? "Drop here" : "Add match"}
                          </span>
                        </div>
                      </>
                    )}
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
      </div>

      {/* ── Remove Match Confirmation ── */}
      <AlertDialog open={!!matchToRemove} onOpenChange={(open) => { if (!open) setMatchToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the match back to the Match Pool. It can be reassigned later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => matchToRemove && handleRemoveFromSchedule(matchToRemove)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Auto-Schedule Confirmation ── */}
      <AlertDialog open={showAutoScheduleDialog} onOpenChange={setShowAutoScheduleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Schedule Matches</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Automatically assign all unscheduled matches to available courts using a balanced distribution.</p>
                <div className="glass-card rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unscheduled matches</span>
                    <span className="font-display font-bold">{unscheduledMatches.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available courts</span>
                    <span className="font-display font-bold">{allCourtNumbers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Already scheduled</span>
                    <span className="font-display font-bold">{scheduledMatches.length}</span>
                  </div>
                </div>
                {scheduledMatches.length > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <Warning className="w-3.5 h-3.5 shrink-0" />
                    Existing assignments will be preserved.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isAutoScheduling}
              onClick={async (e) => {
                e.preventDefault();
                setIsAutoScheduling(true);
                try {
                  await courtAPI.autoSchedule(tournamentId!, "balanced");
                  queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
                  queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
                  queryClient.invalidateQueries({ queryKey: ["schedule-grid", tournamentId] });
                  await queryClient.refetchQueries({ queryKey: ["tournament-matches", tournamentId] });
                  if (tournamentStartDate) {
                    setSelectedDate(startOfDay(new Date(tournamentStartDate)));
                  }
                  toast.success("Schedule generated successfully");
                  setShowAutoScheduleDialog(false);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Auto-schedule failed");
                } finally {
                  setIsAutoScheduling(false);
                }
              }}
            >
              {isAutoScheduling ? (
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lightning className="w-4 h-4 mr-2" />
              )}
              {isAutoScheduling ? "Scheduling..." : "Auto-Schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Clear Schedule Confirmation ── */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Entire Schedule</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This will remove all court assignments and move every match back to the pool.</p>
                <div className="glass-card rounded-xl p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Matches to unschedule</span>
                    <span className="font-display font-bold text-destructive">{scheduledMatches.length}</span>
                  </div>
                </div>
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <Warning className="w-3.5 h-3.5 shrink-0" />
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                setIsClearing(true);
                try {
                  await courtAPI.clearSchedule(tournamentId!);
                  queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
                  queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
                  toast.success("Schedule cleared");
                  setShowClearDialog(false);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to clear schedule");
                } finally {
                  setIsClearing(false);
                }
              }}
            >
              {isClearing ? (
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash className="w-4 h-4 mr-2" />
              )}
              {isClearing ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MatchSchedule;
