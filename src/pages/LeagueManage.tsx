import { useState, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { leagueAPI } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MATCH_FORMAT_LABELS, MATCH_FORMAT_CONFIGS, getMaxScore, type MatchFormatLabel } from "@/constants/matchFormat";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  Trophy,
  CalendarBlank,
  Gear,
  Plus,
  FloppyDisk,
  Trash,
  Check,
  SquaresFour,
  ListNumbers,
  CheckCircle,
  ShareNetwork,
  Calendar,
  Flask,
  CircleNotch,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type LeagueSection = "overview" | "players" | "sessions" | "standings" | "settings" | "test";

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILL_LEVELS = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

const SESSION_STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary border border-primary/30",
  completed:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
};

const leagueStatusConfig: Record<string, { label: string; className: string; dotClass: string }> = {
  draft: {
    label: "Draft",
    className: "bg-card text-muted-foreground border-border/80 border-2",
    dotClass: "bg-muted-foreground",
  },
  open: {
    label: "Registration Open",
    className: "bg-primary text-primary-foreground border-transparent",
    dotClass: "bg-background animate-[blink_2s_ease-in-out_infinite]",
  },
  active: {
    label: "Active",
    className: "bg-destructive text-destructive-foreground border-transparent",
    dotClass: "bg-white animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-foreground text-background border-transparent",
    dotClass: "bg-background",
  },
};

const sidebarCategories = [
  {
    title: "1. Management",
    items: [
      { id: "overview" as LeagueSection, label: "Overview", icon: SquaresFour },
      { id: "players" as LeagueSection, label: "Players", icon: Users },
      { id: "sessions" as LeagueSection, label: "Sessions", icon: CalendarBlank },
    ],
  },
  {
    title: "2. Performance",
    items: [
      { id: "standings" as LeagueSection, label: "Standings", icon: ListNumbers },
    ],
  },
  {
    title: "3. Configuration",
    items: [
      { id: "settings" as LeagueSection, label: "Settings", icon: Gear },
    ],
  },
  {
    title: "4. Testing",
    items: [
      { id: "test" as LeagueSection, label: "Test Data", icon: Flask },
    ],
  },
];

const flatSidebarItems = sidebarCategories.flatMap((c) => c.items);

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function LeagueSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: LeagueSection;
  onSectionChange: (s: LeagueSection) => void;
}) {
  return (
    <nav className="bg-card border-none sm:border-r-2 sm:border-border sm:shadow-none shadow-sm sm:w-64 hidden lg:block p-3 space-y-4">
      {sidebarCategories.map((category) => (
        <div key={category.title} className="space-y-1">
          <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 font-display">
            {category.title}
          </h4>
          {category.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border-l-4",
                  isActive
                    ? "border-primary bg-primary/10 text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────
function MobileLeagueNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: LeagueSection;
  onSectionChange: (s: LeagueSection) => void;
}) {
  return (
    <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 border-b-2 border-border/50 mb-6 bg-card sticky top-14 z-20">
      <div className="flex gap-4 min-w-max px-2">
        {flatSidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-2 py-4 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-4",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
              <span className="font-display tracking-widest uppercase">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function LeagueTopBar({
  league,
  onActivate,
  onComplete,
  onDelete,
}: {
  league: any;
  onActivate: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const [confirmComplete, setConfirmComplete] = useState(false);
  const statusInfo =
    leagueStatusConfig[league.status as keyof typeof leagueStatusConfig] ||
    leagueStatusConfig.draft;

  return (
    <div className="flex flex-col gap-4 mb-6 animate-fade-in">
      {/* Name + status + date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6 min-w-0 bg-card p-6 rounded-xl border-2 border-border shadow-sm">
        <Link
          to={`/leagues/${league._id}`}
          className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border/80 self-start"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <h1 className="font-display font-black text-3xl sm:text-4xl truncate uppercase tracking-tight text-foreground">
              {league.name}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "font-bold text-xs uppercase tracking-widest px-2 py-0.5",
                statusInfo.className
              )}
            >
              <span className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotClass)} />
              {statusInfo.label}
            </Badge>
          </div>
          {(league.startDate || league.endDate) && (
            <div className="flex items-center gap-2 text-sm text-primary font-bold tracking-widest uppercase mt-3">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {league.startDate
                  ? format(new Date(league.startDate), "MMM dd, yyyy")
                  : "TBD"}{" "}
                –{" "}
                {league.endDate
                  ? format(new Date(league.endDate), "MMM dd, yyyy")
                  : "TBD"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {(league.status === "draft" || league.status === "open") && (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 font-display font-bold text-base tracking-wide uppercase shrink-0 rounded-xl shadow-sm"
            onClick={onActivate}
          >
            <Trophy className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Activate League</span>
          </Button>
        )}

        {league.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            className="h-12 px-6 font-display font-bold text-base tracking-wide uppercase shrink-0 rounded-xl shadow-sm border-destructive/40 text-destructive hover:bg-destructive hover:text-white transition-colors"
            onClick={() => setConfirmComplete(true)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">End League</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-colors shrink-0"
        >
          <ShareNetwork className="w-5 h-5 text-muted-foreground" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-muted-foreground transition-colors shrink-0"
          onClick={onDelete}
        >
          <Trash className="w-5 h-5" />
        </Button>
      </div>

      {/* End League confirmation dialog */}
      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent className="glass-card border border-border/50 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-lg uppercase tracking-tight text-destructive">
              End League?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently close the league. All sessions, scores, and standings will be locked — no edits, no new sessions, no score entry, nothing. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmComplete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="font-display font-bold uppercase tracking-wide"
              onClick={() => {
                onComplete();
                setConfirmComplete(false);
              }}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Yes, End League
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Overview section ─────────────────────────────────────────────────────────
function OverviewSection({ league }: { league: any }) {
  const totalSessions = league.sessions?.length ?? 0;
  const completedSessions = league.sessions?.filter((s: any) => s.status === "completed").length ?? 0;
  const totalPlayers = league.players?.length ?? 0;
  const maxPlayers = league.maxPlayers ?? 32;
  const topPlayer = league.standings?.[0];

  const stats = [
    {
      label: "Players",
      value: `${totalPlayers} / ${maxPlayers}`,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Sessions",
      value: `${completedSessions} / ${totalSessions}`,
      icon: CalendarBlank,
      color: "text-emerald-500",
    },
    {
      label: "League Type",
      value: league.leagueType?.replace("-", " ") ?? "—",
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Skill Range",
      value:
        league.skillLevel?.min && league.skillLevel?.max
          ? `${league.skillLevel.min} – ${league.skillLevel.max}`
          : "All levels",
      icon: ListNumbers,
      color: "text-violet-500",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-2xl flex items-center gap-2">
          <SquaresFour className="w-6 h-6 text-primary" />
          Overview
        </h2>
        <p className="text-muted-foreground mt-1">
          At-a-glance summary of your league.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="glass-card rounded-2xl border border-border/50 p-5 flex flex-col gap-2"
            >
              <Icon className={cn("w-5 h-5", s.color)} />
              <p className="text-2xl font-display font-black text-foreground capitalize">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-display font-bold">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {topPlayer && (
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Current Leader
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-hero-gradient flex items-center justify-center shrink-0">
              <span className="text-lg font-display font-black text-white">
                {topPlayer.player?.name?.charAt(0)?.toUpperCase() ?? "#"}
              </span>
            </div>
            <div>
              <p className="font-display font-black text-xl uppercase">
                {topPlayer.player?.name ?? "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {topPlayer.wins ?? 0}W – {topPlayer.losses ?? 0}L &nbsp;·&nbsp;{" "}
                {topPlayer.points ?? 0} pts
              </p>
            </div>
          </div>
        </div>
      )}

      {league.description && (
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Description
          </p>
          <p className="text-sm text-foreground leading-relaxed">{league.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Players section ───────────────────────────────────────────────────────────
function PlayersSection({
  league,
  onRemovePlayer,
  removing,
}: {
  league: any;
  onRemovePlayer: (playerId: string) => void;
  removing: boolean;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Players
          </h2>
          <p className="text-muted-foreground mt-1">
            {league.players?.length ?? 0} of {league.maxPlayers ?? 32} registered
          </p>
        </div>
      </div>

      {!league.players || league.players.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border/50 text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display font-bold uppercase tracking-wide text-sm">No players yet</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Player", "Email", "Skill", "Joined", "Payment", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground text-left last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {league.players.map((entry: any, i: number) => {
                  const p = entry.player;
                  const pid = p?._id ?? p;
                  return (
                    <tr
                      key={entry._id ?? i}
                      className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0">
                            <span className="text-xs font-display font-black text-white">
                              {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{p?.name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{p?.skillLevel ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {entry.joinedAt ? format(new Date(entry.joinedAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                            entry.paymentStatus === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {entry.paymentStatus ?? "unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removing}
                          onClick={() => onRemovePlayer(pid?.toString())}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standings section ─────────────────────────────────────────────────────────
function StandingsSection({ league }: { league: any }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-2xl flex items-center gap-2">
          <ListNumbers className="w-6 h-6 text-primary" />
          Standings
        </h2>
        <p className="text-muted-foreground mt-1">
          Auto-calculated from match scores.
        </p>
      </div>

      {!league.players || league.players.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border/50 text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display font-bold uppercase tracking-wide text-sm">No players to rank</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Rank", "Player", "W", "L", "GP", "Points"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {league.players.map((entry: any, i: number) => {
                  const p = entry.player;
                  const pid = (p?._id ?? p)?.toString();
                  const standing = league.standings?.find(
                    (s: any) => (s.player?._id ?? s.player)?.toString() === pid
                  );
                  return (
                    <tr
                      key={entry._id ?? i}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="px-4 py-3 font-display font-black text-sm text-muted-foreground">
                        #{standing?.rank ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0">
                            <span className="text-xs font-display font-black text-white">
                              {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{p?.name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-600">{standing?.wins ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{standing?.losses ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{standing?.gamesPlayed ?? 0}</td>
                      <td className="px-4 py-3 text-sm font-bold text-primary">{standing?.points ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sessions section ──────────────────────────────────────────────────────────
function SessionsSection({
  league,
  sessionMatches,
  expandedSession,
  scoreInputs,
  savingScore,
  generatingMatches,
  sessionFormats,
  onToggleSession,
  onGenerateMatches,
  onEnterScore,
  setScoreInputs,
  onSetSessionFormat,
  onUpdateSession,
  onAddSession,
  sessionDialogOpen,
  setSessionDialogOpen,
  sessionDate,
  setSessionDate,
  sessionNotes,
  setSessionNotes,
  addingSession,
}: {
  league: any;
  sessionMatches: Record<string, any[]>;
  expandedSession: string | null;
  scoreInputs: Record<string, { score1: string; score2: string }>;
  savingScore: string | null;
  generatingMatches: string | null;
  sessionFormats: Record<string, MatchFormatLabel>;
  onToggleSession: (sid: string) => void;
  onGenerateMatches: (sid: string) => void;
  onEnterScore: (matchId: string, sessionId: string) => void;
  setScoreInputs: React.Dispatch<React.SetStateAction<Record<string, { score1: string; score2: string }>>>;
  onSetSessionFormat: (sid: string, fmt: MatchFormatLabel) => void;
  onUpdateSession: (sessionId: string, status: string) => void;
  onAddSession: () => void;
  sessionDialogOpen: boolean;
  setSessionDialogOpen: (v: boolean) => void;
  sessionDate: string;
  setSessionDate: (v: string) => void;
  sessionNotes: string;
  setSessionNotes: (v: string) => void;
  addingSession: boolean;
}) {
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <CalendarBlank className="w-6 h-6 text-primary" />
            Sessions
          </h2>
          <p className="text-muted-foreground mt-1">
            {league.sessions?.length ?? 0} total sessions
          </p>
        </div>
        {league.status !== "completed" && (
          <Button
            onClick={() => setSessionDialogOpen(true)}
            className="font-display font-bold uppercase tracking-wide text-xs gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </Button>
        )}
      </div>

      {league.status === "completed" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <XCircle className="w-5 h-5 shrink-0" />
          This league has ended. All sessions and scores are locked.
        </div>
      )}

      {!league.sessions || league.sessions.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border/50 text-center py-16 text-muted-foreground">
          <CalendarBlank className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display font-bold uppercase tracking-wide text-sm">No sessions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {league.sessions.map((session: any, i: number) => {
            const sid = session._id;
            const isExpanded = expandedSession === sid;
            const matches: any[] = sessionMatches[sid] || [];
            const completedCount = matches.filter((m) => m.status === "completed").length;
            return (
              <div key={sid ?? i} className="glass-card rounded-xl border border-border/50 overflow-hidden">
                <div
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => onToggleSession(sid)}
                >
                  <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm">
                    <span className="font-display font-black text-sm text-white">
                      {session.sessionNumber ?? i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
                        Session {session.sessionNumber ?? i + 1}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                          SESSION_STATUS_COLORS[session.status] ?? SESSION_STATUS_COLORS.upcoming
                        )}
                      >
                        {session.status}
                      </span>
                      {matches.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {completedCount}/{matches.length} matches done
                        </span>
                      )}
                    </div>
                    {session.date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(session.date), "EEEE, MMM d, yyyy")}
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {league.status !== "completed" && session.status === "upcoming" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateSession(sid, "active")}
                        className="h-8 text-xs font-display font-bold uppercase tracking-wide border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        Mark Active
                      </Button>
                    )}
                    {league.status !== "completed" && session.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmCompleteId(sid)}
                        className="h-8 text-xs font-display font-bold uppercase tracking-wide border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/40 p-4 space-y-4">
                    {/* Format selector + generate button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                          Match Format
                        </p>
                        <Select
                          value={sessionFormats[sid] ?? "Game to 11 – Win by 1"}
                          onValueChange={(v) => onSetSessionFormat(sid, v as MatchFormatLabel)}
                          disabled={league.status === "completed" || session.status === "completed"}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-xl w-full sm:w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MATCH_FORMAT_LABELS.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2 shrink-0 self-end">
                        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5 hidden sm:block">
                          Matches {matches.length > 0 ? `(${matches.length})` : ""}
                        </p>
                        {league.status !== "completed" && session.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGenerateMatches(sid)}
                            disabled={generatingMatches === sid}
                            className="h-8 text-xs font-display font-bold uppercase tracking-wide"
                          >
                            {generatingMatches === sid
                              ? "Generating..."
                              : matches.length > 0
                              ? "Regenerate"
                              : "Generate Matches"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {matches.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No matches yet. Click "Generate Matches" to create the round-robin schedule.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {/* Format info badge */}
                        {(() => {
                          const fmt = sessionFormats[sid] ?? "Game to 11 – Win by 1";
                          const cfg = MATCH_FORMAT_CONFIGS[fmt as MatchFormatLabel];
                          return cfg ? (
                            <p className="text-[10px] text-primary font-display font-bold uppercase tracking-widest">
                              {cfg.games_to_win > 1
                                ? `Best ${cfg.games_to_win * 2 - 1} of ${cfg.max_games} · First to ${cfg.points_to_win}, win by ${cfg.win_by}`
                                : `First to ${cfg.points_to_win}, win by ${cfg.win_by}${cfg.hard_cap ? ` (cap ${cfg.hard_cap})` : ""}`}
                            </p>
                          ) : null;
                        })()}
                        {(() => {
                          const fmt = sessionFormats[sid] ?? "Game to 11 – Win by 1";
                          const cfg = MATCH_FORMAT_CONFIGS[fmt as MatchFormatLabel];
                          const maxScore = getMaxScore(cfg);
                          return Array.from(new Set(matches.map((m) => m.round)))
                            .sort((a, b) => a - b)
                            .map((round) => (
                            <div key={round}>
                              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                Round {round}
                              </p>
                              <div className="space-y-1.5">
                                {matches
                                  .filter((m) => m.round === round)
                                  .map((match: any) => {
                                    const mid = match._id;
                                    const inputs = scoreInputs[mid] ?? {
                                      score1: match.score1 ?? "",
                                      score2: match.score2 ?? "",
                                    };
                                    const isDone = match.status === "completed";
                                    return (
                                      <div
                                        key={mid}
                                        className={cn(
                                          "flex items-center gap-3 p-3 rounded-xl text-sm",
                                          isDone
                                            ? "bg-emerald-500/5 border border-emerald-500/20"
                                            : "bg-muted/30 border border-border/40"
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "font-medium flex-1 text-right text-xs",
                                            match.winner?._id === match.player1?._id &&
                                              "font-bold text-primary"
                                          )}
                                        >
                                          {match.player1?.name ?? "Player"}
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Input
                                            type="number"
                                            min={0}
                                            max={maxScore}
                                            value={inputs.score1}
                                            onChange={(e) => {
                                              const val = Math.min(parseInt(e.target.value) || 0, maxScore);
                                              setScoreInputs((prev) => ({
                                                ...prev,
                                                [mid]: { ...inputs, score1: String(val) },
                                              }));
                                            }}
                                            className="input-no-spinner w-16 h-10 text-center text-base font-bold rounded-lg"
                                            disabled={isDone || league.status === "completed"}
                                          />
                                          <span className="text-muted-foreground font-bold text-xs">
                                            vs
                                          </span>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={maxScore}
                                            value={inputs.score2}
                                            onChange={(e) => {
                                              const val = Math.min(parseInt(e.target.value) || 0, maxScore);
                                              setScoreInputs((prev) => ({
                                                ...prev,
                                                [mid]: { ...inputs, score2: String(val) },
                                              }));
                                            }}
                                            className="input-no-spinner w-16 h-10 text-center text-base font-bold rounded-lg"
                                            disabled={isDone || league.status === "completed"}
                                          />
                                        </div>
                                        <span
                                          className={cn(
                                            "font-medium flex-1 text-xs",
                                            match.winner?._id === match.player2?._id &&
                                              "font-bold text-primary"
                                          )}
                                        >
                                          {match.player2?.name ?? "Player"}
                                        </span>
                                        {isDone ? (
                                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : league.status === "completed" ? (
                                          <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEnterScore(mid, sid)}
                                            disabled={savingScore === mid}
                                            className="h-7 px-2 text-xs font-display font-bold uppercase tracking-wide shrink-0"
                                          >
                                            {savingScore === mid ? "..." : "Save"}
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="glass-card border border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-lg uppercase tracking-tight">
              Add Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                Date
              </Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                Notes
              </Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Optional notes for this session..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSessionDialogOpen(false)}
              className="font-display font-bold uppercase tracking-wide text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={onAddSession}
              disabled={addingSession || !sessionDate}
              className="font-display font-bold uppercase tracking-wide text-xs rounded-xl"
            >
              {addingSession ? "Adding..." : "Add Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete session confirmation dialog */}
      <Dialog open={!!confirmCompleteId} onOpenChange={(open) => { if (!open) setConfirmCompleteId(null); }}>
        <DialogContent className="glass-card border border-border/50 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-lg uppercase tracking-tight">
              Complete Session?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will lock the session. Scores can't be edited and matches can't be regenerated afterward.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmCompleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold uppercase tracking-wide"
              onClick={() => {
                if (confirmCompleteId) {
                  onUpdateSession(confirmCompleteId, "completed");
                  setConfirmCompleteId(null);
                }
              }}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Yes, Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Settings section ──────────────────────────────────────────────────────────
function SettingsSection({
  settingsForm,
  setSettingsForm,
  onSave,
  saving,
}: {
  settingsForm: any;
  setSettingsForm: (fn: (f: any) => any) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Gear className="w-6 h-6 text-primary" />
            Settings
          </h2>
          <p className="text-muted-foreground mt-1">Update league configuration.</p>
        </div>
        <Button
          onClick={onSave}
          disabled={saving}
          className="font-display font-bold uppercase tracking-wide text-xs gap-2"
        >
          <FloppyDisk className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              League Name
            </Label>
            <Input
              value={settingsForm.name}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Description
            </Label>
            <Textarea
              value={settingsForm.description}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Location
            </Label>
            <Input
              value={settingsForm.location}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, location: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Address
            </Label>
            <Input
              value={settingsForm.address}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, address: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Start Date
            </Label>
            <Input
              type="date"
              value={settingsForm.startDate}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, startDate: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              End Date
            </Label>
            <Input
              type="date"
              value={settingsForm.endDate}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, endDate: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Registration Deadline
            </Label>
            <Input
              type="date"
              value={settingsForm.registrationDeadline}
              onChange={(e) =>
                setSettingsForm((f: any) => ({ ...f, registrationDeadline: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Max Players
            </Label>
            <Input
              type="number"
              min={4}
              value={settingsForm.maxPlayers}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, maxPlayers: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Entry Fee ($)
            </Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={settingsForm.entryFee}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, entryFee: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Contact Email
            </Label>
            <Input
              type="email"
              value={settingsForm.contactEmail}
              onChange={(e) =>
                setSettingsForm((f: any) => ({ ...f, contactEmail: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Contact Phone
            </Label>
            <Input
              value={settingsForm.contactPhone}
              onChange={(e) =>
                setSettingsForm((f: any) => ({ ...f, contactPhone: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Skill Level Min
            </Label>
            <select
              value={settingsForm.skillLevelMin}
              onChange={(e) =>
                setSettingsForm((f: any) => ({ ...f, skillLevelMin: Number(e.target.value) }))
              }
              className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Skill Level Max
            </Label>
            <select
              value={settingsForm.skillLevelMax}
              onChange={(e) =>
                setSettingsForm((f: any) => ({ ...f, skillLevelMax: Number(e.target.value) }))
              }
              className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
              Status
            </Label>
            <select
              value={settingsForm.status}
              onChange={(e) => setSettingsForm((f: any) => ({ ...f, status: e.target.value }))}
              className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {["draft", "open", "active", "completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40">
          <div>
            <p className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
              Allow Waitlist
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Players can join a waitlist when the league is full
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSettingsForm((f: any) => ({ ...f, allowWaitlist: !f.allowWaitlist }))
            }
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
              settingsForm.allowWaitlist ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                settingsForm.allowWaitlist ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div>
          <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
            Rules
          </Label>
          <Textarea
            value={settingsForm.rules}
            onChange={(e) => setSettingsForm((f: any) => ({ ...f, rules: e.target.value }))}
            rows={4}
            className="rounded-xl resize-none"
            placeholder="League rules..."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Test Data section ────────────────────────────────────────────────────────
function LeagueTestDataPanel({ leagueId, onRefresh }: { leagueId: string; onRefresh: () => void }) {
  const [count, setCount] = useState("8");

  const generateMutation = useMutation({
    mutationFn: () => leagueAPI.generateTestData(leagueId, parseInt(count, 10)),
    onSuccess: (data: any) => {
      sonnerToast.success(data.message || "Test data generated!");
      onRefresh();
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || "Failed to generate test data");
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => leagueAPI.clearTestData(leagueId),
    onSuccess: (data: any) => {
      sonnerToast.success(data.message || "Test data cleared!");
      onRefresh();
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || "Failed to clear test data");
    },
  });

  const canGenerate = parseInt(count, 10) >= 1 && parseInt(count, 10) <= 100 && !generateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-2xl flex items-center gap-2">
          <Flask className="w-6 h-6 text-primary" />
          Test Data
        </h2>
        <p className="text-muted-foreground mt-1">Generate fake players for testing.</p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
        <Warning className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold text-sm text-yellow-700">Testing Only</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Creates fake player accounts and adds them to this league. Use "Clear Test Data" to remove them when done.
          </p>
        </div>
      </div>

      {/* Generate */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Generate Test Players</h3>
            <p className="text-sm text-muted-foreground">Add fake players to this league for testing</p>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div className="space-y-2 w-40">
            <Label className="font-display font-semibold text-sm">Number of Players</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="8"
              className="rounded-xl"
            />
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={!canGenerate} className="gap-2">
            {generateMutation.isPending ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </div>
        {generateMutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {(generateMutation.data as any)?.message}
          </div>
        )}
      </div>

      {/* Clear */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Clear All Test Data</h3>
              <p className="text-sm text-muted-foreground">Remove all test players from this league</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {clearMutation.isPending ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash className="w-4 h-4" />
                Clear Test Data
              </>
            )}
          </Button>
        </div>
        {clearMutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {(clearMutation.data as any)?.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LeagueManage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = (searchParams.get("tab") as LeagueSection) || "overview";
  const setActiveSection = useCallback(
    (section: LeagueSection) => {
      setSearchParams({ tab: section }, { replace: true });
    },
    [setSearchParams]
  );

  // Session dialog
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  // Standings editing
  const [editedStandings, setEditedStandings] = useState<Record<string, any>>({});

  // Session matches
  const [sessionMatches, setSessionMatches] = useState<Record<string, any[]>>({});
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { score1: string; score2: string }>>(
    {}
  );
  const [savingScore, setSavingScore] = useState<string | null>(null);
  const [generatingMatches, setGeneratingMatches] = useState<string | null>(null);
  const [sessionFormats, setSessionFormats] = useState<Record<string, MatchFormatLabel>>({});

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leagueAPI.getById(id!),
    enabled: !!id,
  });

  const league = data?.data;

  const isOrganizer =
    league &&
    (league.organizer?._id?.toString() === user?._id?.toString() || user?.role === "admin");

  // Settings form
  const [settingsForm, setSettingsForm] = useState<any | null>(null);
  if (league && !settingsForm) {
    setSettingsForm({
      name: league.name ?? "",
      description: league.description ?? "",
      location: league.location ?? "",
      address: league.address ?? "",
      startDate: league.startDate ? league.startDate.substring(0, 10) : "",
      endDate: league.endDate ? league.endDate.substring(0, 10) : "",
      registrationDeadline: league.registrationDeadline
        ? league.registrationDeadline.substring(0, 10)
        : "",
      maxPlayers: league.maxPlayers ?? 32,
      entryFee: league.entryFee ?? 0,
      contactEmail: league.contactEmail ?? "",
      contactPhone: league.contactPhone ?? "",
      rules: league.rules ?? "",
      skillLevelMin: league.skillLevel?.min ?? 2.5,
      skillLevelMax: league.skillLevel?.max ?? 5.0,
      allowWaitlist: league.settings?.allowWaitlist ?? false,
      status: league.status ?? "open",
    });
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const removePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const currentPlayers = league.players.filter(
        (p: any) => (p.player?._id ?? p.player).toString() !== playerId
      );
      return leagueAPI.update(id!, {
        players: currentPlayers.map((p: any) => ({
          player: p.player?._id ?? p.player,
          joinedAt: p.joinedAt,
          paymentStatus: p.paymentStatus,
        })),
      });
    },
    onSuccess: () => {
      toast({ title: "Player removed" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to remove player.",
        variant: "destructive",
      });
    },
  });

  const saveStandingsMutation = useMutation({
    mutationFn: () => {
      const standings = (league?.players ?? []).map((entry: any) => {
        const pid = entry.player?._id ?? entry.player;
        const edited = editedStandings[pid] ?? {};
        return {
          playerId: pid,
          wins: Number(edited.wins ?? 0),
          losses: Number(edited.losses ?? 0),
          points: Number(edited.points ?? 0),
          gamesPlayed: Number(edited.gamesPlayed ?? 0),
          rank: 0,
        };
      });
      standings.sort((a: any, b: any) => b.points - a.points);
      standings.forEach((s: any, i: number) => {
        s.rank = i + 1;
      });
      return leagueAPI.updateStandings(id!, standings);
    },
    onSuccess: () => {
      toast({ title: "Standings saved!" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to save standings.",
        variant: "destructive",
      });
    },
  });

  const addSessionMutation = useMutation({
    mutationFn: () => leagueAPI.addSession(id!, { date: sessionDate, notes: sessionNotes }),
    onSuccess: () => {
      toast({ title: "Session added!" });
      setSessionDialogOpen(false);
      setSessionDate("");
      setSessionNotes("");
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to add session.",
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      leagueAPI.updateSession(id!, sessionId, { status }),
    onSuccess: () => {
      toast({ title: "Session updated" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to update session.",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      leagueAPI.update(id!, {
        ...settingsForm,
        maxPlayers: Number(settingsForm.maxPlayers),
        entryFee: Number(settingsForm.entryFee),
        skillLevel: {
          min: Number(settingsForm.skillLevelMin),
          max: Number(settingsForm.skillLevelMax),
        },
        settings: {
          allowWaitlist: settingsForm.allowWaitlist,
          isPublic: true,
        },
      }),
    onSuccess: () => {
      toast({ title: "Settings saved!" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => leagueAPI.update(id!, { status: "active" }),
    onSuccess: () => {
      toast({ title: "League activated!" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to activate league.",
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => leagueAPI.update(id!, { status: "completed" }),
    onSuccess: () => {
      toast({ title: "League completed!" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to complete league.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leagueAPI.delete(id!),
    onSuccess: () => {
      toast({ title: "League deleted" });
      navigate("/leagues");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to delete league.",
        variant: "destructive",
      });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const loadSessionMatches = async (sessionId: string) => {
    try {
      const res = await leagueAPI.getSessionMatches(id!, sessionId);
      setSessionMatches((prev) => ({ ...prev, [sessionId]: res.data }));
    } catch {
      toast({ title: "Error", description: "Failed to load matches", variant: "destructive" });
    }
  };

  const handleToggleSession = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      loadSessionMatches(sessionId);
    }
  };

  const handleGenerateMatches = async (sessionId: string) => {
    setGeneratingMatches(sessionId);
    try {
      await leagueAPI.generateMatches(id!, sessionId);
      toast({ title: "Matches generated!", description: "Round-robin schedule created." });
      await loadSessionMatches(sessionId);
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Failed to generate matches",
        variant: "destructive",
      });
    } finally {
      setGeneratingMatches(null);
    }
  };

  const handleEnterScore = async (matchId: string, sessionId: string) => {
    const inputs = scoreInputs[matchId];
    if (!inputs || inputs.score1 === "" || inputs.score2 === "") {
      toast({ title: "Enter both scores", variant: "destructive" });
      return;
    }

    const s1 = Number(inputs.score1);
    const s2 = Number(inputs.score2);
    const fmt = sessionFormats[sessionId] ?? "Game to 11 – Win by 1";
    const cfg = MATCH_FORMAT_CONFIGS[fmt as MatchFormatLabel];

    if (cfg) {
      const { points_to_win, win_by, hard_cap } = cfg;
      const high = Math.max(s1, s2);
      const diff = high - Math.min(s1, s2);
      const valid = hard_cap != null
        ? high >= hard_cap || (high >= points_to_win && diff >= win_by)
        : high >= points_to_win && diff >= win_by;

      if (!valid) {
        toast({
          title: "Invalid score",
          description: `${fmt}: first to ${points_to_win}, win by ${win_by}${hard_cap ? ` (cap ${hard_cap})` : ""}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSavingScore(matchId);
    try {
      await leagueAPI.enterScore(id!, matchId, s1, s2, fmt);
      toast({ title: "Score saved! Standings updated." });
      await loadSessionMatches(sessionId);
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Failed to save score",
        variant: "destructive",
      });
    } finally {
      setSavingScore(null);
    }
  };

  const getExistingStanding = (playerId: string) =>
    league?.standings?.find(
      (s: any) => (s.player?._id ?? s.player)?.toString() === playerId
    );

  const getStandingValue = (playerId: string, field: string) => {
    if (editedStandings[playerId]?.[field] !== undefined)
      return editedStandings[playerId][field];
    return getExistingStanding(playerId)?.[field] ?? 0;
  };

  const setStandingValue = (playerId: string, field: string, value: any) => {
    setEditedStandings((prev) => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), [field]: value },
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout variant="minimal">
        <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 rounded bg-muted/50 w-1/3" />
          <div className="h-40 rounded-2xl bg-muted/50" />
        </div>
      </Layout>
    );
  }

  if (!league || !isOrganizer) {
    return (
      <Layout variant="minimal">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-black text-2xl uppercase">Not authorized</h2>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/leagues">Back to Leagues</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection league={league} />;
      case "players":
        return (
          <PlayersSection
            league={league}
            onRemovePlayer={(pid) => removePlayerMutation.mutate(pid)}
            removing={removePlayerMutation.isPending}
          />
        );
      case "sessions":
        return (
          <SessionsSection
            league={league}
            sessionMatches={sessionMatches}
            expandedSession={expandedSession}
            scoreInputs={scoreInputs}
            savingScore={savingScore}
            generatingMatches={generatingMatches}
            sessionFormats={sessionFormats}
            onToggleSession={handleToggleSession}
            onGenerateMatches={handleGenerateMatches}
            onEnterScore={handleEnterScore}
            setScoreInputs={setScoreInputs}
            onSetSessionFormat={(sid, fmt) =>
              setSessionFormats((prev) => ({ ...prev, [sid]: fmt }))
            }
            onUpdateSession={(sessionId, status) =>
              updateSessionMutation.mutate({ sessionId, status })
            }
            onAddSession={() => addSessionMutation.mutate()}
            sessionDialogOpen={sessionDialogOpen}
            setSessionDialogOpen={setSessionDialogOpen}
            sessionDate={sessionDate}
            setSessionDate={setSessionDate}
            sessionNotes={sessionNotes}
            setSessionNotes={setSessionNotes}
            addingSession={addSessionMutation.isPending}
          />
        );
      case "standings":
        return <StandingsSection league={league} />;
      case "settings":
        return settingsForm ? (
          <SettingsSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={() => saveSettingsMutation.mutate()}
            saving={saveSettingsMutation.isPending}
          />
        ) : null;
      case "test":
        return (
          <LeagueTestDataPanel
            leagueId={id!}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["league", id] })}
          />
        );
      default:
        return <OverviewSection league={league} />;
    }
  };

  return (
    <Layout variant="minimal">
      <div className="min-h-screen bg-background">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <LeagueTopBar
            league={league}
            onActivate={() => activateMutation.mutate()}
            onComplete={() => completeMutation.mutate()}
            onDelete={() => setDeleteDialogOpen(true)}
          />

          <MobileLeagueNav activeSection={activeSection} onSectionChange={setActiveSection} />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <LeagueSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            <main className="flex-1 min-w-0 font-sans">{renderSection()}</main>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-card border border-border/50 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-lg uppercase tracking-tight text-destructive">
              Delete League
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{league.name}</strong>? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="font-display font-bold uppercase tracking-wide text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="font-display font-bold uppercase tracking-wide text-xs rounded-xl"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete League"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
