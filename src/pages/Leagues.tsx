import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { SkeletonGrid } from "@/components/ui/skeleton-card";
import { cn } from "@/lib/utils";
import { leagueAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Check,
  CaretLeft,
  CaretRight,
  Funnel,
  MagnifyingGlass,
  Trophy,
  MapPin,
  Users,
  Gear,
  Plus,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";

// ─── League Card (matches TournamentCard design) ────────────────────────────
function LeagueCard({ league }: { league: any }) {
  const { user } = useAuth();
  const organizerId = league.organizer?._id ?? league.organizer;
  const isOwner =
    user?._id === organizerId?.toString() || user?.role === "admin";

  const playerCount = league.players?.length ?? 0;
  const maxPlayers = league.maxPlayers || 32;
  const spotsRemaining = Math.max(0, maxPlayers - playerCount);
  const fillPercent = Math.min(100, (playerCount / maxPlayers) * 100);
  const isFillingFast = spotsRemaining > 0 && spotsRemaining <= 5;

  const locationParts = league.location?.split(",") || [];
  const shortLocation =
    locationParts.length >= 2
      ? `${locationParts[0].trim()}, ${locationParts[locationParts.length - 1].trim()}`
      : league.location;

  const leagueTypeLabel: Record<string, string> = {
    ladder: "Ladder",
    traditional: "Traditional",
    "king-of-court": "King of Court",
    "dupr-session": "DUPR Session",
  };

  const ctaLink = isOwner
    ? `/leagues/${league._id}/manage`
    : league.status === "open"
    ? `/leagues/${league._id}`
    : `/leagues/${league._id}`;

  const ctaLabel = isOwner
    ? "Manage League"
    : league.status === "open"
    ? "Register Now"
    : league.status === "active"
    ? "View Standings"
    : "View Details";

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden h-full group relative"
    >
      {/* Shimmer on hover */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Image / header area */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {league.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url('${league.image}')` }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/80 border-b border-border/50">
            <div className="rounded-full bg-primary/10 p-4">
              <Trophy className="w-10 h-10 text-primary/40" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {leagueTypeLabel[league.leagueType] ?? "League"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        {/* Status badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded bg-white font-display font-black text-[10px] uppercase tracking-widest text-muted-foreground">
            {league.status}
          </span>
        </div>

        {/* Filling fast badge */}
        {isFillingFast && league.status === "open" && (
          <div className="absolute top-4 right-4">
            <span className="font-display font-bold text-xs text-white bg-destructive/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              {spotsRemaining} spots left
            </span>
          </div>
        )}

        {/* Name + location */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h4 className="text-xl font-display font-black uppercase tracking-tight leading-none mb-1 shadow-sm group-hover:text-primary transition-colors line-clamp-2">
            {league.name}
          </h4>
          <p className="font-medium text-xs text-white/90 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {shortLocation}
            {league.startDate && (
              <> • {format(new Date(league.startDate), "MMM dd")}</>
            )}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col bg-card">
        <div className="flex justify-between items-center mb-4 text-sm font-semibold">
          <span className="bg-muted px-2 py-1 rounded-md text-xs text-foreground">
            {leagueTypeLabel[league.leagueType] ?? league.leagueType}
          </span>
          <span className="text-foreground font-bold">
            {league.entryFee ? `$${league.entryFee}` : "Free"} Entry
          </span>
        </div>

        <div className="mt-auto">
          {league.status !== "completed" && (
            <>
              <div className="flex justify-between items-end mb-1 text-xs font-bold">
                <span className="text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  {playerCount} / {maxPlayers} registered
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${fillPercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={cn(
                    "h-full rounded-full",
                    isFillingFast ? "bg-destructive" : "bg-primary"
                  )}
                />
              </div>
            </>
          )}

          <Button
            className="w-full bg-foreground text-background hover:bg-primary font-display font-bold uppercase tracking-widest text-xs transition-colors py-5 rounded-xl shadow-none"
            asChild
          >
            <Link to={ctaLink}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Leagues() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isOrganizer =
    isAuthenticated && (user?.role === "organizer" || user?.role === "admin");

  const [searchQuery, setSearchQuery] = useState("");
  const [leagueTypeFilter, setLeagueTypeFilter] = useState("all");
  const [playerGroupFilter, setPlayerGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entryFeeFilter, setEntryFeeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, leagueTypeFilter, playerGroupFilter, statusFilter, entryFeeFilter, sortOption]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "leagues",
      searchQuery,
      leagueTypeFilter,
      playerGroupFilter,
      statusFilter,
      entryFeeFilter,
      sortOption,
      currentPage,
    ],
    queryFn: () =>
      leagueAPI.getAll({
        search: searchQuery || undefined,
        leagueType: leagueTypeFilter !== "all" ? leagueTypeFilter : undefined,
        playerGroup: playerGroupFilter !== "all" ? playerGroupFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
      }),
  });

  const leagues = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pages ?? 1);

  const activeFiltersCount =
    (leagueTypeFilter !== "all" ? 1 : 0) +
    (playerGroupFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (entryFeeFilter !== "all" ? 1 : 0);

  const getPageNumbers = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const clearFilters = () => {
    setLeagueTypeFilter("all");
    setPlayerGroupFilter("all");
    setStatusFilter("all");
    setEntryFeeFilter("all");
    setSortOption("newest");
  };

  const FilterOptions = () => (
    <div className="space-y-6">
      {/* League Type */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
          League Type
        </h3>
        <div className="space-y-2">
          {[
            { val: "all", label: "All Types" },
            { val: "ladder", label: "Ladder" },
            { val: "traditional", label: "Traditional" },
            { val: "king-of-court", label: "King of Court" },
            { val: "dupr-session", label: "DUPR Session" },
          ].map(({ val, label }) => (
            <label
              key={val}
              onClick={() => setLeagueTypeFilter(val)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  leagueTypeFilter === val
                    ? "border-primary bg-primary"
                    : "border-muted-foreground group-hover:border-primary"
                )}
              >
                {leagueTypeFilter === val && (
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                )}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Player Group */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Player Group
        </h3>
        <div className="space-y-2">
          {[
            { val: "all", label: "All Groups" },
            { val: "mens", label: "Men's" },
            { val: "womens", label: "Women's" },
            { val: "mixed", label: "Mixed" },
            { val: "coed", label: "Coed" },
          ].map(({ val, label }) => (
            <label
              key={val}
              onClick={() => setPlayerGroupFilter(val)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  playerGroupFilter === val
                    ? "border-primary bg-primary"
                    : "border-muted-foreground group-hover:border-primary"
                )}
              >
                {playerGroupFilter === val && (
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                )}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Status
        </h3>
        <div className="space-y-2">
          {[
            { val: "all", label: "All" },
            { val: "open", label: "Open" },
            { val: "active", label: "Active" },
            { val: "completed", label: "Completed" },
          ].map(({ val, label }) => (
            <label
              key={val}
              onClick={() => setStatusFilter(val)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  statusFilter === val
                    ? "border-primary bg-primary"
                    : "border-muted-foreground group-hover:border-primary"
                )}
              >
                {statusFilter === val && (
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                )}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Entry Fee */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Entry Fee
        </h3>
        <div className="space-y-2">
          {[
            { val: "all", label: "Any Price" },
            { val: "free", label: "Free" },
            { val: "paid", label: "Paid" },
          ].map(({ val, label }) => (
            <label
              key={val}
              onClick={() => setEntryFeeFilter(val)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  entryFeeFilter === val
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground group-hover:border-primary text-transparent"
                )}
              >
                <Check className="w-3 h-3" weight="bold" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const filteredLeagues =
    entryFeeFilter === "free"
      ? leagues.filter((l: any) => !l.entryFee || l.entryFee === 0)
      : entryFeeFilter === "paid"
      ? leagues.filter((l: any) => l.entryFee && l.entryFee > 0)
      : leagues;

  return (
    <Layout>
      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['leagues'] })}>
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-foreground">
                Find Leagues
              </h1>
              {isOrganizer && (
                <Button
                  asChild
                  className="font-display font-bold uppercase tracking-widest rounded-xl h-12 px-6 shrink-0"
                >
                  <Link to="/leagues/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create League
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative max-w-2xl">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by league name or location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-card border-border rounded-xl shadow-sm"
                />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg font-display uppercase tracking-widest font-bold">
                  Search
                </Button>
              </div>

              {/* Mobile filter drawer trigger */}
              <div className="md:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-xl flex items-center gap-2 shadow-sm border-border bg-card text-foreground font-display uppercase font-bold tracking-wide"
                    >
                      <Funnel className="w-5 h-5" />
                      Filters{" "}
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 bg-primary">{activeFiltersCount}</Badge>
                      )}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4">
                    <DrawerHeader className="text-left px-0">
                      <DrawerTitle className="font-display font-bold text-2xl uppercase tracking-tight">
                        Filters
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto max-h-[60vh] py-4">
                      <FilterOptions />
                    </div>
                    <DrawerFooter className="px-0 pt-4 pb-8 border-t border-border">
                      <DrawerClose asChild>
                        <Button className="w-full h-14 rounded-xl font-display uppercase tracking-widest font-bold">
                          Show Results
                        </Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Desktop filter sidebar */}
            <aside className="hidden md:block w-[280px] shrink-0 sticky top-28 bg-card p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl uppercase tracking-tight flex items-center gap-2">
                  <Funnel className="w-5 h-5 text-primary" /> Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-primary font-bold uppercase tracking-wider transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <FilterOptions />
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 w-full">
              {/* Results header */}
              <div className="hidden md:flex items-center justify-between mb-6">
                <div className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">
                  Showing {filteredLeagues.length} of {totalCount} results
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                    Sort:
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-card border border-border rounded-lg px-2 py-1.5 text-foreground text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <SkeletonGrid count={6} className="mt-4" />
              ) : error ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <MagnifyingGlass className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-2">
                    Error loading leagues
                  </h3>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-xl font-display font-bold uppercase tracking-widest"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredLeagues.length > 0 ? (
                <div className="space-y-10">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeagues.map((league: any, index: number) => (
                      <div
                        key={league._id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                      >
                        <LeagueCard league={league} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8 border-t border-border">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-xl"
                      >
                        <CaretLeft className="w-5 h-5" />
                      </Button>

                      <div className="flex items-center gap-1 mx-2">
                        {pageNumbers.map((page, i) =>
                          page === "..." ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="w-10 h-10 flex items-center justify-center text-muted-foreground text-sm select-none"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page as number)}
                              className={cn(
                                "w-10 h-10 rounded-xl font-display font-bold text-sm transition-colors",
                                currentPage === page
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {page}
                            </button>
                          )
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 rounded-xl"
                      >
                        <CaretRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                  <div className="w-24 h-24 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                    <div className="absolute inset-2 rounded-full bg-primary/5 flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-primary/60" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary/40" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-primary/30" />
                  </div>
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight mb-2">
                    No leagues found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                    Try adjusting your search or filters, or create your own league.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="font-display font-bold uppercase tracking-widest rounded-xl h-12 px-8"
                      onClick={() => {
                        setSearchQuery("");
                        clearFilters();
                      }}
                    >
                      Clear Filters
                    </Button>
                    {isOrganizer && (
                      <Button
                        className="font-display font-bold uppercase tracking-widest rounded-xl h-12 px-8"
                        asChild
                      >
                        <Link to="/leagues/create">Create a League</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      </PullToRefresh>
    </Layout>
  );
}
