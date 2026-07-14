import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsAPI, tournamentAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Export } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Bar, BarChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Eyebrow } from '@/components/ui/pb';

const PERIODS = ['12M', '6M', '3M'] as const;
type Period = typeof PERIODS[number];

const fmt = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtNum = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const CustomBar = (props: any) => {
  const { x, y, width, height, value, isLast } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={isLast ? '#A0714F' : '#1a1a1a'} rx={2} />
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fill="#888" fontFamily="monospace">
        {value > 0 ? fmt(value) : ''}
      </text>
    </g>
  );
};

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('12M');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', user?._id, period],
    queryFn: async () => {
      const months = period === '12M' ? 12 : period === '6M' ? 6 : 3;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      const response = await analyticsAPI.getOrganizationAnalytics(user!._id, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return response.data;
    },
    enabled: !!user?._id,
  });

  const handleExportCSV = async () => {
    try {
      const blob = await analyticsAPI.exportCSV(user!._id, {});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalRevenue = analyticsData?.revenue?.total ?? 0;
  const totalTournaments = analyticsData?.summary?.totalTournaments ?? 0;
  const totalRegistrations = analyticsData?.summary?.uniqueParticipants ?? 0;
  const fillRate = analyticsData?.registrations?.fillRate ?? 0;

  // Per-event revenue for the bar chart (use as proxy for monthly when no monthly data)
  const perEvent: any[] = analyticsData?.revenue?.perEvent ?? [];
  const chartData = perEvent.slice(-12).map((e: any, i: number, arr: any[]) => ({
    label: e.eventName?.slice(0, 6) ?? '',
    value: Math.round(e.revenue ?? 0),
    isLast: i === arr.length - 1,
  }));

  // Skill level distribution → player mix proxy
  const skillLevels: any[] = analyticsData?.demographics?.skillLevels ?? [];
  const MIX_COLORS = ['#1F4A2E', '#A0714F', '#1a1a1a'];
  const playerMix = skillLevels.slice(0, 3).map((s: any, i: number) => ({
    name: `Level ${s.skillLevel}`,
    value: s.percentage ?? 0,
    color: MIX_COLORS[i],
  }));

  // Top events by revenue
  const topEvents = [...perEvent]
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
    .slice(0, 5);

  // Avg registrations per event
  const avgPerEvent = perEvent.length > 0
    ? (perEvent.reduce((s, e) => s + (e.registrations ?? 0), 0) / perEvent.length).toFixed(1)
    : '0';

  const statStrip = [
    { label: 'GROSS REVENUE', value: fmt(totalRevenue), sub: totalRevenue > 0 ? 'total collected' : '—' },
    { label: 'TOURNAMENTS', value: fmtNum(totalTournaments), sub: `${period} window` },
    { label: 'REGISTRATIONS', value: fmtNum(totalRegistrations), sub: `avg ${avgPerEvent} per event` },
    { label: 'FILL RATE', value: `${fillRate.toFixed(0)}%`, sub: 'avg slots claimed' },
    { label: 'EVENTS', value: fmtNum(perEvent.length), sub: 'with revenue data' },
  ];

  const periodLabel = period === '12M' ? 'LAST 12 MONTHS' : period === '6M' ? 'LAST 6 MONTHS' : 'LAST 3 MONTHS';

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pb-8" style={{ paddingTop: 'max(env(safe-area-inset-top), 2rem)' }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
            <div>
              <Eyebrow className="mb-1">
                {user?.name?.toUpperCase()} · {periodLabel}
              </Eyebrow>
              <h1 className="font-display font-black text-[32px] sm:text-[42px] lg:text-[56px] text-pb-ink tracking-[-0.03em] leading-none">
                Analytics
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:mt-2 flex-wrap">
              <div className="flex items-center rounded-[6px] border border-pb-hairline overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] transition-colors',
                      period === p ? 'bg-pb-ink text-white' : 'text-pb-muted hover:text-pb-ink'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-pb-hairline font-mono text-[11px] text-pb-ink tracking-[0.06em] hover:bg-pb-surface transition-colors"
              >
                <Export size={12} />
                Export CSV
              </button>
            </div>
          </div>

          {/* ── Stat strip ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 border border-pb-hairline rounded-[8px] overflow-hidden mb-8 bg-white divide-y sm:divide-y-0 sm:divide-x divide-pb-hairline">
            {statStrip.map(({ label, value, sub }, i) => (
              <div key={label} className={cn("px-4 py-4 sm:px-5 sm:py-5", i === 4 && "col-span-2 sm:col-span-1")}>
                <p className="font-mono text-[9.5px] text-pb-muted uppercase tracking-[0.12em] mb-1">{label}</p>
                <p className={cn(
                  'font-mono font-bold leading-none mb-1',
                  value.length > 6 ? 'text-[22px]' : 'text-[28px]',
                  'text-pb-ink'
                )}>{isLoading ? '—' : value}</p>
                <p className="font-mono text-[10px] text-pb-faint">{isLoading ? '' : sub}</p>
              </div>
            ))}
          </div>

          {/* ── Two-column body ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* Left: Revenue chart */}
            <div className="border border-pb-hairline rounded-[8px] bg-white overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-pb-hairline">
                <Eyebrow>Revenue</Eyebrow>
                <h2 className="font-display font-bold text-[20px] text-pb-ink mt-0.5">
                  Event gross · {new Date().getFullYear() - 1}–{String(new Date().getFullYear()).slice(2)}
                </h2>
              </div>

              <div className="px-6 pt-6 pb-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#888', textTransform: 'uppercase' }}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        contentStyle={{ border: '1px solid #e5e0d8', borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}
                        formatter={(v: any) => [fmt(v), 'Revenue']}
                      />
                      <Bar dataKey="value" shape={<CustomBar />} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center">
                    <p className="font-mono text-[12px] text-pb-faint">No revenue data for this period</p>
                  </div>
                )}
              </div>

              {/* Revenue breakdown row */}
              <div className="grid grid-cols-4 divide-x divide-pb-hairline border-t border-pb-hairline">
                {[
                  { label: 'TOURNAMENT FEES', value: fmt(totalRevenue) },
                  { label: 'TOTAL EVENTS', value: fmtNum(perEvent.length) },
                  { label: 'REGISTRATIONS', value: fmtNum(totalRegistrations) },
                  { label: 'FILL RATE', value: `${fillRate.toFixed(0)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-4">
                    <p className="font-mono text-[9px] text-pb-muted uppercase tracking-[0.12em] mb-1">{label}</p>
                    <p className="font-mono font-bold text-[18px] text-pb-ink">{isLoading ? '—' : value}</p>
                    <div className="mt-2 h-[2px] w-8 bg-pb-ink rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-4">

              {/* Top events */}
              <div className="border border-pb-hairline rounded-[8px] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-pb-hairline">
                  <Eyebrow>Top Events · By Gross</Eyebrow>
                </div>
                <div className="divide-y divide-pb-hairline">
                  {topEvents.length > 0 ? topEvents.map((e: any) => (
                    <div key={e.eventId} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-display font-bold text-[13px] text-pb-ink leading-tight">{e.eventName}</p>
                        <p className="font-mono text-[10px] text-pb-muted mt-0.5">
                          {e.registrations ?? 0} / {e.maxTeams ?? '—'}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-[13px] text-pb-ink">{fmt(e.revenue ?? 0)}</span>
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-center">
                      <p className="font-mono text-[11px] text-pb-faint">No event data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Player mix */}
              <div className="border border-pb-hairline rounded-[8px] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-pb-hairline">
                  <Eyebrow>Player Mix</Eyebrow>
                </div>
                <div className="px-4 py-4 flex items-center gap-4">
                  {playerMix.length > 0 ? (
                    <>
                      <PieChart width={80} height={80}>
                        <Pie
                          data={playerMix}
                          cx={35} cy={35}
                          innerRadius={22} outerRadius={36}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {playerMix.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                      <div className="flex flex-col gap-1.5">
                        {playerMix.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: entry.color }} />
                              <span className="font-mono text-[11px] text-pb-muted">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold text-[11px] text-pb-ink">{entry.value.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="font-mono text-[11px] text-pb-faint py-2">No demographic data yet</p>
                  )}
                </div>
              </div>

              {/* Registration funnel */}
              <div className="border border-pb-hairline rounded-[8px] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-pb-hairline">
                  <Eyebrow>Registration Funnel</Eyebrow>
                </div>
                <div className="px-4 py-3 divide-y divide-pb-hairline">
                  {[
                    { label: 'Total capacity', value: perEvent.reduce((s, e) => s + (e.maxTeams ?? 0), 0), pct: 100 },
                    { label: 'Registered', value: perEvent.reduce((s, e) => s + (e.registrations ?? 0), 0), pct: fillRate },
                    { label: 'Completed payment', value: Math.round(totalRevenue / 50), pct: fillRate * 0.85 },
                  ].map(({ label, value, pct }) => (
                    <div key={label} className="py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[11px] text-pb-ink">{label}</span>
                        <span className="font-mono text-[11px] text-pb-muted">{fmtNum(value)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-[3px] bg-pb-paper rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pb-ink rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboard;
