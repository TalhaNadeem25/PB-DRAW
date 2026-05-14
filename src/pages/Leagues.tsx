import Layout from "@/components/layout/Layout";
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
  Plus,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";

// ─── League Card ─────────────────────────────────────────────────────────────
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
    : `/leagues/${league._id}`;

  const ctaLabel = isOwner
    ? "Manage League"
    : league.status === "open"
    ? "Register Now"
    : league.status === "active"
    ? "View Standings"
    : "View Details";

  const statusColors: Record<string, string> = {
    open: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
    active: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
    completed: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
    draft: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
  };

  return (
    <div className="bg-pb-surface border border-pb-hairline rounded-[8px] flex flex-col overflow-hidden h-full">
      {/* Top strip */}
      <div className="p-4 pb-3 flex items-start justify-between gap-2">
        <h4 className="font-display font-bold text-[17px] leading-tight text-pb-ink line-clamp-2 flex-1">
          {league.name}
        </h4>
        <span
          className={cn(
            "shrink-0 text-[10px] font-mono uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px]",
            statusColors[league.status] ?? statusColors.draft
          )}
        >
          {league.status}
        </span>
      </div>

      {/* Meta row */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {shortLocation && (
          <span className="font-mono text-[12px] text-pb-muted flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {shortLocation}
          </span>
        )}
        {league.startDate && (
          <span className="font-mono text-[12px] text-pb-muted">
            {format(new Date(league.startDate), "MMM dd")}
          </span>
        )}
        <span className="font-mono text-[12px] text-pb-muted">
          {leagueTypeLabel[league.leagueType] ?? league.leagueType}
        </span>
        {isFillingFast && league.status === "open" && (
          <span className="font-mono text-[10px] text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-[4px]">
            {spotsRemaining} spots left
          </span>
        )}
      </div>

      <div className="h-px bg-pb-hairline" />

      {/* Progress + CTA */}
      <div className="p-4 flex-1 flex flex-col justify-end gap-3">
        {league.status !== "completed" && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-mono text-[11px] text-pb-muted flex items-center gap-1">
                <Users className="w-3 h-3" />
                {playerCount} / {maxPlayers}
              </span>
              <span className="font-mono text-[11px] text-pb-muted">
                {league.entryFee ? `$${league.entryFee}` : "Free"}
              </span>
            </div>
            <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isFillingFast ? "bg-red-500" : "bg-pb-court"
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        )}

        <Link
          to={ctaLink}
          className="w-full bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] py-2.5 text-center transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
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
        <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
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
                    ? "border-pb-court bg-pb-court"
                    : "border-pb-hairline group-hover:border-pb-court"
                )}
              >
                {leagueTypeFilter === val && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="font-mono text-[13px] text-pb-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Player Group */}
      <div className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
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
                    ? "border-pb-court bg-pb-court"
                    : "border-pb-hairline group-hover:border-pb-court"
                )}
              >
                {playerGroupFilter === val && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="font-mono text-[13px] text-pb-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
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
                    ? "border-pb-court bg-pb-court"
                    : "border-pb-hairline group-hover:border-pb-court"
                )}
              >
                {statusFilter === val && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="font-mono text-[13px] text-pb-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Entry Fee */}
      <div className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
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
                  "w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors",
                  entryFeeFilter === val
                    ? "border-pb-court bg-pb-court text-white"
                    : "border-pb-hairline group-hover:border-pb-court text-transparent"
                )}
              >
                <Check className="w-3 h-3" weight="bold" />
              </div>
              <span className="font-mono text-[13px] text-pb-ink">{label}</span>
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
      <div className="min-h-screen bg-pb-paper pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="font-display font-extrabold text-[40px] tracking-[-0.04em] text-pb-ink leading-none">
                Find Leagues
              </h1>
              {isOrganizer && (
                <Link
                  to="/leagues/create"
                  className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 shrink-0 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Create League
                </Link>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative max-w-2xl">
                <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pb-muted" />
                <Input
                  placeholder="Search by league name or location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-pb-surface border-pb-hairline font-mono text-[13px] rounded-[6px] focus-visible:ring-pb-court"
                />
              </div>

              {/* Mobile filter drawer trigger */}
              <div className="md:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <button className="w-full h-11 rounded-[6px] flex items-center justify-center gap-2 border border-pb-hairline bg-pb-surface font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink">
                      <Funnel className="w-4 h-4" />
                      Filters{" "}
                      {activeFiltersCount > 0 && (
                        <span className="ml-1 bg-pb-court text-white font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 bg-pb-paper">
                    <DrawerHeader className="text-left px-0">
                      <DrawerTitle className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
                        Filters
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto max-h-[60vh] py-4">
                      <FilterOptions />
                    </div>
                    <DrawerFooter className="px-0 pt-4 pb-8 border-t border-pb-hairline">
                      <DrawerClose asChild>
                        <button className="w-full h-11 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em]">
                          Show Results
                        </button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Desktop filter sidebar */}
            <aside className="hidden md:block w-[260px] shrink-0 sticky top-28 bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-mono text-[13px] uppercase tracking-[0.08em] text-pb-ink flex items-center gap-2">
                  <Funnel className="w-4 h-4" /> Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="font-mono text-[11px] text-pb-muted hover:text-pb-ink uppercase tracking-[0.06em] transition-colors"
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
                <div className="font-mono text-[12px] text-pb-muted uppercase tracking-[0.06em]">
                  Showing {filteredLeagues.length} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-pb-muted uppercase tracking-[0.06em]">
                    Sort:
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-pb-surface border border-pb-hairline rounded-[6px] px-2 py-1.5 text-pb-ink font-mono text-[12px] focus:outline-none focus:ring-1 focus:ring-pb-court cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <SkeletonGrid count={6} className="mt-4" />
              ) : error ? (
                <div className="text-center py-20 bg-pb-surface border border-pb-hairline rounded-[8px]">
                  <div className="w-14 h-14 mx-auto rounded-[8px] bg-red-500/10 flex items-center justify-center mb-4">
                    <MagnifyingGlass className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="font-display font-bold text-[18px] tracking-[-0.02em] text-pb-ink mb-2">
                    Error loading leagues
                  </h3>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 hover:opacity-90 transition-opacity"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredLeagues.length > 0 ? (
                <div className="space-y-10">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="flex items-center justify-center gap-1.5 pt-8 border-t border-pb-hairline">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-pb-hairline font-mono text-[13px] text-pb-muted disabled:opacity-40 hover:border-pb-rule transition-colors"
                      >
                        <CaretLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {pageNumbers.map((page, i) =>
                          page === "..." ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="w-9 h-9 flex items-center justify-center font-mono text-[13px] text-pb-muted"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page as number)}
                              className={cn(
                                "w-9 h-9 rounded-[6px] font-mono text-[13px] transition-colors",
                                currentPage === page
                                  ? "bg-pb-court text-white"
                                  : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                              )}
                            >
                              {page}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-pb-hairline font-mono text-[13px] text-pb-muted disabled:opacity-40 hover:border-pb-rule transition-colors"
                      >
                        <CaretRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 bg-pb-surface border border-pb-hairline rounded-[8px]">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-[8px] bg-pb-surface2 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-pb-muted" />
                  </div>
                  <h3 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink mb-2">
                    No leagues found
                  </h3>
                  <p className="font-mono text-[13px] text-pb-muted max-w-md mx-auto mb-8">
                    Try adjusting your search or filters, or create your own league.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        clearFilters();
                      }}
                      className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-10 px-6 hover:bg-pb-surface2 transition-colors"
                    >
                      Clear Filters
                    </button>
                    {isOrganizer && (
                      <Link
                        to="/leagues/create"
                        className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-6 flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        Create a League
                      </Link>
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
