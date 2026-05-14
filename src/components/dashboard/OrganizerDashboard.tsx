import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Pill, Eyebrow, PbBtn } from "@/components/ui/pb";
import {
  ArrowRight,
  Brain,
  Calendar,
  MapPin,
  Play,
  Plus,
  Sparkle,
  Target,
  TrendUp,
  Trophy,
  Users,
  Lightning,
  CircleNotch,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";

export interface OrganizerDashboardProps {
  myTournaments: any[];
  activeTournaments: any[];
  tournamentsLoading: boolean;
}

const statusTone = (status: string): "court" | "amber" | "neutral" | "ink" => {
  if (status === "in-progress") return "court";
  if (status === "open") return "amber";
  return "neutral";
};

export default function OrganizerDashboard({
  myTournaments,
  activeTournaments,
  tournamentsLoading,
}: OrganizerDashboardProps) {
  const navigate = useNavigate();

  const kpis = [
    {
      label: "Total Tournaments",
      value: myTournaments.length,
      sub: `${activeTournaments.length} active`,
      icon: Trophy,
    },
    {
      label: "Active Tournaments",
      value: activeTournaments.length,
      sub: "Currently running",
      icon: Play,
    },
    {
      label: "Total Participants",
      value: myTournaments.reduce((sum: number, t: any) => sum + (t.currentPlayers || 0), 0),
      sub: "Across all tournaments",
      icon: Users,
    },
    {
      label: "Events Created",
      value: myTournaments.reduce((sum: number, t: any) => sum + (t.events?.length || 0), 0),
      sub: "Total events",
      icon: Target,
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-pb-muted leading-tight">{label}</span>
              <div className="w-7 h-7 rounded-[4px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
                <Icon size={13} className="text-pb-court" />
              </div>
            </div>
            <p className="font-display font-black text-[28px] leading-none text-pb-ink mb-1">{value}</p>
            <p className="text-[11px] font-mono text-pb-faint">{sub}</p>
          </div>
        ))}
      </div>

      {/* AI Planner editorial card */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
        <div className="border-b border-pb-hairline px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center">
            <Brain size={15} className="text-pb-court" />
          </div>
          <div>
            <Eyebrow>New Feature</Eyebrow>
          </div>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h3 className="font-display font-black text-[20px] tracking-[-0.02em] text-pb-ink mb-2">
              Plan Perfect Tournaments with AI
            </h3>
            <p className="text-[13px] font-mono text-pb-muted mb-5 leading-relaxed">
              Let AI help you calculate court requirements, suggest events, optimize schedules, and more. Get expert recommendations instantly.
            </p>
            <div className="flex flex-wrap gap-5 mb-5">
              {[
                { icon: Brain, label: "Smart Event Suggestions" },
                { icon: Lightning, label: "Court Calculations" },
                { icon: TrendUp, label: "Schedule Optimization" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={13} className="text-pb-court" />
                  <span className="text-[12px] font-mono text-pb-muted">{label}</span>
                </div>
              ))}
            </div>
            <Link
              to="/tournament-planner"
              className="inline-flex items-center gap-2 h-9 px-5 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[13px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors"
            >
              <Sparkle size={14} />
              Try AI Planner
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stripe Payment Setup */}
      <div>
        <h2 className="font-display font-black text-[18px] uppercase tracking-tight text-pb-ink mb-4">Payment Setup</h2>
        <ConnectAccountStatus />
      </div>

      {/* Quick Actions */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
        <div className="border-b border-pb-hairline px-6 py-4">
          <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">Quick Actions</p>
          <p className="text-[11px] font-mono text-pb-muted mt-0.5">Manage your tournaments efficiently</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/create-tournament"
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-[6px] bg-pb-ink text-white hover:bg-pb-ink/90 transition-colors"
          >
            <Plus size={20} />
            <span className="text-[12px] font-mono uppercase tracking-[0.06em]">Create Tournament</span>
          </Link>
          <Link
            to="/tournaments"
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-[6px] border border-pb-hairline bg-pb-paper text-pb-ink hover:border-pb-rule transition-colors"
          >
            <Trophy size={20} className="text-pb-muted" />
            <span className="text-[12px] font-mono uppercase tracking-[0.06em]">View All Tournaments</span>
          </Link>
          <Link
            to="/teams"
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-[6px] border border-pb-hairline bg-pb-paper text-pb-ink hover:border-pb-rule transition-colors"
          >
            <Users size={20} className="text-pb-muted" />
            <span className="text-[12px] font-mono uppercase tracking-[0.06em]">Manage Teams</span>
          </Link>
        </div>
      </div>

      {/* Active Tournaments */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[6px]">
        <div className="border-b border-pb-hairline px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">Active Tournaments</p>
            <p className="text-[11px] font-mono text-pb-muted mt-0.5">Tournaments currently open or in progress</p>
          </div>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-pb-court hover:underline underline-offset-2"
          >
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="p-4">
          {tournamentsLoading ? (
            <SkeletonList count={3} />
          ) : activeTournaments.length > 0 ? (
            <div className="divide-y divide-pb-hairline">
              {activeTournaments.map((tournament: any) => (
                <div
                  key={tournament._id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0 cursor-pointer group"
                  onClick={() => navigate(`/tournaments/${tournament._id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h3 className="font-display font-bold text-[14px] text-pb-ink group-hover:text-pb-court transition-colors truncate">
                        {tournament.name}
                      </h3>
                      <Pill tone={statusTone(tournament.status)}>{tournament.status}</Pill>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-pb-faint">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{tournament.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="shrink-0" />
                        {new Date(tournament.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} className="shrink-0" />
                        {tournament.currentPlayers || 0} players
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-pb-faint group-hover:text-pb-muted transition-colors shrink-0 ml-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Trophy size={32} className="mx-auto mb-3 text-pb-faint" />
              <p className="text-[13px] font-mono text-pb-muted mb-4">No active tournaments</p>
              <Link
                to="/create-tournament"
                className="inline-flex items-center gap-2 h-9 px-5 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[12px] uppercase tracking-wide hover:bg-pb-ink/90 transition-colors"
              >
                <Plus size={13} />
                Create Your First Tournament
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
