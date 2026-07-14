import ExportButtons from "@/components/tournament/ExportButtons";
import BracketViewer from "@/components/tournament/BracketViewer";
import PublicRegisteredPlayers from "@/components/tournament/PublicRegisteredPlayers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEventSkillLevel } from "@/types/tournament";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft, ArrowRight, Heart, MapPin, ShareNetwork,
  Trophy, Users, CaretDown, X, QrCode, Graph,
} from "@phosphor-icons/react";
import Layout from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Eyebrow, Pill, PbBtn, PbCard, Dot } from "@/components/ui/pb";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { poolAPI, matchAPI, teamAPI } from "@/services/api";

export interface StatusInfo {
  label: string;
  className: string;
  dotClass: string;
}

export interface PlayerTournamentViewProps {
  tournament: any;
  tournamentId: string;
  statusInfo: StatusInfo;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopySpectatorLink?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function playFormatLabel(pf: string): string {
  if (!pf) return "";
  const map: Record<string, string> = {
    "pool-to-bracket": "Pool → Bracket",
    "round-robin":     "Round-robin",
    "single-elim":     "Single elimination",
    "double-elim":     "Double elimination",
    "pool-single-elim":"Pool → Single elim",
  };
  return map[pf] ?? pf.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Event table row ──────────────────────────────────────────────────────────

function EventRow({
  event, tournamentId, isOpen: tournamentOpen, isLive: tournamentLive,
}: {
  event: any; tournamentId: string; isOpen: boolean; isLive: boolean;
}) {
  const spots    = Math.max(0, (event.maxTeams || 0) - (event.currentTeams || 0));
  const isFull   = spots === 0 && (event.maxTeams || 0) > 0;
  const canEnter = tournamentOpen && !isFull;
  const isLive   = tournamentLive && !isFull;

  return (
    <div
      className="grid items-center gap-4 py-4 px-5 hover:bg-pb-surface2 transition-colors"
      style={{ gridTemplateColumns: "1fr 80px 56px 1fr 96px" }}
    >
      {/* Name + skill + format subline */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-[15px] tracking-[-0.02em] text-pb-ink leading-snug">
            {event.name}
          </span>
          {event.skillLevel && (
            <Pill tone="neutral" className="text-[11px] shrink-0">
              {formatEventSkillLevel(event.skillLevel)}
            </Pill>
          )}
        </div>
        {event.playFormat && (
          <p className="text-[11px] font-mono text-pb-muted mt-0.5">{playFormatLabel(event.playFormat)}</p>
        )}
      </div>

      {/* Spots */}
      <div className="font-mono text-[13px] text-pb-ink whitespace-nowrap">
        {event.currentTeams || 0}/{event.maxTeams || 0}
      </div>

      {/* Price */}
      <div className="font-mono text-[13px] text-pb-ink">
        {event.entryFee > 0 ? `$${event.entryFee}` : "Free"}
      </div>

      {/* Status pill */}
      <div>
        {isLive ? (
          <Pill tone="amber" className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Dot color="amber" size={5} pulse /> LIVE
          </Pill>
        ) : canEnter ? (
          <Pill tone="neutral" className="whitespace-nowrap text-[11px]">
            OPEN · {spots} LEFT
          </Pill>
        ) : isFull ? (
          <Pill tone="ink" mono className="whitespace-nowrap">FULL</Pill>
        ) : null}
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        {isLive ? (
          <Link to={`/tournaments/${tournamentId}?tab=brackets`}>
            <PbBtn variant="outline" size="sm" className="whitespace-nowrap text-[12px]">
              View draw
            </PbBtn>
          </Link>
        ) : canEnter ? (
          <Link to={`/tournaments/${tournamentId}/register`}>
            <PbBtn variant="primary" size="sm" className="whitespace-nowrap text-[12px]">
              Register
            </PbBtn>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PlayerTournamentView({
  tournament,
  tournamentId: id,
  statusInfo,
  isFavorite,
  onToggleFavorite,
  onCopySpectatorLink,
}: PlayerTournamentViewProps) {
  const isLive = tournament.status === "in-progress";
  const isOpen = tournament.status === "open";
  const navigate = useNavigate();

  // Tournament documents don't carry matches/teams directly (those live under each
  // event's pools) — fetch them here so Print/Export has real data instead of the
  // always-empty tournament.matches / tournament.teams.
  const events: any[] = tournament.events || [];
  const { data: exportData } = useQuery({
    queryKey: ["tournament-export-data", tournament._id],
    queryFn: async () => {
      const allMatches: any[] = [];
      const allTeams: any[] = [];

      for (const event of events) {
        try {
          const teamsResponse = await teamAPI.getByEvent(event._id);
          allTeams.push(...(teamsResponse.data || []));
        } catch (error) {
          console.error(`Error fetching teams for event ${event._id}:`, error);
        }

        try {
          const poolsResponse = await poolAPI.getByEvent(event._id);
          const pools = poolsResponse.data || [];
          for (const pool of pools) {
            try {
              const matchesResponse = await matchAPI.getByPool(pool._id);
              const matches = matchesResponse.data || [];
              allMatches.push(
                ...matches.map((m: any) => ({ ...m, event: { _id: event._id, name: event.name } }))
              );
            } catch (error) {
              console.error(`Error fetching matches for pool ${pool._id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching pools for event ${event._id}:`, error);
        }
      }

      return { matches: allMatches, teams: allTeams };
    },
    enabled: events.length > 0,
  });

  // ── Mobile state ────────────────────────────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [partnerName, setPartnerName] = useState("");

  const selectedEvent = selectedEventId
    ? tournament.events?.find((e: any) => e._id === selectedEventId)
    : null;

  const isDoublesEvent = (evt: any) =>
    evt?.format === "doubles" || evt?.format === "mixed-doubles";

  const getEventAbbr = (evt: any): string => {
    const map: Record<string, string> = {
      singles: "SG",
      doubles: "DB",
      "mixed-doubles": "MX",
    };
    return map[evt?.format] ?? (evt?.format?.substring(0, 2).toUpperCase() ?? "");
  };

  const formatPlayFormatShort = (pf: string): string => {
    const map: Record<string, string> = {
      "pool-to-bracket": "POOL → BRACKET",
      "round-robin": "ROUND ROBIN",
      "single-elim": "SINGLE ELIM",
      "double-elim": "DBL ELIM",
      "pool-play": "POOL PLAY",
    };
    return map[pf] ?? pf?.toUpperCase().replace(/-/g, " ") ?? "";
  };

  const handleMobileRegister = () => {
    if (!selectedEvent) return;
    if (isDoublesEvent(selectedEvent)) {
      setShowTeamModal(true);
    } else {
      navigate(`/tournaments/${id}/register/${selectedEvent._id}`);
    }
  };

  const handleTeamCheckout = () => {
    setShowTeamModal(false);
    navigate(`/tournaments/${id}/register/${selectedEvent!._id}`, {
      state: { partnerName: partnerName.trim() || null },
    });
  };

  // Breadcrumb city
  const city = tournament.location?.split(",")[0]?.trim() || tournament.location;

  // Hero eyebrow
  const heroEyebrow = [
    tournament.startDate && tournament.endDate
      ? `${format(new Date(tournament.startDate), "EEE d")} — ${format(new Date(tournament.endDate), "EEE d MMM yyyy")}`.toUpperCase()
      : null,
    tournament.maxPlayers ? `${tournament.maxPlayers} PLAYERS` : null,
    tournament.events?.length ? `${tournament.events.length} EVENTS` : null,
  ].filter(Boolean).join(" · ");

  // Entry fee range
  const fees = (tournament.events || []).map((e: any) => e.entryFee || 0).filter((f: number) => f > 0);
  const minFee = fees.length ? Math.min(...fees) : null;
  const maxFee = fees.length ? Math.max(...fees) : null;
  const feeRange = minFee === null ? "Free" : minFee === maxFee ? `$${minFee}` : `$${minFee} — $${maxFee}`;

  // Event status counts (for card header)
  const openEventsCount    = (tournament.events || []).filter((e: any) => {
    const spots = (e.maxTeams || 0) - (e.currentTeams || 0);
    return isOpen && spots > 0;
  }).length;
  const liveEventsCount    = (tournament.events || []).filter(() => isLive).length;

  // Next 3 upcoming matches
  const upcomingMatches = (tournament.matches || [])
    .filter((m: any) => m.status !== "completed")
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  const TABS = [
    { value: "overview",  label: "Overview" },
    { value: "events",    label: "Events" },
    { value: "brackets",  label: "Draw & Bracket" },
    { value: "players",   label: "Players" },
    { value: "venue",     label: "Venue" },
    { value: "rules",     label: "Rules" },
  ];

  const TAB_TRIGGER =
    "relative pb-3 px-0 py-0 mr-6 bg-transparent rounded-none border-0 text-[13px] font-sans font-medium text-pb-muted capitalize transition-colors duration-150 " +
    "data-[state=active]:bg-transparent data-[state=active]:text-pb-ink data-[state=active]:shadow-none hover:text-pb-ink " +
    "after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-pb-ink after:opacity-0 " +
    "data-[state=active]:after:opacity-100";

  return (
    <Layout variant="minimal">
      <Helmet>
        <title>{tournament.name} | PB Draw</title>
        <meta name="description" content={tournament.description || `Register for ${tournament.name} on PB Draw.`} />
        <meta property="og:title" content={`${tournament.name} | PB Draw`} />
        <meta property="og:description" content={tournament.description || `Register for ${tournament.name} on PB Draw.`} />
        {tournament.image && <meta property="og:image" content={tournament.image} />}
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-pb-paper">

        {/* ══ MOBILE LAYOUT ═════════════════════════════════════════════ */}
        <div className="md:hidden">

          {/* Hero */}
          <div className="relative h-52 bg-pb-court overflow-hidden">
            {tournament.image ? (
              <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 208" preserveAspectRatio="xMidYMid slice" fill="none">
                <rect x="20" y="20" width="350" height="168" rx="2" stroke="rgba(245,242,235,0.2)" strokeWidth="1.5" />
                <rect x="60" y="20" width="270" height="168" stroke="rgba(245,242,235,0.2)" strokeWidth="1.5" />
                <line x1="195" y1="20" x2="195" y2="188" stroke="rgba(245,242,235,0.2)" strokeWidth="1.5" />
                <circle cx="195" cy="104" r="26" stroke="rgba(245,242,235,0.2)" strokeWidth="1.5" />
              </svg>
            )}
            <div className="absolute bottom-4 left-4">
              {isLive ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pb-amber-tint border border-[#E8C9A1]">
                  <Dot color="amber" size={5} pulse />
                  <span className="font-mono text-[10px] font-bold text-[#7C3F0A] uppercase tracking-wide">
                    {tournament.startDate ? `DAY ${Math.max(1, Math.floor((new Date().getTime() - new Date(tournament.startDate).getTime()) / 86400000) + 1)} · LIVE` : "LIVE"}
                  </span>
                </div>
              ) : isOpen ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/25">
                  <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wide">REGISTRATION OPEN</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Tournament info */}
          <div className="px-4 pt-4 pb-3">
            <p className="font-mono text-[10.5px] text-pb-muted uppercase tracking-[0.08em] mb-2">
              {[
                tournament.startDate && tournament.endDate
                  ? `${format(new Date(tournament.startDate), "EEE d")} – ${format(new Date(tournament.endDate), "EEE d MMM").toUpperCase()}`
                  : tournament.startDate
                  ? format(new Date(tournament.startDate), "EEE d MMM yyyy").toUpperCase()
                  : null,
                tournament.location?.split(",")[0]?.trim().toUpperCase() || tournament.location?.toUpperCase(),
                tournament.venue?.courts ? `${tournament.venue.courts} COURTS` : null,
              ].filter(Boolean).join(" · ")}
            </p>
            <h1 className="font-display font-black text-[34px] tracking-[-0.04em] leading-[0.95] text-pb-ink mb-3">
              {tournament.name}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {tournament.format && (
                <span className="px-2.5 py-1 rounded-full border border-pb-hairline font-mono text-[10.5px] text-pb-ink uppercase tracking-[0.06em]">
                  {tournament.format}
                </span>
              )}
              {fees.length > 0 && (
                <span className="px-2.5 py-1 rounded-full border border-pb-hairline font-mono text-[10.5px] text-pb-ink uppercase tracking-[0.06em]">
                  {feeRange} ENTRY
                </span>
              )}
              {isLive && (
                <span className="px-2.5 py-1 rounded-full bg-pb-amber-tint border border-[#E8C9A1] font-mono text-[10.5px] text-[#7C3F0A] uppercase tracking-[0.06em] flex items-center gap-1">
                  <Dot color="amber" size={4} pulse /> LIVE
                </span>
              )}
            </div>
          </div>

          {/* Event selection — full cards */}
          {tournament.events?.length > 0 && (
            <div className="px-4 py-3 border-t border-pb-hairline">
              <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.12em] mb-3">
                {isLive ? "EVENTS" : "YOUR EVENT"}
              </p>

              <div className="flex flex-col gap-2">
                {tournament.events.map((evt: any) => {
                  const isSelected = selectedEventId === evt._id;
                  const spots = Math.max(0, (evt.maxTeams ?? 0) - (evt.currentTeams ?? 0));
                  const isFull = spots === 0 && (evt.maxTeams ?? 0) > 0;
                  return (
                    <button
                      key={evt._id}
                      onClick={() => !isFull && setSelectedEventId(isSelected ? null : evt._id)}
                      disabled={isFull}
                      className={cn(
                        "w-full text-left p-4 rounded-[12px] border transition-all",
                        isSelected
                          ? "border-pb-ink bg-white shadow-sm"
                          : isFull
                          ? "border-pb-hairline bg-pb-surface opacity-50 cursor-not-allowed"
                          : "border-pb-hairline bg-white active:bg-pb-surface"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display font-bold text-[15px] text-pb-ink leading-tight">
                            {evt.name}
                            {evt.skillLevel ? ` · ${evt.skillLevel}` : ""}
                          </p>
                          <p className="font-mono text-[11px] text-pb-muted mt-1">
                            {[
                              `${evt.currentTeams ?? 0} / ${evt.maxTeams ?? "—"} PLAYERS`,
                              evt.playFormat ? formatPlayFormatShort(evt.playFormat) : null,
                            ].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          {isFull ? (
                            <span className="px-2.5 py-1 rounded-full border border-pb-hairline font-mono text-[10px] text-pb-muted uppercase">FULL</span>
                          ) : evt.entryFee > 0 ? (
                            <span className={cn(
                              "px-2.5 py-1 rounded-full font-mono text-[11px] font-medium",
                              isSelected
                                ? "bg-[#FEF3E2] border border-[#F5D79E] text-[#92400E]"
                                : "bg-pb-surface border border-pb-hairline text-pb-muted"
                            )}>
                              ${evt.entryFee}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full border border-pb-hairline font-mono text-[10px] text-pb-muted">FREE</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule (live only — upcoming matches) */}
          {isLive && tournament.matches?.length > 0 && (
            <div className="px-4 py-3 border-t border-pb-hairline">
              <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.12em] mb-3">
                UPCOMING MATCHES
              </p>
              <div className="divide-y divide-pb-hairline">
                {(tournament.matches as any[])
                  .filter((m: any) => m.status !== "completed")
                  .sort((a: any, b: any) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime())
                  .slice(0, 5)
                  .map((match: any, i: number) => {
                    const isMatchLive = match.status === "in-progress";
                    const timeStr = match.startTime ? format(new Date(match.startTime), "HH:mm") : "—";
                    const teamA = match.teams?.[0]?.name || match.team1?.name || "TBD";
                    const teamB = match.teams?.[1]?.name || match.team2?.name || "TBD";
                    return (
                      <div key={i} className={cn("flex items-center gap-4 py-3", isMatchLive && "bg-pb-amber-tint/30 -mx-4 px-4")}>
                        <span className="font-mono text-[13px] text-pb-muted w-10 shrink-0 tabular-nums">{timeStr}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.06em]">
                            {match.round || "MATCH"}
                            {match.courtNumber ? ` · CT ${match.courtNumber}` : ""}
                          </p>
                          <p className="font-display font-bold text-[13px] text-pb-ink truncate mt-0.5">
                            {teamA} vs {teamB}
                          </p>
                        </div>
                        {isMatchLive && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pb-amber-tint border border-[#E8C9A1]">
                            <Dot color="amber" size={4} pulse />
                            <span className="font-mono text-[9px] font-bold text-[#7C3F0A] uppercase">NOW</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Spacer for bottom bar */}
          <div className="h-28" />

          {/* Team selection modal */}
          {showTeamModal && selectedEvent && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowTeamModal(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-pb-paper rounded-t-[16px] px-5 pb-8" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 32px)" }}>
                {/* Handle */}
                <div className="w-10 h-1 bg-pb-hairline rounded-full mx-auto mt-3 mb-6" />

                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="font-mono text-[10px] text-pb-muted uppercase tracking-[0.12em] mb-0.5">Register</p>
                    <h3 className="font-display font-black text-[22px] text-pb-ink tracking-[-0.03em] leading-tight">
                      {selectedEvent.name}
                    </h3>
                    <p className="font-mono text-[11px] text-pb-muted mt-0.5">
                      {selectedEvent.entryFee > 0 ? `$${selectedEvent.entryFee} entry` : "Free entry"}
                      {selectedEvent.skillLevel ? ` · Skill ${selectedEvent.skillLevel}` : ""}
                    </p>
                  </div>
                  <button onClick={() => setShowTeamModal(false)} className="text-pb-muted mt-1">
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-5">
                  <label className="block font-mono text-[10px] text-pb-muted uppercase tracking-[0.12em] mb-2">
                    Partner name (optional)
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Leave blank to find a partner"
                    className="w-full px-4 py-3 border border-pb-hairline rounded-[10px] bg-white text-[14px] text-pb-ink placeholder:text-pb-faint font-sans outline-none focus:border-pb-ink transition-colors"
                  />
                  <p className="font-mono text-[10px] text-pb-faint mt-1.5">
                    You can also find or invite a partner during checkout.
                  </p>
                </div>

                <button
                  onClick={handleTeamCheckout}
                  className="w-full h-[52px] bg-pb-ink text-white rounded-[10px] font-display font-bold text-[15px] flex items-center justify-center gap-2"
                >
                  Continue to checkout
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="md:hidden fixed bottom-[54px] left-0 right-0 bg-pb-paper border-t border-pb-hairline px-4 py-3 z-20 flex gap-3">
          {isLive ? (
            <>
              <Link
                to={`/tournaments/${id}/tickets`}
                className="flex items-center justify-center gap-2 flex-1 h-[46px] rounded-[10px] border border-pb-hairline bg-white font-display font-bold text-[14px] text-pb-ink"
              >
                <QrCode size={16} />
                Ticket
              </Link>
              <Link
                to={`/live/${id}`}
                className="flex items-center justify-center gap-2 flex-[2] h-[46px] rounded-[10px] bg-pb-ink font-display font-bold text-[14px] text-white"
              >
                <Graph size={16} />
                Live draw
              </Link>
            </>
          ) : isOpen ? (
            <button
              onClick={handleMobileRegister}
              disabled={!selectedEventId}
              className={cn(
                "flex-1 h-[46px] rounded-[10px] font-display font-bold text-[15px] text-white bg-pb-ink transition-all",
                !selectedEventId && "opacity-30 blur-[1.5px] cursor-default"
              )}
            >
              {selectedEventId
                ? `Register · ${selectedEvent?.entryFee > 0 ? `$${selectedEvent.entryFee}` : "Free"}`
                : "Select an event"}
            </button>
          ) : (
            <Link
              to={`/live/${id}`}
              className="flex items-center justify-center gap-2 flex-1 h-[46px] rounded-[10px] bg-pb-ink font-display font-bold text-[14px] text-white"
            >
              <Graph size={16} />
              View bracket
            </Link>
          )}
        </div>

        {/* ══ DESKTOP LAYOUT ════════════════════════════════════════════ */}
        <div className="hidden md:block">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-0">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] font-mono text-pb-muted mb-6">
            <Link to="/tournaments" className="hover:text-pb-ink transition-colors">Tournaments</Link>
            <span>›</span>
            <Link to={`/tournaments?search=${encodeURIComponent(city)}`} className="hover:text-pb-ink transition-colors">{city}</Link>
            <span>›</span>
            <span className="text-pb-ink">{tournament.name}</span>
          </nav>

          {/* 2-col hero */}
          <div className="grid lg:grid-cols-[1fr_480px] gap-8 items-start pb-8">

            {/* Left: meta + name + pills */}
            <div>
              {heroEyebrow && (
                <p className="text-[11px] font-mono text-pb-muted tracking-[0.08em] uppercase mb-4">
                  {heroEyebrow}
                </p>
              )}

              <h1 className="font-display font-extrabold text-[clamp(40px,5.5vw,76px)] tracking-[-0.04em] leading-[0.95] text-pb-ink mb-6 break-words">
                {tournament.name}
              </h1>

              {/* Status pills row */}
              <div className="flex flex-wrap items-center gap-2">
                {isLive && (
                  <Pill tone="amber" className="inline-flex items-center gap-1.5">
                    <Dot color="amber" size={6} pulse /> Live now
                  </Pill>
                )}
                {isOpen && (
                  <Pill tone="court">Registration open</Pill>
                )}
                {tournament.format && (
                  <Pill tone="neutral" mono>{tournament.format}</Pill>
                )}
                {tournament.organizer?.name && (
                  <span className="text-[12px] font-mono text-pb-muted">
                    · hosted by {tournament.organizer.name}
                  </span>
                )}

                {/* Utility buttons */}
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={onToggleFavorite}
                    className={cn(
                      "h-7 w-7 rounded-[6px] border flex items-center justify-center transition-colors",
                      isFavorite
                        ? "bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]"
                        : "border-pb-hairline bg-pb-surface text-pb-muted hover:text-pb-ink"
                    )}
                    aria-label="Favourite"
                  >
                    <Heart size={13} weight={isFavorite ? "fill" : "regular"} />
                  </button>
                  <button
                    onClick={onCopySpectatorLink}
                    className="h-7 w-7 rounded-[6px] border border-pb-hairline bg-pb-surface text-pb-muted hover:text-pb-ink flex items-center justify-center transition-colors"
                    aria-label="Share"
                  >
                    <ShareNetwork size={13} />
                  </button>
                  <ExportButtons
                    tournament={tournament}
                    matches={exportData?.matches || []}
                    teams={exportData?.teams || []}
                    events={events}
                    variant="outline"
                  />
                </div>
              </div>
            </div>

            {/* Right: venue photo */}
            <div className="relative aspect-video rounded-[6px] overflow-hidden bg-pb-court-tint border border-pb-hairline">
              {tournament.image ? (
                <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[11px] font-mono text-pb-muted tracking-[0.1em] uppercase">
                    Venue Photo · 16:9
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Tab nav ─────────────────────────────────────────────────── */}
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-pb-hairline">
              <TabsList className="w-full justify-start bg-transparent p-0 gap-0 rounded-none h-auto overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={TAB_TRIGGER}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── Two-col content grid ──────────────────────────────────── */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-8 pt-8 pb-16 items-start">

              {/* ── Left: tab panels ──────────────────────────────────── */}
              <div className="min-w-0 space-y-5">

                {/* Overview */}
                <TabsContent value="overview" className="mt-0 space-y-5">

                  {/* Events card */}
                  {tournament.events?.length > 0 && (
                    <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                      {/* Card header */}
                      <div className="px-5 pt-5 pb-4 border-b border-pb-hairline flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-mono text-pb-muted uppercase tracking-[0.1em]">
                            {tournament.events.length} EVENT{tournament.events.length !== 1 ? "S" : ""}
                            {openEventsCount > 0 && ` · ${openEventsCount} OPEN`}
                            {liveEventsCount > 0 && `, ${liveEventsCount} IN PROGRESS`}
                          </p>
                          <h2 className="font-display font-bold text-[20px] tracking-[-0.025em] text-pb-ink mt-1">
                            Choose your event
                          </h2>
                        </div>
                        <button className="flex items-center gap-1 text-[12px] font-mono text-pb-muted hover:text-pb-ink transition-colors mt-1 shrink-0">
                          All formats <CaretDown size={11} />
                        </button>
                      </div>

                      {/* Column headers */}
                      <div
                        className="grid gap-4 px-5 py-2 border-b border-pb-hairline"
                        style={{ gridTemplateColumns: "1fr 80px 56px 1fr 96px" }}
                      >
                        <Eyebrow>Event</Eyebrow>
                        <Eyebrow>Spots</Eyebrow>
                        <Eyebrow>Fee</Eyebrow>
                        <Eyebrow>Status</Eyebrow>
                        <span />
                      </div>

                      {/* Event rows */}
                      <div className="divide-y divide-pb-hairline">
                        {tournament.events.map((event: any) => (
                          <EventRow
                            key={event._id}
                            event={event}
                            tournamentId={id}
                            isOpen={isOpen}
                            isLive={isLive}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* About */}
                  {tournament.description && (
                    <PbCard padded={false}>
                      <div className="p-5 border-b border-pb-hairline">
                        <Eyebrow>About</Eyebrow>
                      </div>
                      <div className="p-5">
                        <p className="text-[14px] text-pb-ink2 leading-relaxed">{tournament.description}</p>
                      </div>
                    </PbCard>
                  )}

                  {/* Venue card */}
                  {tournament.venue && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PbCard padded={false}>
                        <div className="p-5 border-b border-pb-hairline">
                          <Eyebrow>Venue</Eyebrow>
                        </div>
                        <div className="p-5">
                          <h3 className="font-display font-bold text-[17px] tracking-[-0.02em] text-pb-ink mb-1">
                            {tournament.venue.name}
                          </h3>
                          {tournament.address && (
                            <p className="text-[12px] font-mono text-pb-muted mb-3">{tournament.address}</p>
                          )}
                          {tournament.address && (
                            <button
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tournament.address)}`, "_blank")}
                              className="w-full text-center py-1.5 text-[11px] font-mono text-pb-muted border border-pb-hairline rounded-[4px] hover:bg-pb-surface2 transition-colors uppercase tracking-[0.08em]"
                            >
                              Map · Venue
                            </button>
                          )}
                        </div>
                      </PbCard>

                      {/* Format card */}
                      {tournament.events?.[0]?.playFormat && (
                        <PbCard padded={false}>
                          <div className="p-5 border-b border-pb-hairline">
                            <Eyebrow>Format</Eyebrow>
                          </div>
                          <div className="p-5">
                            <h3 className="font-display font-bold text-[17px] tracking-[-0.02em] text-pb-ink mb-1">
                              {playFormatLabel(tournament.events[0].playFormat)}
                            </h3>
                            {tournament.events[0].description && (
                              <p className="text-[12px] font-mono text-pb-muted mb-3">
                                {tournament.events[0].description}
                              </p>
                            )}
                            <div className="space-y-1.5">
                              {tournament.events[0].poolPlayFormat && (
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="font-mono text-pb-muted">Pool play</span>
                                  <span className="font-mono text-pb-ink">{tournament.events[0].poolPlayFormat}</span>
                                </div>
                              )}
                              {tournament.events[0].bracketPlayFormat && (
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="font-mono text-pb-muted">Bracket</span>
                                  <span className="font-mono text-pb-ink">{tournament.events[0].bracketPlayFormat}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </PbCard>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Events tab */}
                <TabsContent value="events" className="mt-0">
                  {tournament.events?.length > 0 ? (
                    <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
                      <div
                        className="grid gap-4 px-5 py-3 border-b border-pb-hairline"
                        style={{ gridTemplateColumns: "1fr 80px 56px 1fr 96px" }}
                      >
                        <Eyebrow>Event</Eyebrow>
                        <Eyebrow>Spots</Eyebrow>
                        <Eyebrow>Fee</Eyebrow>
                        <Eyebrow>Status</Eyebrow>
                        <span />
                      </div>
                      <div className="divide-y divide-pb-hairline">
                        {tournament.events.map((event: any) => (
                          <EventRow
                            key={event._id}
                            event={event}
                            tournamentId={id}
                            isOpen={isOpen}
                            isLive={isLive}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <Trophy size={28} className="mx-auto mb-3 text-pb-faint" />
                      <p className="text-[13px] text-pb-muted">No events added yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Draw & Bracket */}
                <TabsContent value="brackets" className="mt-0">
                  <BracketViewer tournamentId={id} />
                </TabsContent>

                {/* Players */}
                <TabsContent value="players" className="mt-0">
                  <PublicRegisteredPlayers eventIds={events.map((e: any) => e._id)} />
                </TabsContent>

                {/* Venue */}
                <TabsContent value="venue" className="mt-0">
                  {tournament.venue ? (
                    <PbCard padded={false}>
                      <div className="p-5 border-b border-pb-hairline">
                        <Eyebrow>Venue</Eyebrow>
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-display font-bold text-[20px] tracking-[-0.025em] text-pb-ink">
                          {tournament.venue.name}
                        </h3>
                        {tournament.address && (
                          <p className="text-[13px] font-mono text-pb-muted">{tournament.address}</p>
                        )}
                        {tournament.venue.courts && (
                          <div>
                            <Eyebrow className="mb-1">Courts</Eyebrow>
                            <p className="text-[13px] font-medium text-pb-ink">{tournament.venue.courts} courts</p>
                          </div>
                        )}
                        {tournament.venue.facilities?.length > 0 && (
                          <div>
                            <Eyebrow className="mb-2">Facilities</Eyebrow>
                            <div className="flex flex-wrap gap-1.5">
                              {tournament.venue.facilities.map((f: string, i: number) => (
                                <Pill key={i} tone="neutral">{f}</Pill>
                              ))}
                            </div>
                          </div>
                        )}
                        {tournament.address && (
                          <PbBtn
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tournament.address)}`, "_blank")}
                          >
                            <MapPin size={13} /> View on map
                          </PbBtn>
                        )}
                      </div>
                    </PbCard>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-[13px] text-pb-muted">No venue information available.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Rules */}
                <TabsContent value="rules" className="mt-0">
                  {tournament.rules ? (
                    <PbCard padded={false}>
                      <div className="p-5 border-b border-pb-hairline">
                        <Eyebrow>Rules</Eyebrow>
                      </div>
                      <div className="p-5">
                        <p className="text-[14px] text-pb-ink2 leading-relaxed whitespace-pre-wrap">{tournament.rules}</p>
                      </div>
                    </PbCard>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-[13px] text-pb-muted">No rules posted yet.</p>
                    </div>
                  )}
                </TabsContent>
              </div>

              {/* ── Right sidecar ──────────────────────────────────────── */}
              <div className="space-y-4 lg:sticky lg:top-[80px]">

                {/* WHEN card */}
                <PbCard padded={false}>
                  <div className="p-5">
                    <Eyebrow className="mb-3">When</Eyebrow>
                    <div className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink leading-tight">
                      {tournament.startDate && tournament.endDate && (
                        <>
                          {format(new Date(tournament.startDate), "EEE d")}
                          {" — "}
                          {format(new Date(tournament.endDate), "EEE d MMM")}
                        </>
                      )}
                    </div>
                    {tournament.checkInTime && (
                      <p className="text-[11px] font-mono text-pb-muted mt-1.5">
                        Check-in opens {tournament.checkInTime}
                      </p>
                    )}
                  </div>

                  {/* Entry + Purse */}
                  {(minFee !== null || tournament.purse) && (
                    <div className="border-t border-pb-hairline p-5 grid grid-cols-2 gap-4">
                      {minFee !== null && (
                        <div>
                          <Eyebrow className="mb-1.5">Entry</Eyebrow>
                          <div className="font-mono text-[18px] font-medium text-pb-ink leading-none">
                            {feeRange}
                          </div>
                        </div>
                      )}
                      {tournament.purse > 0 && (
                        <div>
                          <Eyebrow className="mb-1.5">Purse</Eyebrow>
                          <div className="font-mono text-[18px] font-medium text-pb-ink leading-none">
                            ${Number(tournament.purse).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA buttons */}
                  <div className="border-t border-pb-hairline p-5 space-y-2">
                    {isOpen && (
                      <Link to={`/tournaments/${id}/register`}>
                        <PbBtn variant="primary" size="md" full>
                          <ArrowRight size={14} /> Register · find a partner
                        </PbBtn>
                      </Link>
                    )}
                    {isLive && (
                      <Link to={`/tournaments/${id}?tab=brackets`}>
                        <PbBtn variant="outline" size="md" full>
                          View live bracket
                        </PbBtn>
                      </Link>
                    )}
                    <PbBtn variant="ghost" size="md" full onClick={onCopySpectatorLink}>
                      <ShareNetwork size={14} /> Share spectator link
                    </PbBtn>
                  </div>
                </PbCard>

                {/* Next 3 matches */}
                {upcomingMatches.length > 0 && (
                  <PbCard padded={false}>
                    <div className="p-5 border-b border-pb-hairline">
                      <Eyebrow>Next {upcomingMatches.length} matches</Eyebrow>
                    </div>
                    <div className="divide-y divide-pb-hairline">
                      {upcomingMatches.map((match: any, i: number) => {
                        const timeLabel = match.startTime
                          ? format(new Date(match.startTime), "HH:mm")
                          : "—";
                        const teamA = match.teams?.[0]?.name || match.team1?.name || "TBD";
                        const teamB = match.teams?.[1]?.name || match.team2?.name || "TBD";
                        const court = match.court || match.courtNumber || null;
                        const matchIsLive = match.status === "in-progress";

                        return (
                          <div key={i} className="flex items-center gap-3 px-5 py-3">
                            <span className="font-mono text-[12px] text-pb-muted w-10 shrink-0">{timeLabel}</span>
                            {court && (
                              <span className="font-mono text-[10px] text-pb-ink2 border border-pb-hairline rounded-[4px] px-1.5 py-0.5 shrink-0 uppercase">
                                CT {court}
                              </span>
                            )}
                            {matchIsLive && <Dot color="amber" size={6} pulse className="shrink-0" />}
                            <span className="text-[12px] text-pb-ink2 truncate">
                              {teamA} v {teamB}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </PbCard>
                )}

                {/* Organizer */}
                <PbCard padded={false}>
                  <div className="p-5 border-b border-pb-hairline">
                    <Eyebrow>Organizer</Eyebrow>
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-[13px] font-medium text-pb-ink">{tournament.organizer?.name || "Unknown"}</p>
                    {tournament.organizer?.email && (
                      <a
                        href={`mailto:${tournament.organizer.email}`}
                        className="block text-[12px] font-mono text-pb-court hover:underline"
                      >
                        {tournament.organizer.email}
                      </a>
                    )}
                  </div>
                </PbCard>
              </div>
            </div>
          </Tabs>
        </div>
        </div>{/* end desktop wrapper */}
      </div>
    </Layout>
  );
}
