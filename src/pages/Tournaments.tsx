import Layout from "@/components/layout/Layout";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { cn } from "@/lib/utils";
import { tournamentAPI } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays } from "date-fns";
import {
  MapPin, CaretLeft, CaretRight, Trophy, CircleNotch, Radio,
} from "@phosphor-icons/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import WelcomeOnboarding, { getWelcomeDismissed } from "@/components/onboarding/WelcomeOnboarding";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Eyebrow, Pill, PbBtn, Dot, KPI } from "@/components/ui/pb";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";

// ─── Filter chip config ────────────────────────────────────────────────────────

const FILTER_CHIPS = [
  { id: "all",      label: "All" },
  { id: "week",     label: "This week" },
  { id: "month",    label: "This month" },
  { id: "doubles",  label: "Doubles" },
  { id: "singles",  label: "Singles" },
  { id: "mixed",    label: "Mixed" },
  { id: "open",     label: "Open only" },
];

// ─── TournamentRow (desktop table) ────────────────────────────────────────────

interface RowProps {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  rawStartDate: string;
  rawEndDate: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  skillLevel: string;
  entryFee: number;
  organizerName: string;
  fmt: string;
  organizerId: string;
  eventCount: number;
}

function TournamentRow({
  id, name, location, startDate, endDate, rawStartDate,
  playerCount, maxPlayers, status, skillLevel, entryFee,
  organizerName, fmt, organizerId, eventCount,
}: RowProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?._id === organizerId || user?.role === "admin";
  const isLive = status === "in-progress";
  const isOpen = status === "open";
  const fillPct = maxPlayers > 0 ? Math.min(100, (playerCount / maxPlayers) * 100) : 0;
  const isFillingFast = fillPct >= 70;

  const daysUntil = differenceInCalendarDays(new Date(rawStartDate), new Date());
  const countdown =
    daysUntil <= 0 ? "TODAY" :
    daysUntil === 1 ? "TOMORROW" :
    `IN ${daysUntil} DAYS`;

  const parts = location?.split(",") || [];
  const shortLoc =
    parts.length >= 2
      ? `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`
      : location;

  const subline = [organizerName, fmt].filter(Boolean).join(" · ");

  const href = `/tournaments/${id}`;

  return (
    <div
      onClick={() => navigate(href)}
      className="grid items-center gap-4 py-[18px] border-b border-pb-hairline hover:bg-pb-surface2 transition-colors -mx-6 px-6 group cursor-pointer"
      style={{ gridTemplateColumns: "1.4fr 1fr 0.85fr 0.7fr 0.9fr auto" }}
    >
      {/* Tournament name + subline */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-[17px] tracking-[-0.02em] text-pb-ink leading-snug">
            {name}
          </span>
          {isLive && (
            <Pill tone="amber" className="flex items-center gap-1.5 shrink-0">
              <Dot color="amber" size={5} pulse />
              LIVE
            </Pill>
          )}
        </div>
        {subline && (
          <p className="text-[11px] font-mono text-pb-muted mt-0.5 truncate">{subline}</p>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[12px] font-mono text-pb-muted min-w-0">
        <MapPin size={11} className="shrink-0 text-pb-faint" />
        <span className="truncate">{shortLoc}</span>
      </div>

      {/* Date */}
      <div>
        <div className="text-[13px] font-mono text-pb-ink leading-none">{startDate}–{endDate}</div>
        <div className="text-[10px] font-mono text-pb-muted mt-1 tracking-[0.08em] uppercase">
          {countdown}
        </div>
      </div>

      {/* Skill */}
      <div>
        <div className="text-[13px] font-mono text-pb-ink leading-none">{skillLevel || "—"}</div>
        <div className="text-[10px] font-mono text-pb-muted mt-1 tracking-[0.08em] uppercase">SKILL</div>
      </div>

      {/* Spots */}
      <div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className={cn(
            "text-[14px] font-mono font-medium leading-none",
            isFillingFast ? "text-pb-amber" : "text-pb-ink"
          )}>
            {playerCount}
          </span>
          <span className="text-[11px] font-mono text-pb-faint">/ {maxPlayers}</span>
        </div>
        <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden w-full max-w-[120px]">
          <div
            className={cn("h-full rounded-full", isFillingFast ? "bg-pb-amber" : "bg-pb-court")}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link to={href} onClick={(e) => e.stopPropagation()}>
        <PbBtn variant="outline" size="sm" className="shrink-0 whitespace-nowrap">
          {isOwner ? "Manage" : isOpen ? "Enter" : "View"}
          <ArrowRight size={12} />
        </PbBtn>
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Tournaments = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromSignup = (location.state as { fromSignup?: boolean } | null)?.fromSignup;
  const [showWelcome, setShowWelcome] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeChip, setActiveChip] = useState("all");

  // derived filter state from active chip
  const statusFilter  = activeChip === "open" ? "open" : "all";
  const dateFilter    = activeChip === "week" ? "week" : activeChip === "month" ? "month" : "all";
  const formatFilter  = ["doubles", "singles", "mixed"].includes(activeChip) ? activeChip : "all";
  const [sortOption, setSortOption] = useState("soonest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (fromSignup && !getWelcomeDismissed()) setShowWelcome(true);
  }, [fromSignup]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeChip, sortOption]);

  // Main tournament query
  const { data, isLoading, error } = useQuery({
    queryKey: ["tournaments", searchQuery, statusFilter, dateFilter, formatFilter, sortOption, currentPage],
    queryFn: () => {
      const now = new Date();
      let startDateFrom: string | undefined;
      let startDateTo: string | undefined;
      if (dateFilter === "week") {
        startDateFrom = now.toISOString();
        const end = new Date(now); end.setDate(end.getDate() + 7);
        startDateTo = end.toISOString();
      } else if (dateFilter === "month") {
        startDateFrom = now.toISOString();
        const end = new Date(now); end.setDate(end.getDate() + 30);
        startDateTo = end.toISOString();
      }
      return tournamentAPI.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
        limit: itemsPerPage,
        page: currentPage,
        sort: sortOption as "soonest" | "popular",
        format: formatFilter !== "all" ? formatFilter : undefined,
        startDateFrom,
        startDateTo,
      });
    },
  });

  // Separate small query for live count (hero stats)
  const { data: liveData } = useQuery({
    queryKey: ["tournaments-live-count"],
    queryFn: () => tournamentAPI.getAll({ status: "in-progress", limit: 3 }),
    staleTime: 30_000,
  });

  const { data: openData } = useQuery({
    queryKey: ["tournaments-open-count"],
    queryFn: () => tournamentAPI.getAll({ status: "open", limit: 1 }),
    staleTime: 60_000,
  });

  const tournaments   = data?.data || [];
  const totalCount    = data?.total ?? 0;
  const totalPages    = Math.max(1, data?.pages ?? 1);
  const liveCount     = liveData?.total || 0;
  const openCount     = openData?.total || 0;
  const firstLive     = (liveData?.data || [])[0] || null;

  const now = new Date();
  const heroMonth = format(now, "MMM yyyy").toUpperCase();

  const formattedTournaments = tournaments.map((t: any) => ({
    id: t._id,
    name: t.name,
    location: t.location,
    startDate: format(new Date(t.startDate), "MMM d"),
    endDate:   format(new Date(t.endDate),   "MMM d"),
    rawStartDate: t.startDate,
    rawEndDate:   t.endDate,
    playerCount: t.currentPlayers || 0,
    maxPlayers:  t.maxPlayers,
    eventCount:  t.events?.length || 0,
    status:      t.status,
    entryFee:    t.entryFee || 0,
    skillLevel:  t.skillLevel || "All Levels",
    imageUrl:    t.image || t.imageUrl || "",
    organizerId: typeof t.organizer === "string" ? t.organizer : t.organizer?._id,
    organizerName: t.organizer?.name || "",
    fmt:         t.format || "",
  }));

  const getPageNumbers = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <Layout>
      <WelcomeOnboarding open={showWelcome} onOpenChange={setShowWelcome} />
      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ["tournaments"] })}>
        <div className="min-h-screen bg-pb-paper">

          {/* ── Editorial hero ───────────────────────────────────────────── */}
          <section className="border-b border-pb-hairline">
            <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-12">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-14 items-end">

              {/* Left: headline + CTAs */}
              <div>
                <Eyebrow className="mb-5">Browse · {heroMonth} · Pickleball</Eyebrow>
                <h1 className="font-display font-extrabold text-[clamp(52px,6.5vw,88px)] tracking-[-0.045em] leading-[0.95] text-pb-ink mb-6">
                  The draw,<br />
                  <em className="text-pb-court not-italic">resolved.</em>
                </h1>
                <p className="text-[15px] text-pb-ink2 leading-relaxed max-w-md mb-8">
                  Tournament software for organizers who care about the details, and players who care about the play.
                </p>
                <div className="flex flex-wrap gap-3">
                  <PbBtn variant="primary" size="lg" asChild>
                    <Link to="#results">
                      <ArrowRight size={16} /> Browse {openCount > 0 ? openCount : ""} tournaments
                    </Link>
                  </PbBtn>
                  <PbBtn variant="outline" size="lg" asChild>
                    <Link to="/create-tournament">Host yours</Link>
                  </PbBtn>
                </div>
              </div>

              {/* Right: live match teaser + stats grid */}
              <div className="space-y-3">
                {/* Live match teaser */}
                {firstLive ? (
                  <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-4 py-3 flex items-center gap-3">
                    <Dot color="amber" size={8} pulse className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-pb-ink truncate">{firstLive.name}</p>
                      <p className="text-[11px] font-mono text-pb-muted">{firstLive.location}</p>
                    </div>
                    <Link
                      to={`/tournaments/${firstLive._id}`}
                      className="shrink-0 flex items-center gap-1 text-[12px] font-mono text-pb-court hover:text-pb-court-ink transition-colors"
                    >
                      <ArrowRight size={12} /> Watch
                    </Link>
                  </div>
                ) : (
                  <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-4 py-3 flex items-center gap-3">
                    <Radio size={14} className="text-pb-faint shrink-0" />
                    <p className="text-[12px] font-mono text-pb-muted">No live tournaments right now</p>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-px bg-pb-hairline border border-pb-hairline rounded-[6px] overflow-hidden">
                  {[
                    { label: "Live now",    value: liveCount,  sub: "tournaments running" },
                    { label: "Open draws",  value: openCount,  sub: "accepting entries" },
                    { label: "Tournaments", value: totalCount, sub: "on PB Draw" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-pb-surface px-4 py-[18px]">
                      <Eyebrow className="mb-2.5">{label}</Eyebrow>
                      <div className="font-mono text-[30px] font-medium text-pb-ink tracking-[-0.02em] leading-none" style={{ fontFeatureSettings: '"tnum" 1' }}>
                        {value}
                      </div>
                      <div className="text-[11px] font-sans text-pb-muted mt-1.5">{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </section>

          {/* ── Filter chips + sort ─────────────────────────────────────── */}
          <div
            id="results"
            className="sticky top-0 md:top-14 z-20 bg-pb-surface2 border-b border-pb-hairline"
          >
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="flex items-center justify-between gap-4 h-12 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 shrink-0">
                  {FILTER_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setActiveChip(chip.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[12px] font-sans font-medium whitespace-nowrap transition-colors duration-150",
                        activeChip === chip.id
                          ? "bg-pb-ink text-white"
                          : "border border-pb-hairline text-pb-ink2 hover:border-pb-rule bg-pb-surface hover:bg-pb-surface2"
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Search */}
                  <div className="relative hidden sm:block">
                    <Search size={12} strokeWidth={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pb-faint pointer-events-none" />
                    <input
                      placeholder="Search…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 pl-7 pr-2.5 w-36 text-[12px] font-mono bg-pb-surface border border-pb-hairline rounded-full text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule transition-colors"
                    />
                  </div>
                  {/* Sort */}
                  <div className="flex items-center gap-1.5">
                    <Eyebrow>Sort</Eyebrow>
                    <span className="text-pb-hairline">·</span>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="text-[11px] font-mono text-pb-ink bg-transparent border-0 focus:outline-none cursor-pointer uppercase tracking-[0.06em]"
                    >
                      <option value="soonest">Starting soon</option>
                      <option value="popular">Most popular</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Results ──────────────────────────────────────────────────── */}
          <div className="max-w-[1200px] mx-auto px-6 pb-16">

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <CircleNotch size={24} className="animate-spin text-pb-muted" />
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <p className="text-[14px] text-pb-muted mb-4">Failed to load tournaments.</p>
                <PbBtn variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</PbBtn>
              </div>
            ) : formattedTournaments.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block">
                  {/* Column headers */}
                  <div
                    className="grid gap-4 border-b border-pb-rule py-3 -mx-6 px-6"
                    style={{ gridTemplateColumns: "1.4fr 1fr 0.85fr 0.7fr 0.9fr auto" }}
                  >
                    <Eyebrow>Tournament</Eyebrow>
                    <Eyebrow>Location</Eyebrow>
                    <Eyebrow>Date</Eyebrow>
                    <Eyebrow>Skill</Eyebrow>
                    <Eyebrow>Spots</Eyebrow>
                    <span />
                  </div>

                  {/* Rows */}
                  {formattedTournaments.map((t: any) => (
                    <TournamentRow key={t.id} {...t} />
                  ))}
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden grid sm:grid-cols-2 gap-4 pt-6">
                  {formattedTournaments.map((t: any) => (
                    <TournamentCard key={t.id} {...t} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-8 mt-4 border-t border-pb-hairline">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-[6px] border border-pb-hairline text-pb-muted hover:text-pb-ink hover:bg-pb-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <CaretLeft size={14} />
                    </button>
                    {pageNumbers.map((page, i) =>
                      page === "..." ? (
                        <span key={`e-${i}`} className="w-8 text-center text-pb-faint text-[12px] font-mono">…</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={cn(
                            "h-8 w-8 flex items-center justify-center rounded-[6px] text-[12px] font-mono transition-colors",
                            currentPage === page
                              ? "bg-pb-ink text-white"
                              : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface"
                          )}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 flex items-center justify-center rounded-[6px] border border-pb-hairline text-pb-muted hover:text-pb-ink hover:bg-pb-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <CaretRight size={14} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="py-24 text-center">
                <Trophy size={32} className="mx-auto mb-4 text-pb-faint" />
                <h3 className="font-display font-bold text-[22px] tracking-[-0.025em] text-pb-ink mb-2">
                  No tournaments found
                </h3>
                <p className="text-[13px] text-pb-muted mb-6 max-w-xs mx-auto">
                  Try a different filter or be the first to host one.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <PbBtn variant="outline" size="md" onClick={() => { setActiveChip("all"); setSearchQuery(""); }}>
                    Clear Filters
                  </PbBtn>
                  <Link to="/create-tournament">
                    <PbBtn variant="court" size="md">Host a Tournament</PbBtn>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
};

export default Tournaments;
