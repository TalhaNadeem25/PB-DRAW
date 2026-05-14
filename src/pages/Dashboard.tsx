import Layout from "@/components/layout/Layout";
import CancelRegistrationDialog from "@/components/registration/CancelRegistrationDialog";
import OrganizerDashboard from "@/components/dashboard/OrganizerDashboard";
import PlayerDashboard from "@/components/dashboard/PlayerDashboard";
import NewsletterSubscribersPanel from "@/components/dashboard/NewsletterSubscribersPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { Warning, Bell, Gear, Article, ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eyebrow, PbAvatar, Pill, PbBtn } from "@/components/ui/pb";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState<{
    eventId: string;
    eventName: string;
    tournamentName: string;
    isDoubles?: boolean;
    partnerName?: string;
  } | null>(null);

  const {
    dashboardLoading,
    stats,
    winRate,
    myTournaments,
    activeTournaments,
    myEventRegistrations,
    liveMatchesCount,
    recommendedTournaments,
    myTeams,
    pendingInvitations,
    ticketsData,
    waitlistData,
    tournamentsLoading,
    teamsLoading,
    ticketsLoading,
  } = useDashboardData(user ?? null);

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <div className="w-full max-w-md bg-pb-surface border border-pb-hairline rounded-[6px] p-8 text-center">
            <Warning className="w-10 h-10 mx-auto mb-4 text-pb-muted" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-pb-ink mb-2">Please log in</h2>
            <p className="text-[13px] font-mono text-pb-muted mb-6">You need to be logged in to view your dashboard.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-10 px-6 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[13px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isOrganizer = user.role === "organizer" || user.role === "admin";
  const isSuperAdmin = user.email === "nadeemtalha24@gmail.com";

  // Mobile date string
  const now = new Date();
  const dayStr = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper">

        {/* ── Mobile header (< md) ── */}
        <div className="md:hidden sticky top-0 z-30 bg-pb-paper border-b border-pb-hairline px-4 pb-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow className="mb-0.5">{dayStr} · {dateStr}</Eyebrow>
              <h1 className="font-display font-extrabold text-[26px] tracking-[-0.03em] text-pb-ink leading-none">
                Hey, {user?.name?.split(" ")[0] || "there"}.
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-pb-hairline bg-pb-surface text-pb-muted">
                <Bell size={15} />
              </button>
              <Link to="/profile">
                <PbAvatar name={user?.name || "U"} size={36} tone="ink" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Mobile body content (< md) ── */}
        {!dashboardLoading && (
          <div className="md:hidden pb-20">

            {/* Next match card */}
            {myEventRegistrations.length > 0 && (
              <div className="mx-4 mt-4 rounded-[10px] p-[18px] bg-pb-ink">
                <Eyebrow className="text-pb-amber mb-2">NEXT UP</Eyebrow>
                <p className="font-display font-extrabold text-[20px] tracking-[-0.03em] text-white leading-tight mb-1">
                  {myEventRegistrations[0].tournamentName}
                </p>
                {myEventRegistrations[0].eventName && (
                  <p className="font-mono text-[12px] text-white/60 mb-4">
                    {myEventRegistrations[0].eventName}
                    {myEventRegistrations[0].partnerName
                      ? ` · w/ ${myEventRegistrations[0].partnerName}`
                      : ""}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {myEventRegistrations[0].tournamentLocation && (
                      <span className="font-mono text-[11px] text-white/50 truncate max-w-[140px]">
                        {myEventRegistrations[0].tournamentLocation}
                      </span>
                    )}
                    {myEventRegistrations[0].tournamentStartDate && (
                      <span className="font-mono text-[11px] text-white/50">
                        · {format(new Date(myEventRegistrations[0].tournamentStartDate), "MMM d")}
                      </span>
                    )}
                  </div>
                  <PbBtn
                    variant="amber"
                    size="sm"
                    asChild
                  >
                    <Link to={`/tournaments/${myEventRegistrations[0].tournamentId}`} className="flex items-center gap-1.5">
                      Open <ArrowRight size={12} />
                    </Link>
                  </PbBtn>
                </div>
              </div>
            )}

            {/* KPI row */}
            {!isOrganizer && (
              <div className="grid grid-cols-3 gap-2 mx-4 mt-3">
                {[
                  { label: "PLAYED", value: stats.matchesPlayed ?? 0 },
                  { label: "WON", value: stats.matchesWon ?? 0 },
                  { label: "WIN %", value: `${winRate}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-pb-surface border border-pb-hairline rounded-[8px] p-3">
                    <p className="font-mono text-[17px] font-semibold text-pb-court leading-none mb-1">
                      {value}
                    </p>
                    <p className="font-mono text-[9.5px] text-pb-muted uppercase tracking-[0.1em]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming events */}
            {myEventRegistrations.length > 0 && (
              <div className="mt-5">
                <div className="px-4 mb-2">
                  <Eyebrow>UPCOMING</Eyebrow>
                </div>
                <div className="border-t border-pb-hairline">
                  {myEventRegistrations.slice(0, 6).map((reg: any) => {
                    const startDate = reg.tournamentStartDate
                      ? new Date(reg.tournamentStartDate)
                      : null;
                    const statusTone =
                      reg.tournamentStatus === "in-progress"
                        ? "amber"
                        : reg.tournamentStatus === "open"
                        ? "court"
                        : "neutral";
                    const statusLabel =
                      reg.tournamentStatus === "in-progress"
                        ? "LIVE"
                        : reg.tournamentStatus === "open"
                        ? "OPEN"
                        : reg.tournamentStatus?.toUpperCase() ?? "UPCOMING";
                    return (
                      <Link
                        key={reg.eventId}
                        to={`/tournaments/${reg.tournamentId}`}
                        className="flex items-center gap-3 px-4 py-3 border-b border-pb-hairline active:bg-pb-surface2"
                      >
                        <div className="w-[38px] shrink-0 text-center">
                          {startDate ? (
                            <>
                              <p className="font-mono text-[9px] uppercase text-pb-muted tracking-[0.08em] leading-none mb-0.5">
                                {format(startDate, "MMM")}
                              </p>
                              <p className="font-mono text-[17px] font-semibold text-pb-ink leading-none">
                                {format(startDate, "d")}
                              </p>
                            </>
                          ) : (
                            <p className="font-mono text-[11px] text-pb-faint">TBD</p>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-medium text-pb-ink truncate leading-snug">
                            {reg.tournamentName}
                          </p>
                          <p className="font-mono text-[11px] text-pb-muted truncate">
                            {reg.eventName}
                            {reg.partnerName ? ` · w/ ${reg.partnerName}` : ""}
                          </p>
                        </div>
                        <Pill tone={statusTone as any} mono className="shrink-0 text-[9px]">
                          {statusLabel}
                        </Pill>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medals / form row */}
            {!isOrganizer &&
              (stats.goldMedals > 0 ||
                stats.silverMedals > 0 ||
                stats.bronzeMedals > 0) && (
                <div className="mx-4 mt-5">
                  <Eyebrow className="mb-2">MEDALS</Eyebrow>
                  <div className="flex gap-3">
                    {stats.goldMedals > 0 && (
                      <div className="flex items-center gap-1.5 bg-pb-surface border border-pb-hairline rounded-[8px] px-3 py-2">
                        <span className="text-[15px]">🥇</span>
                        <span className="font-mono text-[13px] font-semibold text-pb-ink">
                          {stats.goldMedals}
                        </span>
                      </div>
                    )}
                    {stats.silverMedals > 0 && (
                      <div className="flex items-center gap-1.5 bg-pb-surface border border-pb-hairline rounded-[8px] px-3 py-2">
                        <span className="text-[15px]">🥈</span>
                        <span className="font-mono text-[13px] font-semibold text-pb-ink">
                          {stats.silverMedals}
                        </span>
                      </div>
                    )}
                    {stats.bronzeMedals > 0 && (
                      <div className="flex items-center gap-1.5 bg-pb-surface border border-pb-hairline rounded-[8px] px-3 py-2">
                        <span className="text-[15px]">🥉</span>
                        <span className="font-mono text-[13px] font-semibold text-pb-ink">
                          {stats.bronzeMedals}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Empty state for players with no registrations */}
            {!isOrganizer && myEventRegistrations.length === 0 && !dashboardLoading && (
              <div className="mx-4 mt-8 rounded-[10px] border border-pb-hairline bg-pb-surface p-6 text-center">
                <p className="font-display font-bold text-[15px] text-pb-ink mb-1">No upcoming events</p>
                <p className="font-mono text-[12px] text-pb-muted mb-4">Find your next tournament to get started.</p>
                <PbBtn variant="outline" size="sm" asChild>
                  <Link to="/tournaments">Browse Tournaments</Link>
                </PbBtn>
              </div>
            )}
          </div>
        )}

        {/* ── Desktop top bar (md+) ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden md:block border-b border-pb-hairline bg-pb-surface"
        >
          <div className="container mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-display font-black text-[22px] sm:text-[26px] tracking-[-0.03em] text-pb-ink mb-0.5">
                  Welcome back, {user.name}
                </h1>
                <p className="text-[12px] font-mono text-pb-muted">
                  {isOrganizer
                    ? "Manage your tournaments and track your events"
                    : liveMatchesCount > 0
                    ? `${liveMatchesCount} live match${liveMatchesCount > 1 ? "es" : ""} today — let's get that win.`
                    : "Track your progress and find new tournaments"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-pb-hairline bg-pb-paper text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors">
                  <Bell size={15} />
                </button>
                <Link
                  to="/profile"
                  className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-pb-hairline bg-pb-paper text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors"
                >
                  <Gear size={15} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="hidden md:block container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 md:pb-8">
          {isSuperAdmin && (
            <div className="mb-8 space-y-4">
              <div className="flex gap-3">
                <Link
                  to="/blog/new"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface text-pb-ink text-[11px] font-mono uppercase tracking-[0.08em] hover:border-pb-rule transition-colors"
                >
                  <Article size={14} />
                  New Blog Post
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] border border-pb-hairline bg-pb-surface text-pb-ink text-[11px] font-mono uppercase tracking-[0.08em] hover:border-pb-rule transition-colors"
                >
                  <Article size={14} />
                  Manage Blog
                </Link>
              </div>
              <NewsletterSubscribersPanel />
            </div>
          )}

          {dashboardLoading ? (
            <div className="space-y-8" aria-busy="true">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5 animate-pulse">
                    <div className="h-3 bg-pb-hairline rounded w-20 mb-3" />
                    <div className="h-7 bg-pb-hairline rounded w-12 mb-2" />
                    <div className="h-2.5 bg-pb-hairline rounded w-16" />
                  </div>
                ))}
              </div>
              <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-20 w-20 bg-pb-hairline rounded-[6px] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-pb-hairline rounded w-3/4" />
                    <div className="h-3 bg-pb-hairline rounded w-full" />
                    <div className="h-3 bg-pb-hairline rounded w-5/6" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 bg-pb-surface border border-pb-hairline rounded-[6px] animate-pulse" />
                <div className="h-48 bg-pb-surface border border-pb-hairline rounded-[6px] animate-pulse" />
              </div>
            </div>
          ) : isOrganizer ? (
            <OrganizerDashboard
              myTournaments={myTournaments}
              activeTournaments={activeTournaments}
              tournamentsLoading={tournamentsLoading}
            />
          ) : (
            <PlayerDashboard
              stats={stats}
              winRate={winRate}
              user={{ skillLevel: user.skillLevel }}
              myEventRegistrations={myEventRegistrations}
              recommendedTournaments={recommendedTournaments}
              myTeams={myTeams}
              pendingInvitations={pendingInvitations}
              ticketsData={ticketsData}
              waitlistData={waitlistData}
              teamsLoading={teamsLoading}
              ticketsLoading={ticketsLoading}
              onCancelRegistration={(payload) => {
                setSelectedCancellation(payload);
                setCancelDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {selectedCancellation && (
        <CancelRegistrationDialog
          eventId={selectedCancellation.eventId}
          eventName={selectedCancellation.eventName}
          tournamentName={selectedCancellation.tournamentName}
          isDoubles={selectedCancellation.isDoubles}
          partnerName={selectedCancellation.partnerName}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onSuccess={() => window.location.reload()}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
