import { useState, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const LEAGUE_TYPES = [
  { value: "ladder", label: "Ladder", description: "Players/Teams move up and down rankings each week based on stats. Each week players/teams are divided into groups based on their ranking." },
  { value: "traditional", label: "Traditional League", description: "Teams (players if singles) are scheduled to play every other team in the league at least once during the session." },
  { value: "king-of-court", label: "King of the Court", description: "Players are initially ranked by their rating and moved up/down courts after each game based on win/loss." },
  { value: "dupr-session", label: "DUPR Session", description: "Run a King of the Court rating session and send results to DUPR." },
];

const PLAYER_TYPES = [
  { value: "scramble", label: "Scramble", description: "Players sign up individually. Each week players are put into groups and partner with each of the other players in their group." },
  { value: "partner", label: "Partner", description: "Players sign up with a partner and stay together for all matches throughout the session." },
];

const PLAYER_GROUPS = [
  { value: "mens", label: "Mens", description: "Men Only" },
  { value: "womens", label: "Womens", description: "Women Only" },
  { value: "mixed", label: "Mixed", description: "One Male Only & One Female Only" },
  { value: "coed", label: "Coed", description: "Any Combination of Gender Can Play. NOTE: Players will enter into this bracket with their Doubles Skill" },
];

const RANKING_TYPES = [
  { value: "pop", label: "Percentage of Points (POP)", description: "% of points earned vs possible. Tie-breaker: match wins, then previous week's rank. Most fair for recreational leagues." },
  { value: "dupr", label: "DUPR Rating", description: "DUPR's official global rating system determines rankings after each game day. Best for competitive leagues." },
  { value: "up-down", label: "Up / Down", description: "After each game day, top players move up to a higher group and bottom players move down. Creates exciting movement." },
  { value: "custom", label: "Custom", description: "Set your own point values for winning, losing, and playing. Full control over scoring." },
];

const SIGNUP_TYPES = [
  { value: "open", label: "Each Game Day (Open League)", description: "Players sign up each week they want to play. Great for casual leagues where attendance varies." },
  { value: "closed", label: "At Session Signup (Closed League)", description: "Players commit and pay for the whole season upfront. Better for competitive, structured leagues." },
];

const PLAYER_PLACEMENT = [
  { value: "bottom", label: "At Bottom", description: "New players join at the lowest group and work their way up. Fair and standard." },
  { value: "rating", label: "At Rating", description: "New players start at the position matching their skill rating." },
];

const fieldLabel = "font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-1.5 block";
const selectNativeCls = "w-full h-10 rounded-[6px] border border-pb-hairline bg-pb-surface font-mono text-[13px] px-3 text-pb-ink focus:outline-none focus:ring-1 focus:ring-pb-court";

function RadioCard({ selected, onClick, label, description, disabled }: { selected: boolean; onClick: () => void; label: string; description: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 rounded-[6px] border transition-all duration-150 focus:outline-none",
        selected ? "border-pb-ink bg-pb-surface2" : "border-pb-hairline bg-pb-surface hover:border-pb-rule",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors", selected ? "border-pb-ink bg-pb-ink" : "border-pb-hairline")}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <p className="font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-pb-ink">{label}</p>
          <p className="font-mono text-[12px] text-pb-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

const SESSION_STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
  active: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
};

const leagueStatusConfig: Record<string, { label: string; pillClass: string; dotClass: string }> = {
  draft: {
    label: "Draft",
    pillClass: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
    dotClass: "bg-pb-muted",
  },
  open: {
    label: "Registration Open",
    pillClass: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
    dotClass: "bg-emerald-500 animate-pulse",
  },
  active: {
    label: "Active",
    pillClass: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
    dotClass: "bg-blue-500 animate-pulse",
  },
  completed: {
    label: "Completed",
    pillClass: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
    dotClass: "bg-pb-muted",
  },
};

const sidebarCategories = [
  {
    title: "Management",
    items: [
      { id: "overview" as LeagueSection, label: "Overview", icon: SquaresFour },
      { id: "players" as LeagueSection, label: "Players", icon: Users },
      { id: "sessions" as LeagueSection, label: "Sessions", icon: CalendarBlank },
    ],
  },
  {
    title: "Performance",
    items: [
      { id: "standings" as LeagueSection, label: "Standings", icon: ListNumbers },
    ],
  },
  {
    title: "Configuration",
    items: [
      { id: "settings" as LeagueSection, label: "Settings", icon: Gear },
    ],
  },
  {
    title: "Testing",
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
    <nav className="hidden lg:block w-56 shrink-0">
      <div className="space-y-5">
        {sidebarCategories.map((category) => (
          <div key={category.title}>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-pb-muted mb-1.5 px-3">
              {category.title}
            </p>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] font-mono text-[13px] transition-colors",
                      isActive
                        ? "bg-pb-surface2 text-pb-ink font-medium"
                        : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2/50"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
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
    <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 border-b border-pb-hairline mb-6 bg-pb-paper sticky top-14 z-20">
      <div className="flex gap-0 min-w-max">
        {flatSidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3.5 font-mono text-[12px] uppercase tracking-[0.06em] whitespace-nowrap transition-all border-b-2",
                isActive
                  ? "border-pb-ink text-pb-ink"
                  : "border-transparent text-pb-muted hover:text-pb-ink"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
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
    <div className="mb-6">
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-5 min-w-0">
          <Link
            to={`/leagues/${league._id}`}
            className="shrink-0 w-10 h-10 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center text-pb-muted hover:text-pb-ink hover:bg-pb-surface transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap mb-2">
              <h1 className="font-display font-extrabold text-[28px] sm:text-[32px] tracking-[-0.03em] text-pb-ink truncate">
                {league.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-[4px]",
                  statusInfo.pillClass
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotClass)} />
                {statusInfo.label}
              </span>
            </div>
            {(league.startDate || league.endDate) && (
              <div className="flex items-center gap-1.5 font-mono text-[12px] text-pb-muted">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {league.startDate ? format(new Date(league.startDate), "MMM dd, yyyy") : "TBD"}{" "}
                  –{" "}
                  {league.endDate ? format(new Date(league.endDate), "MMM dd, yyyy") : "TBD"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-pb-hairline overflow-x-auto scrollbar-hide">
          {(league.status === "draft" || league.status === "open") && (
            <button
              onClick={onActivate}
              className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 shrink-0 hover:opacity-90 transition-opacity"
            >
              <Trophy className="w-4 h-4" />
              Activate League
            </button>
          )}

          {league.status === "active" && (
            <button
              onClick={() => setConfirmComplete(true)}
              className="inline-flex items-center gap-2 border border-red-300 text-red-600 rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 shrink-0 hover:bg-red-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              End League
            </button>
          )}

          <button className="w-9 h-9 rounded-[6px] border border-pb-hairline bg-pb-surface flex items-center justify-center text-pb-muted hover:text-pb-ink hover:bg-pb-surface2 transition-colors shrink-0">
            <ShareNetwork className="w-4 h-4" />
          </button>

          <button
            onClick={onDelete}
            className="w-9 h-9 rounded-[6px] border border-pb-hairline bg-pb-surface flex items-center justify-center text-pb-muted hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* End League confirmation dialog */}
      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent className="bg-pb-paper border border-pb-hairline rounded-[8px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-[18px] tracking-[-0.02em] text-red-600">
              End League?
            </DialogTitle>
          </DialogHeader>
          <p className="font-mono text-[13px] text-pb-muted leading-relaxed">
            This will permanently close the league. All sessions, scores, and standings will be locked — no edits, no new sessions, no score entry, nothing. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <button
              onClick={() => setConfirmComplete(false)}
              className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-9 px-4 hover:bg-pb-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onComplete();
                setConfirmComplete(false);
              }}
              className="bg-red-600 text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Yes, End League
            </button>
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
    },
    {
      label: "Sessions",
      value: `${completedSessions} / ${totalSessions}`,
      icon: CalendarBlank,
    },
    {
      label: "League Type",
      value: league.leagueType?.replace("-", " ") ?? "—",
      icon: Trophy,
    },
    {
      label: "Skill Range",
      value:
        league.skillLevel?.min && league.skillLevel?.max
          ? `${league.skillLevel.min} – ${league.skillLevel.max}`
          : "All levels",
      icon: ListNumbers,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
          Overview
        </h2>
        <p className="font-mono text-[13px] text-pb-muted mt-1">
          At-a-glance summary of your league.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-pb-surface border border-pb-hairline rounded-[8px] p-4 flex flex-col gap-2"
            >
              <Icon className="w-4 h-4 text-pb-muted" />
              <p className="font-mono font-bold text-[20px] text-pb-ink capitalize leading-tight">
                {s.value}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-muted">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {topPlayer && (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-3">
            Current Leader
          </p>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
              <span className="font-mono font-bold text-[16px] text-pb-ink">
                {topPlayer.player?.name?.charAt(0)?.toUpperCase() ?? "#"}
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-[18px] tracking-[-0.02em] text-pb-ink">
                {topPlayer.player?.name ?? "Unknown"}
              </p>
              <p className="font-mono text-[12px] text-pb-muted">
                {topPlayer.wins ?? 0}W – {topPlayer.losses ?? 0}L &nbsp;·&nbsp;{" "}
                {topPlayer.points ?? 0} pts
              </p>
            </div>
          </div>
        </div>
      )}

      {league.description && (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-2">
            Description
          </p>
          <p className="font-mono text-[13px] text-pb-ink leading-relaxed">{league.description}</p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
            Players
          </h2>
          <p className="font-mono text-[13px] text-pb-muted mt-0.5">
            {league.players?.length ?? 0} of {league.maxPlayers ?? 32} registered
          </p>
        </div>
      </div>

      {!league.players || league.players.length === 0 ? (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] text-center py-16">
          <Users className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
          <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">No players yet</p>
        </div>
      ) : (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-pb-hairline">
              <thead className="bg-pb-surface2">
                <tr>
                  {["Player", "Email", "Skill", "Joined", "Payment", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted text-left last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-hairline">
                {league.players.map((entry: any, i: number) => {
                  const p = entry.player;
                  const pid = p?._id ?? p;
                  return (
                    <tr
                      key={entry._id ?? i}
                      className="hover:bg-pb-surface2/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                            <span className="font-mono text-[11px] font-bold text-pb-ink">
                              {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <span className="font-mono text-[13px] text-pb-ink">{p?.name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-pb-muted">{p?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-center font-mono text-[12px] text-pb-muted">{p?.skillLevel ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-pb-muted">
                        {entry.joinedAt ? format(new Date(entry.joinedAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[4px]",
                            entry.paymentStatus === "paid"
                              ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                          )}
                        >
                          {entry.paymentStatus ?? "unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={removing}
                          onClick={() => onRemovePlayer(pid?.toString())}
                          className="text-pb-muted hover:text-red-600 transition-colors p-1 rounded disabled:opacity-40"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
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
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
          Standings
        </h2>
        <p className="font-mono text-[13px] text-pb-muted mt-0.5">
          Auto-calculated from match scores.
        </p>
      </div>

      {!league.players || league.players.length === 0 ? (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] text-center py-16">
          <Users className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
          <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">No players to rank</p>
        </div>
      ) : (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-pb-hairline">
              <thead className="bg-pb-surface2">
                <tr>
                  {["Rank", "Player", "W", "L", "GP", "Points"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-hairline">
                {league.players.map((entry: any, i: number) => {
                  const p = entry.player;
                  const pid = (p?._id ?? p)?.toString();
                  const standing = league.standings?.find(
                    (s: any) => (s.player?._id ?? s.player)?.toString() === pid
                  );
                  return (
                    <tr
                      key={entry._id ?? i}
                      className="hover:bg-pb-surface2/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[13px] text-pb-muted">
                        #{standing?.rank ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                            <span className="font-mono text-[11px] font-bold text-pb-ink">
                              {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <span className="font-mono text-[13px] text-pb-ink">{p?.name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[13px] text-emerald-700">{standing?.wins ?? 0}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-pb-muted">{standing?.losses ?? 0}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-pb-muted">{standing?.gamesPlayed ?? 0}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[13px] text-pb-ink">{standing?.points ?? 0}</td>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
            Sessions
          </h2>
          <p className="font-mono text-[13px] text-pb-muted mt-0.5">
            {league.sessions?.length ?? 0} total sessions
          </p>
        </div>
        {league.status !== "completed" && (
          <button
            onClick={() => setSessionDialogOpen(true)}
            className="inline-flex items-center gap-1.5 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </button>
        )}
      </div>

      {league.status === "completed" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[6px] bg-red-500/10 border border-red-300 font-mono text-[13px] text-red-600">
          <XCircle className="w-4 h-4 shrink-0" />
          This league has ended. All sessions and scores are locked.
        </div>
      )}

      {!league.sessions || league.sessions.length === 0 ? (
        <div className="bg-pb-surface border border-pb-hairline rounded-[8px] text-center py-16">
          <CalendarBlank className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
          <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">No sessions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {league.sessions.map((session: any, i: number) => {
            const sid = session._id;
            const isExpanded = expandedSession === sid;
            const matches: any[] = sessionMatches[sid] || [];
            const completedCount = matches.filter((m) => m.status === "completed").length;
            return (
              <div key={sid ?? i} className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                <div
                  className="p-4 flex items-start gap-3 cursor-pointer hover:bg-pb-surface2/40 transition-colors"
                  onClick={() => onToggleSession(sid)}
                >
                  <div className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-[13px] text-pb-ink">
                      {session.sessionNumber ?? i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[13px] text-pb-ink">
                        Session {session.sessionNumber ?? i + 1}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[4px]",
                          SESSION_STATUS_STYLES[session.status] ?? SESSION_STATUS_STYLES.upcoming
                        )}
                      >
                        {session.status}
                      </span>
                      {matches.length > 0 && (
                        <span className="font-mono text-[11px] text-pb-muted">
                          {completedCount}/{matches.length} matches done
                        </span>
                      )}
                    </div>
                    {session.date && (
                      <p className="font-mono text-[11px] text-pb-muted mt-1">
                        {format(new Date(session.date), "EEEE, MMM d, yyyy")}
                      </p>
                    )}
                    {session.notes && (
                      <p className="font-mono text-[11px] text-pb-muted mt-1">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {league.status !== "completed" && session.status === "upcoming" && (
                      <button
                        onClick={() => onUpdateSession(sid, "active")}
                        className="border border-pb-hairline rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] text-pb-ink h-8 px-3 hover:bg-pb-surface2 transition-colors"
                      >
                        Mark Active
                      </button>
                    )}
                    {league.status !== "completed" && session.status === "active" && (
                      <button
                        onClick={() => setConfirmCompleteId(sid)}
                        className="border border-emerald-300 text-emerald-700 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] h-8 px-3 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-pb-hairline p-4 space-y-4 bg-pb-surface2/30">
                    {/* Format selector + generate button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-muted mb-1.5">
                          Match Format
                        </p>
                        <Select
                          value={sessionFormats[sid] ?? "Game to 11 – Win by 1"}
                          onValueChange={(v) => onSetSessionFormat(sid, v as MatchFormatLabel)}
                          disabled={league.status === "completed" || session.status === "completed"}
                        >
                          <SelectTrigger className="h-8 font-mono text-[12px] rounded-[6px] w-full sm:w-64 border-pb-hairline">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MATCH_FORMAT_LABELS.map((opt) => (
                              <SelectItem key={opt} value={opt} className="font-mono text-[12px]">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2 shrink-0 self-end">
                        {league.status !== "completed" && session.status !== "completed" && (
                          <button
                            onClick={() => onGenerateMatches(sid)}
                            disabled={generatingMatches === sid}
                            className="border border-pb-hairline rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] text-pb-ink h-8 px-3 hover:bg-pb-surface transition-colors disabled:opacity-50"
                          >
                            {generatingMatches === sid
                              ? "Generating..."
                              : matches.length > 0
                              ? "Regenerate"
                              : "Generate Matches"}
                          </button>
                        )}
                      </div>
                    </div>

                    {matches.length === 0 ? (
                      <p className="font-mono text-[13px] text-pb-muted text-center py-4">
                        No matches yet. Click "Generate Matches" to create the round-robin schedule.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {/* Format info */}
                        {(() => {
                          const fmt = sessionFormats[sid] ?? "Game to 11 – Win by 1";
                          const cfg = MATCH_FORMAT_CONFIGS[fmt as MatchFormatLabel];
                          return cfg ? (
                            <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.06em]">
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
                              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-muted mb-1.5">
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
                                          "flex items-center gap-3 p-3 rounded-[6px] border",
                                          isDone
                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                            : "bg-pb-surface border-pb-hairline"
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "font-mono flex-1 text-right font-mono text-[12px]",
                                            match.winner?._id === match.player1?._id
                                              ? "font-bold text-pb-ink"
                                              : "text-pb-muted"
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
                                            className="input-no-spinner w-14 h-9 text-center font-mono font-bold text-[14px] rounded-[6px]"
                                            disabled={isDone || league.status === "completed"}
                                          />
                                          <span className="font-mono text-[11px] text-pb-muted">vs</span>
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
                                            className="input-no-spinner w-14 h-9 text-center font-mono font-bold text-[14px] rounded-[6px]"
                                            disabled={isDone || league.status === "completed"}
                                          />
                                        </div>
                                        <span
                                          className={cn(
                                            "font-mono flex-1 font-mono text-[12px]",
                                            match.winner?._id === match.player2?._id
                                              ? "font-bold text-pb-ink"
                                              : "text-pb-muted"
                                          )}
                                        >
                                          {match.player2?.name ?? "Player"}
                                        </span>
                                        {isDone ? (
                                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        ) : league.status === "completed" ? (
                                          <XCircle className="w-4 h-4 text-pb-muted/40 shrink-0" />
                                        ) : (
                                          <button
                                            onClick={() => onEnterScore(mid, sid)}
                                            disabled={savingScore === mid}
                                            className="border border-pb-hairline rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] text-pb-ink h-7 px-2.5 hover:bg-pb-surface2 transition-colors shrink-0 disabled:opacity-50"
                                          >
                                            {savingScore === mid ? "..." : "Save"}
                                          </button>
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
        <DialogContent className="bg-pb-paper border border-pb-hairline rounded-[8px] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-[18px] tracking-[-0.02em] text-pb-ink">
              Add Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className={fieldLabel}>Date</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div>
              <Label className={fieldLabel}>Notes</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Optional notes for this session..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSessionDialogOpen(false)}
              className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-9 px-4 hover:bg-pb-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAddSession}
              disabled={addingSession || !sessionDate}
              className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {addingSession ? "Adding..." : "Add Session"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete session confirmation dialog */}
      <Dialog open={!!confirmCompleteId} onOpenChange={(open) => { if (!open) setConfirmCompleteId(null); }}>
        <DialogContent className="bg-pb-paper border border-pb-hairline rounded-[8px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-[18px] tracking-[-0.02em] text-pb-ink">
              Complete Session?
            </DialogTitle>
          </DialogHeader>
          <p className="font-mono text-[13px] text-pb-muted leading-relaxed">
            This will lock the session. Scores can't be edited and matches can't be regenerated afterward.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <button
              onClick={() => setConfirmCompleteId(null)}
              className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-9 px-4 hover:bg-pb-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmCompleteId) {
                  onUpdateSession(confirmCompleteId, "completed");
                  setConfirmCompleteId(null);
                }
              }}
              className="bg-emerald-600 text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Yes, Complete
            </button>
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
  const set = (key: string, value: any) => setSettingsForm((f: any) => ({ ...f, [key]: value }));

  function ToggleRow({ label, desc, field }: { label: string; desc: string; field: string }) {
    return (
      <div className="flex items-center justify-between p-4 rounded-[6px] border border-pb-hairline bg-pb-surface">
        <div>
          <p className="font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-pb-ink">{label}</p>
          <p className="font-mono text-[12px] text-pb-muted mt-0.5">{desc}</p>
        </div>
        <button
          type="button"
          onClick={() => set(field, !settingsForm[field])}
          className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0", settingsForm[field] ? "bg-pb-court" : "bg-pb-hairline")}
        >
          <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200", settingsForm[field] ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
            Settings
          </h2>
          <p className="font-mono text-[13px] text-pb-muted mt-0.5">Update league configuration.</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <FloppyDisk className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">Basic Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className={fieldLabel}>League Name</Label>
            <Input value={settingsForm.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className={fieldLabel}>Description</Label>
            <Textarea value={settingsForm.description} onChange={(e) => set("description", e.target.value)} rows={3} className="resize-none" />
          </div>
          <div>
            <Label className={fieldLabel}>Location</Label>
            <Input value={settingsForm.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Address</Label>
            <Input value={settingsForm.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Start Date</Label>
            <Input type="date" value={settingsForm.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>End Date</Label>
            <Input type="date" value={settingsForm.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Registration Deadline</Label>
            <Input type="date" value={settingsForm.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Status</Label>
            <select value={settingsForm.status} onChange={(e) => set("status", e.target.value)} className={selectNativeCls}>
              {["draft", "open", "active", "completed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className={fieldLabel}>Contact Email</Label>
            <Input type="email" value={settingsForm.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Contact Phone</Label>
            <Input value={settingsForm.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
        </div>
      </div>

      {/* League Type */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">League Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEAGUE_TYPES.map((t) => (
            <RadioCard key={t.value} selected={settingsForm.leagueType === t.value} onClick={() => set("leagueType", t.value)} label={t.label} description={t.description} />
          ))}
        </div>
      </div>

      {/* Player Type & Group */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">Player Settings</p>
        <div>
          <Label className={fieldLabel}>Player Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAYER_TYPES.map((t) => (
              <RadioCard key={t.value} selected={settingsForm.playerType === t.value} onClick={() => set("playerType", t.value)} label={t.label} description={t.description} />
            ))}
          </div>
        </div>
        <div>
          <Label className={fieldLabel}>Player Group</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAYER_GROUPS.map((g) => (
              <RadioCard key={g.value} selected={settingsForm.playerGroup === g.value} onClick={() => set("playerGroup", g.value)} label={g.label} description={g.description} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={fieldLabel}>Skill Level Min</Label>
            <select value={settingsForm.skillLevelMin} onChange={(e) => set("skillLevelMin", Number(e.target.value))} className={selectNativeCls}>
              {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label className={fieldLabel}>Skill Level Max</Label>
            <select value={settingsForm.skillLevelMax} onChange={(e) => set("skillLevelMax", Number(e.target.value))} className={selectNativeCls}>
              {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label className={fieldLabel}>Min Age</Label>
            <Input type="number" min={0} value={settingsForm.minAge} onChange={(e) => set("minAge", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Ranking & Signup */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">Rules & Scoring</p>
        <div>
          <Label className={fieldLabel}>Ranking Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RANKING_TYPES.map((t) => (
              <RadioCard key={t.value} selected={settingsForm.rankingType === t.value} onClick={() => set("rankingType", t.value)} label={t.label} description={t.description} />
            ))}
          </div>
        </div>
        <div>
          <Label className={fieldLabel}>Signup Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SIGNUP_TYPES.map((t) => (
              <RadioCard key={t.value} selected={settingsForm.signupType === t.value} onClick={() => set("signupType", t.value)} label={t.label} description={t.description} />
            ))}
          </div>
        </div>
        <div>
          <Label className={fieldLabel}>New Player Placement</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAYER_PLACEMENT.map((t) => (
              <RadioCard key={t.value} selected={settingsForm.newPlayerPlacement === t.value} onClick={() => set("newPlayerPlacement", t.value)} label={t.label} description={t.description} />
            ))}
          </div>
        </div>
        <div>
          <Label className={fieldLabel}>Rules</Label>
          <Textarea value={settingsForm.rules} onChange={(e) => set("rules", e.target.value)} rows={4} className="resize-none" placeholder="League rules..." />
        </div>
      </div>

      {/* Registration & Fees */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">Registration & Fees</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={fieldLabel}>Max Players</Label>
            <Input type="number" min={4} value={settingsForm.maxPlayers} onChange={(e) => set("maxPlayers", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Entry Fee ($)</Label>
            <Input type="number" min={0} step={0.01} value={settingsForm.entryFee} onChange={(e) => set("entryFee", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Member Fee ($)</Label>
            <Input type="number" min={0} step={0.01} value={settingsForm.memberFee} onChange={(e) => set("memberFee", e.target.value)} />
          </div>
          <div>
            <Label className={fieldLabel}>Non-Member Fee ($)</Label>
            <Input type="number" min={0} step={0.01} value={settingsForm.nonMemberFee} onChange={(e) => set("nonMemberFee", e.target.value)} />
          </div>
        </div>
        <ToggleRow label="Allow Waitlist" desc="Players can join a waitlist when the league is full" field="allowWaitlist" />
      </div>

      {/* Features */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">Features</p>
        <ToggleRow label="Flex Play" desc="Allow players to join on a flexible, drop-in basis" field="flexPlay" />
        <ToggleRow label="DUPR Integration" desc="Send match results to DUPR for rating updates" field="duprIntegration" />
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
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
          Test Data
        </h2>
        <p className="font-mono text-[13px] text-pb-muted mt-0.5">Generate fake players for testing.</p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-[6px] bg-yellow-500/10 border border-yellow-400/30">
        <Warning className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-mono font-bold text-[13px] text-yellow-700">Testing Only</p>
          <p className="font-mono text-[12px] text-pb-muted mt-0.5">
            Creates fake player accounts and adds them to this league. Use "Clear Test Data" to remove them when done.
          </p>
        </div>
      </div>

      {/* Generate */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center">
            <Users className="w-4 h-4 text-pb-muted" />
          </div>
          <div>
            <p className="font-mono font-bold text-[13px] text-pb-ink">Generate Test Players</p>
            <p className="font-mono text-[12px] text-pb-muted">Add fake players to this league for testing</p>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div className="space-y-1.5 w-36">
            <Label className={fieldLabel}>Number of Players</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="8"
            />
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={!canGenerate}
            className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-4 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
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
          </button>
        </div>
        {generateMutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2 font-mono text-[12px] text-emerald-700">
            <CheckCircle className="w-4 h-4" />
            {(generateMutation.data as any)?.message}
          </div>
        )}
      </div>

      {/* Clear */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-red-500/10 border border-red-300/40 flex items-center justify-center">
              <Trash className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="font-mono font-bold text-[13px] text-pb-ink">Clear All Test Data</p>
              <p className="font-mono text-[12px] text-pb-muted">Remove all test players from this league</p>
            </div>
          </div>
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="inline-flex items-center gap-1.5 border border-red-300 text-red-600 rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:bg-red-50 transition-colors disabled:opacity-50"
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
          </button>
        </div>
        {clearMutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2 font-mono text-[12px] text-emerald-700">
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
      leagueType: league.leagueType ?? "",
      playerType: league.playerType ?? "",
      playerGroup: league.playerGroup ?? "",
      rankingType: league.rankingType ?? "pop",
      signupType: league.signupType ?? "open",
      newPlayerPlacement: league.newPlayerPlacement ?? "bottom",
      flexPlay: league.flexPlay ?? false,
      duprIntegration: league.duprIntegration ?? false,
      minAge: league.minAge ?? 0,
      memberFee: league.memberFee ?? 0,
      nonMemberFee: league.nonMemberFee ?? 0,
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
        minAge: Number(settingsForm.minAge),
        memberFee: Number(settingsForm.memberFee),
        nonMemberFee: Number(settingsForm.nonMemberFee),
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
          <div className="h-8 rounded bg-pb-surface2 w-1/3" />
          <div className="h-32 rounded-[8px] bg-pb-surface2" />
        </div>
      </Layout>
    );
  }

  if (!league || !isOrganizer) {
    return (
      <Layout variant="minimal">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">Not authorized</h2>
          <Link
            to="/leagues"
            className="mt-4 inline-flex items-center border border-pb-hairline rounded-[6px] font-mono text-[12px] text-pb-ink px-4 h-9 hover:bg-pb-surface2 transition-colors"
          >
            Back to Leagues
          </Link>
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
      <div className="min-h-screen bg-pb-paper">
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
            <main className="flex-1 min-w-0">{renderSection()}</main>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-pb-paper border border-pb-hairline rounded-[8px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-[18px] tracking-[-0.02em] text-red-600">
              Delete League
            </DialogTitle>
          </DialogHeader>
          <p className="font-mono text-[13px] text-pb-muted leading-relaxed">
            Are you sure you want to delete <strong className="text-pb-ink">{league.name}</strong>? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-9 px-4 hover:bg-pb-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete League"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
