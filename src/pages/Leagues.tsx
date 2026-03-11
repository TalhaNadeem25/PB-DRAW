import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { leagueAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  MagnifyingGlass,
  Trophy,
  Plus,
  MapPin,
  Users,
  CalendarBlank,
  CurrencyDollar,
  Ladder,
  UsersThree,
  Crown,
  Star,
  Funnel,
} from "@phosphor-icons/react";
import { format } from "date-fns";

const LEAGUE_TYPE_LABELS: Record<string, string> = {
  ladder: "Ladder",
  traditional: "Traditional",
  "king-of-court": "King of Court",
  "dupr-session": "DUPR Session",
};

const PLAYER_GROUP_LABELS: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  mixed: "Mixed",
  coed: "Coed",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  active: "bg-primary/15 text-primary border border-primary/30",
  completed: "bg-muted text-muted-foreground",
};

function LeagueCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-muted/50" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-muted/50 rounded w-3/4" />
        <div className="h-4 bg-muted/50 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-muted/50 rounded-full w-20" />
          <div className="h-6 bg-muted/50 rounded-full w-16" />
        </div>
        <div className="h-9 bg-muted/50 rounded-xl" />
      </div>
    </div>
  );
}

function LeagueCard({ league }: { league: any }) {
  const playerCount = league.players?.length ?? 0;
  const pct = Math.min(100, Math.round((playerCount / (league.maxPlayers || 32)) * 100));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Link to={`/leagues/${league._id}`} className="block group">
        <div className="glass-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/40 hover:shadow-glow transition-all duration-300">
          {/* Header gradient */}
          <div className="relative h-32 bg-hero-gradient flex items-end p-4 overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
            <div className="relative z-10 flex items-start justify-between w-full gap-2">
              <div>
                <h3 className="font-display font-black text-white text-lg leading-tight line-clamp-1 uppercase tracking-tight">
                  {league.name}
                </h3>
                <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{league.location}</span>
                </div>
              </div>
              <span
                className={`shrink-0 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded-full ${STATUS_COLORS[league.status] || STATUS_COLORS.draft}`}
              >
                {league.status}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-display font-bold uppercase tracking-wide rounded-full border border-primary/20">
                {LEAGUE_TYPE_LABELS[league.leagueType] ?? league.leagueType}
              </span>
              <span className="px-2.5 py-0.5 bg-accent text-foreground text-[11px] font-display font-bold uppercase tracking-wide rounded-full border border-border/40">
                {PLAYER_GROUP_LABELS[league.playerGroup] ?? league.playerGroup}
              </span>
            </div>

            {/* Info row */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {league.startDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarBlank className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                  <span>{format(new Date(league.startDate), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <CurrencyDollar className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                <span>{league.entryFee === 0 ? "Free" : `$${league.entryFee}`}</span>
              </div>
            </div>

            {/* Players progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {playerCount} / {league.maxPlayers} players
                  </span>
                </div>
                <span className="text-[10px] font-bold text-primary">{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-hero-gradient rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-display font-bold uppercase tracking-wide text-xs"
            >
              View League
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Leagues() {
  const { user, isAuthenticated } = useAuth();
  const isOrganizer = isAuthenticated && (user?.role === "organizer" || user?.role === "admin");

  const [search, setSearch] = useState("");
  const [leagueTypeFilter, setLeagueTypeFilter] = useState("all");
  const [playerGroupFilter, setPlayerGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["leagues", search, leagueTypeFilter, playerGroupFilter, statusFilter, page],
    queryFn: () =>
      leagueAPI.getAll({
        search: search || undefined,
        leagueType: leagueTypeFilter !== "all" ? leagueTypeFilter : undefined,
        playerGroup: playerGroupFilter !== "all" ? playerGroupFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: 12,
      }),
  });

  const leagues = data?.data ?? [];
  const totalPages = data?.pages ?? 1;

  const leagueTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "ladder", label: "Ladder" },
    { value: "traditional", label: "Traditional" },
    { value: "king-of-court", label: "King of Court" },
    { value: "dupr-session", label: "DUPR" },
  ];

  const playerGroupOptions = [
    { value: "all", label: "All Groups" },
    { value: "mens", label: "Men's" },
    { value: "womens", label: "Women's" },
    { value: "mixed", label: "Mixed" },
    { value: "coed", label: "Coed" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden py-16 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
                LEAGUES
              </h1>
              <p className="text-white/70 mt-2 text-sm sm:text-base max-w-lg">
                Join a pickleball league, compete weekly, climb the standings.
              </p>
            </div>
            {isOrganizer && (
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-display font-black uppercase tracking-wide shadow-md hover:shadow-glow transition-all shrink-0"
              >
                <Link to="/leagues/create">
                  <Plus className="w-5 h-5 mr-2" />
                  Create League
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[4.5rem] z-30 bg-background/95 backdrop-blur-md border-b border-border/50 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leagues..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 rounded-xl border-border/50 bg-card/60"
              />
            </div>

            {/* Filter selects */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: leagueTypeFilter, setter: setLeagueTypeFilter, options: leagueTypeOptions },
                { value: playerGroupFilter, setter: setPlayerGroupFilter, options: playerGroupOptions },
                { value: statusFilter, setter: setStatusFilter, options: statusOptions },
              ].map((filter, i) => (
                <select
                  key={i}
                  value={filter.value}
                  onChange={(e) => {
                    filter.setter(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 pr-8 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <LeagueCardSkeleton key={i} />
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-foreground">
              No leagues found
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs text-center">
              {search || leagueTypeFilter !== "all" || playerGroupFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "No leagues have been created yet."}
            </p>
            {isOrganizer && (
              <Button asChild className="font-display font-bold uppercase tracking-wide">
                <Link to="/leagues/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First League
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{leagues.length}</span> of{" "}
                <span className="font-semibold text-foreground">{data?.total ?? leagues.length}</span> leagues
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {leagues.map((league: any, i: number) => (
                <motion.div
                  key={league._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <LeagueCard league={league} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}
