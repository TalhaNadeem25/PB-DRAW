import { Trophy, Medal, TrendUp, TrendDown, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Eyebrow, Pill } from "@/components/ui/pb";

interface Team {
  _id: string;
  name?: string;
  players: Array<{ _id: string; name: string }>;
  stats: {
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDifferential: number;
  };
}

interface PoolStandingsProps {
  teams: Team[];
  poolName?: string;
  showPlayoffIndicators?: boolean;
  onRemoveTeam?: (teamId: string) => void;
  isRemoving?: boolean;
  isPlayoffsFinalized?: boolean;
  availablePools?: { _id: string; name: string }[];
  onMoveTeam?: (teamId: string, toPoolId: string) => void;
  isMoving?: boolean;
}

const PoolStandings = ({
  teams,
  poolName,
  showPlayoffIndicators = true,
  onRemoveTeam,
  isRemoving = false,
  isPlayoffsFinalized = false,
  availablePools,
  onMoveTeam,
  isMoving = false,
}: PoolStandingsProps) => {
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
    return b.stats.pointDifferential - a.stats.pointDifferential;
  });

  const getTeamName = (team: Team) =>
    team.name || team.players.map((p) => p.name).join(" / ") || "Unnamed Team";

  const getWinPct = (team: Team) => {
    const total = team.stats.wins + team.stats.losses;
    return total === 0 ? "0.000" : (team.stats.wins / total).toFixed(3);
  };

  const getMedalLabel = (rank: number) => {
    if (!isPlayoffsFinalized || rank > 4) return null;
    const medals: Record<number, { emoji: string; label: string; tone: "amber" | "neutral" | "ink" }> = {
      1: { emoji: "🥇", label: "Gold",   tone: "amber"   },
      2: { emoji: "🥈", label: "Silver", tone: "neutral" },
      3: { emoji: "🥉", label: "Bronze", tone: "neutral" },
      4: { emoji: "",   label: "4th",    tone: "ink"     },
    };
    const m = medals[rank];
    return m ? (
      <Pill tone={m.tone} mono className="shrink-0">
        {m.emoji} {m.label}
      </Pill>
    ) : null;
  };

  const getSeedPill = (rank: number) => {
    if (!showPlayoffIndicators || isPlayoffsFinalized || rank > 3) return null;
    const tone = rank === 1 ? "amber" : "neutral";
    return (
      <Pill tone={tone} mono className="shrink-0">
        #{rank} Seed
      </Pill>
    );
  };

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-5 py-8 text-center">
        <Trophy size={20} className="mx-auto mb-2 text-pb-faint" />
        <p className="text-[12px] font-mono text-pb-muted">No teams in this pool yet.</p>
      </div>
    );
  }

  const showActions = !!(onRemoveTeam || onMoveTeam);

  return (
    <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-pb-hairline flex items-center justify-between bg-pb-surface2">
        <div className="flex items-center gap-2">
          <Trophy size={13} className="text-pb-muted shrink-0" />
          <Eyebrow>{poolName ? `${poolName} — Standings` : "Pool Standings"}</Eyebrow>
        </div>
        {showPlayoffIndicators && !isPlayoffsFinalized && (
          <span className="text-[11px] font-mono text-pb-muted">Top 3 advance</span>
        )}
        {isPlayoffsFinalized && (
          <Pill tone="court" mono>Final</Pill>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-pb-hairline">
              <th className="px-4 py-2.5 text-left w-10">
                <Eyebrow>#</Eyebrow>
              </th>
              <th className="px-2 py-2.5 text-left">
                <Eyebrow>Team</Eyebrow>
              </th>
              <th className="px-3 py-2.5 text-center w-10">
                <Eyebrow>W</Eyebrow>
              </th>
              <th className="px-3 py-2.5 text-center w-10">
                <Eyebrow>L</Eyebrow>
              </th>
              <th className="px-3 py-2.5 text-center w-16">
                <Eyebrow>PCT</Eyebrow>
              </th>
              <th className="px-3 py-2.5 text-center w-12">
                <Eyebrow>PF</Eyebrow>
              </th>
              <th className="px-3 py-2.5 text-center w-12">
                <Eyebrow>PA</Eyebrow>
              </th>
              <th className="px-3 py-2.5 text-center w-16">
                <Eyebrow>Diff</Eyebrow>
              </th>
              {showPlayoffIndicators && (
                <th className="px-3 py-2.5 text-left">
                  <Eyebrow>Seed</Eyebrow>
                </th>
              )}
              {showActions && (
                <th className="px-3 py-2.5 text-left w-28">
                  <Eyebrow>Actions</Eyebrow>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-pb-hairline">
            {sortedTeams.map((team, index) => {
              const rank = index + 1;
              const isPlayoffTeam = showPlayoffIndicators && !isPlayoffsFinalized && rank <= 3;
              const diff = team.stats.pointDifferential;

              return (
                <tr
                  key={team._id}
                  className={cn(
                    "transition-colors hover:bg-pb-surface2",
                    isPlayoffTeam && "bg-pb-court-tint2/40"
                  )}
                >
                  {/* Rank */}
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "font-mono text-[14px] font-bold",
                      rank === 1 && !isPlayoffsFinalized ? "text-pb-amber" : "text-pb-muted"
                    )}>
                      {rank}
                    </span>
                  </td>

                  {/* Team name */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPlayoffTeam && rank === 1 && (
                        <Trophy size={12} className="text-pb-amber shrink-0" />
                      )}
                      {getMedalLabel(rank)}
                      <span className="font-display font-semibold text-[14px] tracking-[-0.015em] text-pb-ink">
                        {getTeamName(team)}
                      </span>
                    </div>
                  </td>

                  {/* W */}
                  <td className="px-3 py-3 text-center font-mono font-semibold text-pb-court">
                    {team.stats.wins}
                  </td>

                  {/* L */}
                  <td className="px-3 py-3 text-center font-mono font-semibold text-pb-amber">
                    {team.stats.losses}
                  </td>

                  {/* PCT */}
                  <td className="px-3 py-3 text-center font-mono text-pb-muted">
                    {getWinPct(team)}
                  </td>

                  {/* PF */}
                  <td className="px-3 py-3 text-center font-mono text-pb-ink2">
                    {team.stats.pointsFor}
                  </td>

                  {/* PA */}
                  <td className="px-3 py-3 text-center font-mono text-pb-ink2">
                    {team.stats.pointsAgainst}
                  </td>

                  {/* Diff */}
                  <td className="px-3 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 font-mono font-semibold text-[12px]",
                      diff > 0 ? "text-pb-court" : diff < 0 ? "text-pb-amber" : "text-pb-faint"
                    )}>
                      {diff > 0 && <TrendUp size={11} />}
                      {diff < 0 && <TrendDown size={11} />}
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>

                  {/* Seed */}
                  {showPlayoffIndicators && (
                    <td className="px-3 py-3">
                      {getSeedPill(rank)}
                    </td>
                  )}

                  {/* Actions */}
                  {showActions && (
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {onMoveTeam && availablePools && availablePools.length > 0 && (
                          <select
                            disabled={isMoving}
                            onChange={(e) => e.target.value && onMoveTeam(team._id, e.target.value)}
                            defaultValue=""
                            className="text-[11px] font-mono h-7 px-2 rounded-[4px] border border-pb-hairline bg-pb-surface text-pb-muted hover:border-pb-rule focus:outline-none focus:border-pb-rule disabled:opacity-50 cursor-pointer"
                          >
                            <option value="" disabled>Move to…</option>
                            {availablePools.map((p) => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        )}
                        {onRemoveTeam && (
                          <button
                            onClick={() => onRemoveTeam(team._id)}
                            disabled={isRemoving}
                            title="Remove from pool"
                            className="w-7 h-7 rounded-[4px] border border-pb-hairline text-pb-faint hover:border-destructive hover:text-destructive flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <Trash size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      {showPlayoffIndicators && (
        <div className="px-5 py-3 border-t border-pb-hairline flex flex-wrap gap-x-4 gap-y-1">
          {["W = Wins", "L = Losses", "PCT = Win %", "PF = Points For", "PA = Points Against", "Diff = Point Differential"].map((item) => (
            <span key={item} className="text-[11px] font-mono text-pb-faint">{item}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoolStandings;
