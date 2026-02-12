'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface TeamSpending {
  name: string;
  shortName: string;
  primaryColor: string;
  spent: number;
  purseRemaining: number;
  purseValue: number;
  utilization: number;
}

interface RoleBreakdown {
  _id: string;
  avgPrice: number;
  maxPrice: number;
  count: number;
}

interface RoundStat {
  _id: number;
  count: number;
  avgPrice: number;
  totalSpent: number;
}

const ROLE_COLORS: Record<string, string> = {
  batsman: '#3b82f6',
  bowler: '#ef4444',
  'all-rounder': '#f59e0b',
  'wicket-keeper': '#10b981',
};

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  'all-rounder': 'All-Rounder',
  'wicket-keeper': 'Wicket Keeper',
};

function formatCurrencyShort(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-slate-300">
          <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
          {typeof entry.value === 'number' ? formatCurrencyShort(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

export function AnalyticsCharts({
  teamSpending,
  roleBreakdown,
  roundStats,
}: {
  teamSpending: TeamSpending[];
  roleBreakdown: RoleBreakdown[];
  roundStats: RoundStat[];
}) {
  if (!teamSpending.length && !roleBreakdown.length && !roundStats.length) return null;

  const teamChartData = teamSpending.map(t => ({
    name: t.shortName,
    fullName: t.name,
    Spent: t.spent,
    Remaining: t.purseRemaining,
    color: t.primaryColor,
  }));

  const roleChartData = roleBreakdown.map(r => ({
    name: ROLE_LABELS[r._id] || r._id,
    value: r.count,
    avgPrice: r.avgPrice,
    maxPrice: r.maxPrice,
    color: ROLE_COLORS[r._id] || '#64748b',
  }));

  const roundChartData = roundStats.map(r => ({
    name: `Round ${r._id}`,
    Players: r.count,
    'Avg Price': Math.round(r.avgPrice),
    'Total Spent': r.totalSpent,
  }));

  return (
    <div className="space-y-8 mb-10">
      {/* Team Spending Chart */}
      {teamChartData.length > 0 && (
        <section className="glass-card p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white mb-6">Team Spending</h3>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Spent" stackId="purse" radius={[0, 0, 0, 0]}>
                  {teamChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="Remaining" stackId="purse" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Utilization badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {teamSpending.map(t => (
              <div
                key={t.shortName}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/5"
              >
                <div className="w-3 h-3 rounded-sm" style={{ background: t.primaryColor }} />
                <span className="text-xs text-slate-300">{t.shortName}</span>
                <span className="text-xs font-semibold text-white">{t.utilization}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Breakdown Pie */}
        {roleChartData.length > 0 && (
          <section className="glass-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white mb-6">Players by Role</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {roleChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
                          <p className="text-sm font-medium text-white">{data.name}</p>
                          <p className="text-xs text-slate-300">{data.value} players</p>
                          <p className="text-xs text-slate-400">Avg: {formatCurrencyShort(data.avgPrice)}</p>
                          <p className="text-xs text-slate-400">Max: {formatCurrencyShort(data.maxPrice)}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    formatter={(value: string) => <span className="text-xs text-slate-300">{value}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Role price cards */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {roleChartData.map(r => (
                <div key={r.name} className="p-2.5 rounded-lg bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    <span className="text-xs font-medium text-slate-300">{r.name}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Avg: <span className="text-white font-medium">{formatCurrencyShort(r.avgPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Round Stats */}
        {roundChartData.length > 0 && (
          <section className="glass-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white mb-6">Round-wise Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roundChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Players" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Round summary */}
            <div className="space-y-2 mt-4">
              {roundStats.map(r => (
                <div key={r._id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30">
                  <span className="text-xs text-slate-300">Round {r._id}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{r.count} sold</span>
                    <span className="text-xs font-medium text-amber-400">Avg: {formatCurrencyShort(r.avgPrice)}</span>
                    <span className="text-xs font-medium text-white">{formatCurrencyShort(r.totalSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
