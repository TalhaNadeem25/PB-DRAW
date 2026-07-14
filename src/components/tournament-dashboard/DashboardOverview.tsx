import { Link } from "react-router-dom";
import {
  Users, CurrencyDollar, GitBranch, Chat,
  DownloadSimple, CheckCircle, Circle, Clock, Pulse,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Eyebrow, Pill } from "@/components/ui/pb";

export interface ActivityItem {
  id: string;
  timestamp: Date;
  description: string;
  entity: string;
  action: string;
}

interface DashboardOverviewProps {
  tournament: any;
  recentActivities: ActivityItem[];
}

const DashboardOverview = ({ tournament, recentActivities }: DashboardOverviewProps) => {
  const events         = tournament.events || [];
  const currentPlayers = tournament.currentPlayers || 0;
  const maxPlayers     = tournament.maxPlayers || 1;

  const totalRevenue   = events.reduce((acc: number, e: any) => acc + (e.entryFee || 0) * (e.currentTeams || 0), 0);
  const maxRevenue     = events.reduce((acc: number, e: any) => acc + (e.entryFee || 0) * (e.maxTeams || 1), 0);
  const revPct         = maxRevenue > 0 ? (totalRevenue / maxRevenue) * 100 : 0;
  const regPct         = (currentPlayers / maxPlayers) * 100;

  const tasks = buildTaskChecklist(tournament);

  return (
    <div className="space-y-8">

      {/* ── KPI row ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <CurrencyDollar size={14} className="text-pb-muted shrink-0" />
            <Eyebrow>Revenue</Eyebrow>
          </div>
          <div className="font-mono font-bold text-[32px] tracking-[-0.04em] text-pb-ink leading-none mb-3">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-pb-court rounded-full transition-all duration-500"
              style={{ width: `${Math.min(revPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-pb-muted">
            ${totalRevenue.toLocaleString()} of ${maxRevenue.toLocaleString()} potential
          </p>
        </div>

        {/* Registrations */}
        <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-pb-muted shrink-0" />
            <Eyebrow>Registrations</Eyebrow>
          </div>
          <div className="flex items-end justify-between gap-3 mb-3">
            <div className="font-mono font-bold text-[32px] tracking-[-0.04em] text-pb-ink leading-none">
              {currentPlayers}
            </div>
            {/* Avatar stack */}
            <div className="flex -space-x-1.5 pb-1">
              {Array.from({ length: Math.min(currentPlayers, 4) }).map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-pb-court-tint2 border-2 border-pb-surface flex items-center justify-center text-[11px] font-mono font-bold text-pb-court"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {currentPlayers > 4 && (
                <div className="w-7 h-7 rounded-full bg-pb-surface2 border-2 border-pb-surface flex items-center justify-center text-[10px] font-mono text-pb-muted">
                  +{currentPlayers - 4}
                </div>
              )}
            </div>
          </div>
          <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden mb-1.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                regPct >= 90 ? "bg-destructive" : regPct >= 70 ? "bg-pb-amber" : "bg-pb-court"
              )}
              style={{ width: `${Math.min(regPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-pb-muted">
            {currentPlayers} of {maxPlayers} registered
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: GitBranch,    label: "Brackets",     to: `/tournaments/${tournament._id}?tab=brackets`  },
            { icon: Chat,         label: "Broadcast",    to: `/tournaments/${tournament._id}/communications` },
            { icon: DownloadSimple, label: "Export",     to: `/tournaments/${tournament._id}?tab=dashboard`  },
          ].map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="bg-pb-surface border border-pb-hairline rounded-[6px] p-4 flex flex-col items-center gap-2 text-center hover:border-pb-rule hover:bg-pb-surface2 transition-colors group"
            >
              <div className="w-8 h-8 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center group-hover:border-pb-rule transition-colors">
                <Icon size={15} className="text-pb-muted group-hover:text-pb-ink transition-colors" />
              </div>
              <span className="text-[12px] font-mono text-pb-muted group-hover:text-pb-ink transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Registration progress per event ── */}
      {events.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-3">Registration Progress</p>
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden divide-y divide-pb-hairline">
            {events.map((event: any) => {
              const teams = event.currentTeams || 0;
              const max   = event.maxTeams || 1;
              const pct   = (teams / max) * 100;
              return (
                <div key={event._id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-[14px] tracking-[-0.015em] text-pb-ink truncate">
                        {event.name}
                      </span>
                      <Pill tone="neutral" mono className="shrink-0">
                        {(event.playFormat || event.format || "").replace(/-/g, " ")}
                      </Pill>
                    </div>
                    <p className="text-[11px] font-mono text-pb-muted mt-0.5">
                      {teams} registered · ${event.entryFee} entry
                    </p>
                  </div>
                  <div className="w-28 shrink-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-mono text-pb-faint">{teams}/{max}</span>
                      <span className="text-[10px] font-mono text-pb-faint">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-pb-amber" : "bg-pb-court"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Checklist ── */}
      {tasks.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-3">Checklist</p>
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden divide-y divide-pb-hairline">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                {task.done
                  ? <CheckCircle size={15} className="text-pb-court shrink-0" weight="fill" />
                  : <Circle size={15} className="text-pb-faint shrink-0" />}
                <span className={cn(
                  "text-[13px] flex-1",
                  task.done ? "line-through text-pb-faint" : "text-pb-ink"
                )}>
                  {task.label}
                </span>
                {task.hint && (
                  <span className="text-[11px] font-mono text-pb-faint shrink-0">{task.hint}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity feed ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted">Recent Activity</p>
          <span className="w-1.5 h-1.5 rounded-full bg-pb-court animate-pulse" />
        </div>
        {recentActivities.length > 0 ? (
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-pb-hairline bg-pb-surface2">
                  <th className="text-left px-4 py-2.5"><Eyebrow>Time</Eyebrow></th>
                  <th className="text-left px-4 py-2.5"><Eyebrow>Activity</Eyebrow></th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell"><Eyebrow>Entity</Eyebrow></th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell"><Eyebrow>Action</Eyebrow></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-hairline">
                {recentActivities.slice(0, 10).map((a) => (
                  <tr key={a.id} className="hover:bg-pb-surface2 transition-colors">
                    <td className="px-4 py-3 font-mono text-pb-muted whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelative(a.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-pb-ink2">{a.description}</td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-pb-muted">{a.entity}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Pill tone="neutral" mono>{a.action}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-5 py-10 text-center">
            <Pulse size={20} className="mx-auto mb-2 text-pb-faint" />
            <p className="text-[12px] font-mono text-pb-muted">No activity yet. Events will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

/* ─── Helpers ─── */

interface TaskItem { label: string; done: boolean; hint?: string }

function buildTaskChecklist(tournament: any): TaskItem[] {
  const events    = tournament.events || [];
  const hasEvents = events.length > 0;
  const hasPlayers = (tournament.currentPlayers || 0) > 0;
  const isStarted = tournament.status === "in-progress" || tournament.status === "completed";

  return [
    { label: "Create tournament events",    done: hasEvents,  hint: hasEvents ? `${events.length} events` : "Add at least one" },
    { label: "Open registration",           done: tournament.status !== "draft" },
    { label: "Get player registrations",    done: hasPlayers, hint: hasPlayers ? `${tournament.currentPlayers} registered` : "Share your tournament" },
    ...(hasEvents ? [{ label: "Finalize seedings", done: events.every((e: any) => (e.currentTeams || 0) >= 2) && isStarted, hint: isStarted ? "Done" : "Needs 2+ teams per event" }] : []),
    { label: "Start tournament",            done: isStarted,  hint: isStarted ? "Live" : "When ready" },
  ];
}

function formatRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
