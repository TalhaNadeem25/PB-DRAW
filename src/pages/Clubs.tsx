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
import { clubAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaretLeft,
  CaretRight,
  Funnel,
  MagnifyingGlass,
  UsersThree,
  MapPin,
  Users,
  Plus,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

const joinTypeLabel: Record<string, string> = {
  open: "Open",
  request: "Request to Join",
  "invite-only": "Invite Only",
};

const joinTypeColors: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
  request: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
  "invite-only": "bg-pb-surface2 text-pb-muted border border-pb-hairline",
};

// ─── Club Card ─────────────────────────────────────────────────────────────
function ClubCard({ club }: { club: any }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const membership = isAuthenticated
    ? club.members?.find((m: any) => (m.user?._id ?? m.user) === user?._id)
    : null;
  const isAdmin = membership?.status === "active" && membership?.role === "admin";
  const isMember = membership?.status === "active";
  const isPending = membership?.status === "pending";

  const activeMembers = club.members?.filter((m: any) => m.status === "active") ?? [];
  const memberCount = activeMembers.length;
  const maxMembers = club.settings?.maxMembers || 0;

  const locationParts = club.location?.split(",") || [];
  const shortLocation =
    locationParts.length >= 2
      ? `${locationParts[0].trim()}, ${locationParts[locationParts.length - 1].trim()}`
      : club.location;

  const joinMutation = useMutation({
    mutationFn: () => clubAPI.join(club._id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      toast({ title: res.message || "Success" });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't join club",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="bg-pb-surface border border-pb-hairline rounded-[8px] flex flex-col overflow-hidden h-full">
      <div className="p-4 pb-3 flex items-start justify-between gap-2">
        <h4 className="font-display font-bold text-[17px] leading-tight text-pb-ink line-clamp-2 flex-1">
          {club.name}
        </h4>
        <span
          className={cn(
            "shrink-0 text-[10px] font-mono uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px]",
            joinTypeColors[club.joinType] ?? joinTypeColors.open
          )}
        >
          {joinTypeLabel[club.joinType] ?? club.joinType}
        </span>
      </div>

      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {shortLocation && (
          <span className="font-mono text-[12px] text-pb-muted flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {shortLocation}
          </span>
        )}
        <span className="font-mono text-[12px] text-pb-muted flex items-center gap-1">
          <Users className="w-3 h-3" />
          {memberCount} member{memberCount === 1 ? "" : "s"}
          {maxMembers > 0 ? ` / ${maxMembers}` : ""}
        </span>
      </div>

      {club.description && (
        <div className="px-4 pb-3">
          <p className="font-mono text-[12px] text-pb-muted line-clamp-2">{club.description}</p>
        </div>
      )}

      <div className="h-px bg-pb-hairline mt-auto" />

      <div className="p-4">
        {isAdmin || isMember ? (
          <Link
            to={`/clubs/${club._id}`}
            className="w-full bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] py-2.5 text-center block transition-opacity hover:opacity-90"
          >
            View Details
          </Link>
        ) : isPending ? (
          <button
            disabled
            className="w-full border border-pb-hairline text-pb-muted rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] py-2.5 text-center cursor-not-allowed"
          >
            Request Pending
          </button>
        ) : club.joinType === "invite-only" ? (
          <Link
            to={`/clubs/${club._id}`}
            className="w-full border border-pb-hairline text-pb-ink rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] py-2.5 text-center block hover:bg-pb-surface2 transition-colors"
          >
            View Details
          </Link>
        ) : (
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast({ title: "Sign in to join a club" });
                return;
              }
              joinMutation.mutate();
            }}
            disabled={joinMutation.isPending}
            className="w-full bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] py-2.5 text-center transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {joinMutation.isPending
              ? "..."
              : club.joinType === "request"
              ? "Request to Join"
              : "Join Club"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Clubs() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [joinTypeFilter, setJoinTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, joinTypeFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clubs", searchQuery, joinTypeFilter, currentPage],
    queryFn: () =>
      clubAPI.getAll({
        search: searchQuery || undefined,
        joinType: joinTypeFilter !== "all" ? joinTypeFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
      }),
  });

  const clubs = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pages ?? 1);

  const activeFiltersCount = joinTypeFilter !== "all" ? 1 : 0;

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

  const clearFilters = () => setJoinTypeFilter("all");

  const FilterOptions = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
          Join Type
        </h3>
        <div className="space-y-2">
          {[
            { val: "all", label: "All Clubs" },
            { val: "open", label: "Open" },
            { val: "request", label: "Request to Join" },
            { val: "invite-only", label: "Invite Only" },
          ].map(({ val, label }) => (
            <label
              key={val}
              onClick={() => setJoinTypeFilter(val)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  joinTypeFilter === val
                    ? "border-pb-court bg-pb-court"
                    : "border-pb-hairline group-hover:border-pb-court"
                )}
              >
                {joinTypeFilter === val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className="font-mono text-[13px] text-pb-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ["clubs"] })}>
        <div className="min-h-screen bg-pb-paper pt-24 pb-12">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="font-display font-extrabold text-[40px] tracking-[-0.04em] text-pb-ink leading-none">
                  Find Clubs
                </h1>
                {isAuthenticated && (
                  <Link
                    to="/clubs/create"
                    className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 shrink-0 hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    Create Club
                  </Link>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative max-w-2xl">
                  <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pb-muted" />
                  <Input
                    placeholder="Search by club name or location"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-pb-surface border-pb-hairline font-mono text-[13px] rounded-[6px] focus-visible:ring-pb-court"
                  />
                </div>

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

              <main className="flex-1 min-w-0 w-full">
                <div className="hidden md:flex items-center justify-between mb-6">
                  <div className="font-mono text-[12px] text-pb-muted uppercase tracking-[0.06em]">
                    Showing {clubs.length} of {totalCount} results
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
                      Error loading clubs
                    </h3>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 hover:opacity-90 transition-opacity"
                    >
                      Retry
                    </button>
                  </div>
                ) : clubs.length > 0 ? (
                  <div className="space-y-10">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clubs.map((club: any, index: number) => (
                        <div
                          key={club._id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                        >
                          <ClubCard club={club} />
                        </div>
                      ))}
                    </div>

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
                      <UsersThree className="w-8 h-8 text-pb-muted" />
                    </div>
                    <h3 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink mb-2">
                      No clubs found
                    </h3>
                    <p className="font-mono text-[13px] text-pb-muted max-w-md mx-auto mb-8">
                      Try adjusting your search or filters, or start your own club.
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
                      {isAuthenticated && (
                        <Link
                          to="/clubs/create"
                          className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-6 flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          Create a Club
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
