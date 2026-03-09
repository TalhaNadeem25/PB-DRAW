import { Link } from "react-router-dom";
import {
  Users,
  CurrencyDollar,
  GitBranch,
  SquaresFour,
  Chat,
  DownloadSimple,
  CheckCircle,
  Circle,
  Clock,
  Pulse,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const DashboardOverview = ({
  tournament,
  recentActivities,
}: DashboardOverviewProps) => {
  const events = tournament.events || [];
  const currentPlayers = tournament.currentPlayers || 0;
  const maxPlayers = tournament.maxPlayers || 1;

  // Compute revenue: sum of (event entryFee * event currentTeams) across all events
  const totalRevenue = events.reduce(
    (acc: number, e: any) => acc + (e.entryFee || 0) * (e.currentTeams || 0),
    0
  );
  const maxRevenue = events.reduce(
    (acc: number, e: any) => acc + (e.entryFee || 0) * (e.maxTeams || 1),
    0
  );
  const revenuePercent = maxRevenue > 0 ? (totalRevenue / maxRevenue) * 100 : 0;
  const registrationPercent = (currentPlayers / maxPlayers) * 100;

  // Build task checklist from tournament state
  const tasks = buildTaskChecklist(tournament);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Stats Row ── */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="glass-card-hover rounded-2xl p-6 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
              <CurrencyDollar className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Revenue</div>
              <div className="font-display font-bold text-3xl">
                ${totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-hero-gradient rounded-full transition-all duration-500"
              style={{ width: `${Math.min(revenuePercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            ${totalRevenue.toLocaleString()} of ${maxRevenue.toLocaleString()}{" "}
            potential
          </div>
        </div>

        {/* Registrations */}
        <div className="glass-card-hover rounded-2xl p-6 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Registrations</div>
              <div className="font-display font-bold text-3xl">
                {currentPlayers}
              </div>
            </div>
            {/* Avatar stack placeholder */}
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(currentPlayers, 4) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-semibold text-primary"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                )
              )}
              {currentPlayers > 4 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  +{currentPlayers - 4}
                </div>
              )}
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                registrationPercent >= 90
                  ? "bg-destructive"
                  : registrationPercent >= 70
                  ? "bg-warning"
                  : "bg-hero-gradient"
              )}
              style={{ width: `${Math.min(registrationPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {currentPlayers} registered
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h3 className="font-display font-bold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction
            icon={GitBranch}
            label="Brackets"
            to={`/tournaments/${tournament._id}`}
            tab="brackets"
          />
          <QuickAction
            icon={SquaresFour}
            label="Court Manager"
            to={`/tournaments/${tournament._id}/courts`}
          />
          <QuickAction
            icon={Chat}
            label="Broadcast"
            to={`/tournaments/${tournament._id}/communications`}
          />
          <QuickAction
            icon={DownloadSimple}
            label="Export"
            to={`/tournaments/${tournament._id}`}
            tab="dashboard"
          />
        </div>
      </div>

      {/* ── Registration Progress per Event ── */}
      {events.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg mb-4">
            Registration Progress
          </h3>
          <div className="space-y-3">
            {events.map((event: any) => {
              const teams = event.currentTeams || 0;
              const max = event.maxTeams || 1;
              const pct = (teams / max) * 100;
              return (
                <div
                  key={event._id}
                  className="glass-card-hover rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm truncate">
                        {event.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="capitalize text-xs shrink-0"
                      >
                        {(event.playFormat || event.format || "")
                          .replace(/-/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>
                        {teams} registered
                      </span>
                      <span>${event.entryFee} entry</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-40">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          pct >= 90
                            ? "bg-destructive"
                            : pct >= 70
                            ? "bg-warning"
                            : "bg-hero-gradient"
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

      {/* ── Upcoming Tasks ── */}
      {tasks.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg mb-4">
            Upcoming Tasks
          </h3>
          <div className="glass-card-hover rounded-2xl p-6 space-y-3">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                {task.done ? (
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm flex-1",
                    task.done && "line-through text-muted-foreground"
                  )}
                >
                  {task.label}
                </span>
                {task.hint && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {task.hint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Activity Feed ── */}
      <div>
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          Recent Activity
          <span className="live-indicator ml-1" />
        </h3>
        {recentActivities.length > 0 ? (
          <div className="glass-card-hover rounded-2xl overflow-hidden">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Activity</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                    Entity
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.slice(0, 10).map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatRelative(a.timestamp)}
                    </td>
                    <td className="px-4 py-3">{a.description}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {a.entity}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 text-xs"
                      >
                        {a.action}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card-hover rounded-2xl p-8 text-center text-muted-foreground">
            <Pulse className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              No activity yet. Events will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

/* ─── Helpers ─── */

function QuickAction({
  icon: Icon,
  label,
  to,
  tab,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  tab?: string;
}) {
  // If tab is provided, we stay on same page — use a button-style Link
  const href = tab ? `${to}?tab=${tab}` : to;
  return (
    <Link
      to={href}
      className="glass-card-hover hover-lift rounded-2xl p-5 flex flex-col items-center gap-2 text-center group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

interface TaskItem {
  label: string;
  done: boolean;
  hint?: string;
}

function buildTaskChecklist(tournament: any): TaskItem[] {
  const tasks: TaskItem[] = [];
  const events = tournament.events || [];
  const hasEvents = events.length > 0;
  const hasPlayers = (tournament.currentPlayers || 0) > 0;
  const isStarted =
    tournament.status === "in-progress" || tournament.status === "completed";

  tasks.push({
    label: "Create tournament events",
    done: hasEvents,
    hint: hasEvents ? `${events.length} events` : "Add at least one",
  });

  tasks.push({
    label: "Open registration",
    done: tournament.status !== "draft",
  });

  tasks.push({
    label: "Get player registrations",
    done: hasPlayers,
    hint: hasPlayers
      ? `${tournament.currentPlayers} registered`
      : "Share your tournament",
  });

  if (hasEvents) {
    const allSeeded = events.every(
      (e: any) => (e.currentTeams || 0) >= 2
    );
    tasks.push({
      label: "Finalize seedings",
      done: allSeeded && isStarted,
      hint: isStarted ? "Done" : "Needs 2+ teams per event",
    });
  }

  tasks.push({
    label: "Start tournament",
    done: isStarted,
    hint: isStarted ? "Live" : "When ready",
  });

  return tasks;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
