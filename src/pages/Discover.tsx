import Layout from "@/components/layout/Layout";
import { Eyebrow, Pill, PbCard, Dot, SectionHead } from "@/components/ui/pb";
import { useAuth } from "@/contexts/AuthContext";
import { tournamentAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MapPin, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CircleNotch } from "@phosphor-icons/react";

// ── Filter chip config ────────────────────────────────────────────────────────
const STATUS_CHIPS = [
  { label: "All",         value: "all" },
  { label: "Open",        value: "open" },
  { label: "Live now",    value: "in-progress" },
  { label: "Upcoming",    value: "upcoming" },
  { label: "Completed",   value: "completed" },
];

const SKILL_CHIPS = [
  { label: "Any level",   value: "all" },
  { label: "2.5",         value: "2.5" },
  { label: "3.0",         value: "3.0" },
  { label: "3.5",         value: "3.5" },
  { label: "4.0",         value: "4.0" },
  { label: "4.5",         value: "4.5" },
  { label: "5.0",         value: "5.0" },
];

// ── TournamentRow ─────────────────────────────────────────────────────────────
function TournamentRow({ t }: { t: any }) {
  const navigate = useNavigate();
  const isLive      = t.status === "in-progress";
  const isWaitlist  = t.status === "closed";
  const spotsLeft   = t.maxPlayers - (t.currentPlayers || 0);
  const filled      = Math.min(((t.currentPlayers || 0) / t.maxPlayers) * 100, 100);
  const spotsUrgent = spotsLeft <= 8;

  const skillLevels = t.events?.length
    ? [...new Set(t.events.map((e: any) => e.skillLevel).filter(Boolean))].slice(0, 2).join(", ")
    : "—";

  const minFee = t.events?.length
    ? Math.min(...t.events.map((e: any) => e.entryFee ?? 0))
    : null;

  return (
    <div
      onClick={() => navigate(`/tournaments/${t._id}`)}
      className="group grid items-center gap-3.5 py-[18px] border-b border-pb-hairline cursor-pointer hover:bg-pb-surface2 transition-colors px-1 -mx-1 rounded-[4px]"
      style={{ gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr" }}
    >
      {/* Name + pills */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-[18px] tracking-[-0.025em] text-pb-ink leading-tight truncate">
            {t.name}
          </span>
          {isLive && (
            <Pill tone="amber" mono>
              <Dot size={5} pulse /> LIVE
            </Pill>
          )}
          {isWaitlist && <Pill tone="outline" mono>WAITLIST</Pill>}
        </div>
        <span className="text-[12px] text-pb-muted truncate">
          {t.organizer?.name ?? "Organizer"} · {t.events?.length ?? 0} event{t.events?.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[13px] text-pb-ink2 min-w-0">
        <MapPin size={13} className="text-pb-muted shrink-0" />
        <span className="truncate">{t.location}</span>
      </div>

      {/* Date */}
      <div className="font-mono text-[12px] text-pb-ink2 tracking-[0.02em]">
        <div>{format(new Date(t.startDate), "MMM d")} – {format(new Date(t.endDate), "MMM d")}</div>
        <div className="text-[10px] text-pb-faint tracking-[0.14em] uppercase mt-0.5">
          {format(new Date(t.startDate), "yyyy")}
        </div>
      </div>

      {/* Skill */}
      <div>
        <div className="font-mono text-[13px] font-medium text-pb-ink">{skillLevels}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-pb-faint mt-0.5">SKILL</div>
      </div>

      {/* Spots */}
      <div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-mono text-[14px] font-medium"
            style={{ color: spotsUrgent ? "var(--pb-amber)" : "var(--pb-ink)" }}
          >
            {spotsLeft}
          </span>
          <span className="font-mono text-[11px] text-pb-faint">/ {t.maxPlayers}</span>
        </div>
        <div className="h-[3px] bg-pb-hairline rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${filled}%`,
              background: spotsUrgent ? "var(--pb-amber)" : "var(--pb-court)",
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/tournaments/${t._id}`); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-pb-rule text-pb-ink2 rounded-[6px] hover:border-pb-ink hover:text-pb-ink transition-colors whitespace-nowrap"
        >
          {minFee !== null ? `$${minFee} ·` : ""} Enter
          <ArrowRight size={12} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

// ── Mobile tournament card ────────────────────────────────────────────────────
function TournamentCard({ t }: { t: any }) {
  const navigate  = useNavigate();
  const isLive    = t.status === "in-progress";
  const spotsLeft = t.maxPlayers - (t.currentPlayers || 0);
  const filled    = Math.min(((t.currentPlayers || 0) / t.maxPlayers) * 100, 100);

  return (
    <PbCard
      padded={false}
      className="cursor-pointer hover:border-pb-rule transition-colors"
      onClick={() => navigate(`/tournaments/${t._id}`)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display font-bold text-[17px] tracking-[-0.02em] text-pb-ink">{t.name}</span>
              {isLive && <Pill tone="amber" mono><Dot size={5} pulse /> LIVE</Pill>}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-pb-muted">
              <MapPin size={11} />
              {t.location}
            </div>
          </div>
          <div className="font-mono text-[12px] text-pb-ink2 shrink-0 text-right">
            {format(new Date(t.startDate), "MMM d")}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-pb-hairline">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[13px] font-medium text-pb-ink">{spotsLeft}</span>
            <span className="font-mono text-[11px] text-pb-faint">/ {t.maxPlayers} spots</span>
          </div>
          <div className="h-[3px] w-24 bg-pb-hairline rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-pb-court" style={{ width: `${filled}%` }} />
          </div>
        </div>
      </div>
    </PbCard>
  );
}

// ── Discover ──────────────────────────────────────────────────────────────────
const Discover = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [skillFilter, setSkillFilter]       = useState("all");

  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ["discover-tournaments"],
    queryFn:  () => tournamentAPI.getAll(),
    refetchInterval: 30000,
  });

  const tournaments: any[] = tournamentsData?.data ?? [];

  // Derived stats
  const liveCount = tournaments.filter((t) => t.status === "in-progress").length;
  const openCount = tournaments.filter((t) => t.status === "open").length;

  // Filter
  const filtered = tournaments
    .filter((t) => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.location?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (skillFilter !== "all" && !t.events?.some((e: any) => e.skillLevel?.toString() === skillFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      const p: any = { "in-progress": 1, open: 2, upcoming: 3, completed: 4 };
      if ((p[a.status] ?? 99) !== (p[b.status] ?? 99)) return (p[a.status] ?? 99) - (p[b.status] ?? 99);
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper">

        {/* ── Editorial hero ──────────────────────────────────────────────── */}
        <div className="border-b border-pb-hairline">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-8 pt-12 pb-10">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-end">

              {/* Left */}
              <div>
                <Eyebrow className="mb-5">Edition 12 · May 2026 · West Coast</Eyebrow>
                <h1
                  className="font-display font-extrabold text-pb-ink leading-[0.95]"
                  style={{ fontSize: "clamp(48px, 6vw, 88px)", letterSpacing: "-0.045em" }}
                >
                  The draw,<br />
                  <span className="italic font-bold" style={{ color: "var(--pb-court)" }}>
                    resolved.
                  </span>
                </h1>
                <p className="text-[15px] text-pb-ink2 mt-5 leading-[1.5] max-w-[520px]">
                  Tournament software for organizers who care about the details, and players who
                  care about the play. Built around the bracket.
                </p>
                <div className="flex gap-3 mt-7">
                  <button
                    onClick={() => document.getElementById("tournament-list")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium bg-pb-ink text-white rounded-[6px] hover:opacity-90 transition-opacity"
                  >
                    Browse {openCount > 0 ? openCount : ""} tournaments
                    <ArrowRight size={14} strokeWidth={1.8} />
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={() => navigate("/create-tournament")}
                      className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium border border-pb-rule text-pb-ink rounded-[6px] hover:bg-pb-surface2 transition-colors"
                    >
                      Host yours
                    </button>
                  )}
                </div>
              </div>

              {/* Right: stats + live card */}
              <div className="flex flex-col gap-2.5">
                {/* Live match teaser */}
                {liveCount > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-pb-surface border border-pb-hairline rounded-[6px]">
                    <div className="flex items-center gap-3">
                      <Dot size={7} pulse />
                      <div>
                        <div className="text-[13px] font-medium text-pb-ink">
                          {liveCount} tournament{liveCount > 1 ? "s" : ""} happening right now
                        </div>
                        <div className="text-[11.5px] text-pb-muted mt-0.5">Live brackets updating</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setStatusFilter("in-progress")}
                      className="text-[12px] text-pb-muted hover:text-pb-ink flex items-center gap-1 transition-colors"
                    >
                      Watch <ArrowRight size={11} strokeWidth={1.8} />
                    </button>
                  </div>
                )}

                {/* Stats grid */}
                <div
                  className="grid grid-cols-3 bg-pb-hairline rounded-[6px] overflow-hidden"
                  style={{ gap: 1 }}
                >
                  {[
                    { label: "Live now",        value: String(liveCount || "—") },
                    { label: "Open draws",       value: String(openCount || "—") },
                    { label: "Total events",     value: String(tournaments.length || "—") },
                  ].map((s) => (
                    <div key={s.label} className="bg-pb-surface px-4 py-[18px]">
                      <Eyebrow className="mb-2.5">{s.label}</Eyebrow>
                      <div
                        className="font-mono font-medium text-pb-ink leading-none"
                        style={{ fontSize: 30, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum" 1' }}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="sticky top-14 z-30 bg-pb-surface2 border-b border-pb-hairline">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-8 py-3 flex flex-wrap items-center gap-2">

            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" strokeWidth={1.6} />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-pb-surface border border-pb-hairline rounded-[6px] text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule"
              />
            </div>

            {/* Status chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setStatusFilter(chip.value)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors",
                    statusFilter === chip.value
                      ? "bg-pb-ink text-white border-pb-ink"
                      : "bg-pb-surface text-pb-ink2 border-pb-hairline hover:border-pb-rule"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-pb-hairline hidden sm:block" />

            {/* Skill chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {SKILL_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setSkillFilter(chip.value)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors",
                    skillFilter === chip.value
                      ? "bg-pb-court-tint text-pb-court-ink border-[#CCDAC9]"
                      : "bg-pb-surface text-pb-ink2 border-pb-hairline hover:border-pb-rule"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <span className="ml-auto font-mono text-[11px] text-pb-muted tracking-[0.1em] hidden lg:block">
              {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
            </span>
          </div>
        </div>

        {/* ── Tournament list ──────────────────────────────────────────────── */}
        <div id="tournament-list" className="max-w-[1440px] mx-auto px-6 sm:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <CircleNotch className="w-8 h-8 animate-spin text-pb-muted" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="font-display font-bold text-[22px] text-pb-ink mb-2">No tournaments found</div>
              <p className="text-[14px] text-pb-muted">
                {searchQuery || statusFilter !== "all" || skillFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Check back soon for new tournaments"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                {/* Column headers */}
                <div
                  className="grid gap-3.5 pb-3 border-b border-pb-rule"
                  style={{ gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr", paddingLeft: 4, paddingRight: 4 }}
                >
                  {["Tournament", "Location", "Date", "Skill", "Spots", ""].map((h) => (
                    <div
                      key={h}
                      className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-pb-muted"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {filtered.map((t) => (
                  <TournamentRow key={t._id} t={t} />
                ))}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {filtered.map((t) => (
                  <TournamentCard key={t._id} t={t} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
