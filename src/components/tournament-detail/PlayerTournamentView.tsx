import ExportButtons from "@/components/tournament/ExportButtons";
import TournamentSchedule from "@/components/tournament/TournamentSchedule";
import BracketViewer from "@/components/tournament/BracketViewer";
import RegisteredPlayers from "@/components/tournament/RegisteredPlayers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEventSkillLevel } from "@/types/tournament";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft, ArrowRight, Heart, MapPin, ShareNetwork,
  Trophy, Users, CaretDown,
} from "@phosphor-icons/react";
import Layout from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Eyebrow, Pill, PbBtn, PbCard, Dot } from "@/components/ui/pb";

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
    { value: "schedule",  label: "Schedule" },
    { value: "players",   label: "Players" },
    { value: "venue",     label: "Venue" },
    { value: "rules",     label: "Rules" },
  ];

  const TAB_TRIGGER =
    "relative pb-3 px-0 mr-6 bg-transparent rounded-none border-0 text-[13px] font-sans font-medium text-pb-muted capitalize transition-colors duration-150 " +
    "data-[state=active]:text-pb-ink data-[state=active]:shadow-none hover:text-pb-ink " +
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
                    matches={tournament.matches || []}
                    teams={tournament.teams || []}
                    events={tournament.events || []}
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

                {/* Schedule */}
                <TabsContent value="schedule" className="mt-0">
                  <TournamentSchedule tournamentId={id} tournamentStartDate={tournament.startDate} />
                </TabsContent>

                {/* Players */}
                <TabsContent value="players" className="mt-0">
                  <RegisteredPlayers tournamentId={id} />
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
      </div>
    </Layout>
  );
}
