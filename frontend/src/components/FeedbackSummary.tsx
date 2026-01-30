import React from 'react';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Brain,
  Sparkles,
  Award,
  Activity
} from 'lucide-react';

interface FeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
  venueIssues: number;
  equipmentIssues: number;
  timingIssues: number;
  umpiringIssues: number;
  otherIssues: number;
}

interface FeedbackSummaryProps {
  stats: FeedbackStats;
  className?: string;
}

const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({ stats, className = '' }) => {
  // Safe number helper to handle undefined/NaN
  const safeNum = (val: number | undefined | null): number => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return val;
  };

  const avgBatting = safeNum(stats.avgBatting);
  const avgBowling = safeNum(stats.avgBowling);
  const avgFielding = safeNum(stats.avgFielding);
  const avgTeamSpirit = safeNum(stats.avgTeamSpirit);
  
  const overallAvg = (avgBatting + avgBowling + avgFielding + avgTeamSpirit) / 4;
  
  const getPerformanceColor = (value: number) => {
    if (value >= 4) return { bg: 'from-emerald-500/20 to-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (value >= 3) return { bg: 'from-amber-500/20 to-amber-600/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'from-rose-500/20 to-rose-600/20', text: 'text-rose-400', border: 'border-rose-500/30' };
  };

  const metrics = [
    { label: 'Batting', value: avgBatting, icon: '🏏', color: 'emerald' },
    { label: 'Bowling', value: avgBowling, icon: '⚡', color: 'cyan' },
    { label: 'Fielding', value: avgFielding, icon: '🎯', color: 'amber' },
    { label: 'Spirit', value: avgTeamSpirit, icon: '💪', color: 'violet' },
  ];

  // Safe calculation for total issues
  const totalIssues = 
    safeNum(stats.venueIssues) + 
    safeNum(stats.equipmentIssues) + 
    safeNum(stats.timingIssues) + 
    safeNum(stats.umpiringIssues) + 
    safeNum(stats.otherIssues);

  // Get top metric safely
  const getTopMetric = () => {
    const validMetrics = metrics.filter(m => m.value > 0);
    if (validMetrics.length === 0) return 'N/A';
    return validMetrics.reduce((a, b) => a.value > b.value ? a : b).label;
  };

  return (
    <div className={`${className}`}>
      {/* Mobile Layout - Single Column Stacked */}
      <div className="md:hidden space-y-4">
        {/* Main Performance Card - Mobile */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
          {/* Header with Overall Score */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Performance</h3>
                <p className="text-[10px] text-slate-400">{safeNum(stats.totalSubmissions)} submissions</p>
              </div>
            </div>
            
            {/* Overall Score Badge */}
            <div className={`px-3 py-1.5 rounded-xl bg-gradient-to-br ${getPerformanceColor(overallAvg).bg} border ${getPerformanceColor(overallAvg).border}`}>
              <div className="text-center">
                <div className={`text-xl font-black ${getPerformanceColor(overallAvg).text}`}>
                  {overallAvg.toFixed(1)}
                </div>
                <div className="text-[8px] text-slate-400 uppercase tracking-wider">Avg</div>
              </div>
            </div>
          </div>

          {/* Metrics 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <div 
                key={metric.label}
                className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{metric.icon}</span>
                    <span className="text-[10px] font-semibold text-white">{metric.label}</span>
                  </div>
                  <span className={`text-sm font-black ${
                    metric.color === 'emerald' ? 'text-emerald-400' :
                    metric.color === 'cyan' ? 'text-cyan-400' :
                    metric.color === 'amber' ? 'text-amber-400' :
                    'text-violet-400'
                  }`}>
                    {metric.value.toFixed(1)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${
                      metric.color === 'emerald' ? 'from-emerald-400 to-emerald-500' :
                      metric.color === 'cyan' ? 'from-cyan-400 to-cyan-500' :
                      metric.color === 'amber' ? 'from-amber-400 to-amber-500' :
                      'from-violet-400 to-violet-500'
                    }`}
                    style={{ width: `${(metric.value / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Row - Mobile */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 text-center">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white">{safeNum(stats.totalSubmissions)}</div>
            <div className="text-[9px] text-slate-400">Feedback</div>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 text-center">
            <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white">{totalIssues}</div>
            <div className="text-[9px] text-slate-400">Issues</div>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 text-center">
            <div className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400">{getTopMetric()}</div>
            <div className="text-[9px] text-slate-400">Top</div>
          </div>
        </div>

        {/* AI Insight - Mobile */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl border border-violet-500/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-violet-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
            <h4 className="text-xs font-bold text-white">AI Insight</h4>
          </div>
          
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {overallAvg >= 4 
              ? "Excellent performance! Squad delivering consistently."
              : overallAvg >= 3
              ? "Good performance with room to improve."
              : "Performance needs attention."
            }
          </p>
          
          {metrics.filter(m => m.value < 3 && m.value > 0).length > 0 && (
            <div className="mt-2 pt-2 border-t border-violet-500/20">
              <div className="flex items-center gap-1 text-[10px] text-amber-400">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>Focus: {metrics.filter(m => m.value < 3 && m.value > 0).map(m => m.label).join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Original Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {/* Main Stats Card - Desktop */}
        <div className="col-span-2 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Performance Analytics
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-[10px] text-violet-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  </h3>
                  <p className="text-sm text-slate-400">{safeNum(stats.totalSubmissions)} total submissions</p>
                </div>
              </div>
              
              {/* Overall Score Badge */}
              <div className={`px-4 py-2 rounded-xl bg-gradient-to-br ${getPerformanceColor(overallAvg).bg} border ${getPerformanceColor(overallAvg).border}`}>
                <div className="text-center">
                  <div className={`text-2xl font-black ${getPerformanceColor(overallAvg).text}`}>
                    {overallAvg.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Overall</div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div 
                  key={metric.label}
                  className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{metric.icon}</span>
                      <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {metric.label === 'Spirit' ? 'Team Spirit' : metric.label}
                      </span>
                    </div>
                    <span className={`text-lg font-black ${
                      metric.color === 'emerald' ? 'text-emerald-400' :
                      metric.color === 'cyan' ? 'text-cyan-400' :
                      metric.color === 'amber' ? 'text-amber-400' :
                      'text-violet-400'
                    }`}>
                      {metric.value.toFixed(1)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${
                        metric.color === 'emerald' ? 'from-emerald-400 to-emerald-500' :
                        metric.color === 'cyan' ? 'from-cyan-400 to-cyan-500' :
                        metric.color === 'amber' ? 'from-amber-400 to-amber-500' :
                        'from-violet-400 to-violet-500'
                      }`}
                      style={{ width: `${(metric.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Stats - Desktop */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h4 className="text-base font-bold text-white">Quick Stats</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">Submissions</span>
                </div>
                <span className="text-lg font-bold text-white">{safeNum(stats.totalSubmissions)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-400">Issues Reported</span>
                </div>
                <span className="text-lg font-bold text-white">{totalIssues}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-400">Top Metric</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">{getTopMetric()}</span>
              </div>
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-violet-500/20 p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-violet-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <h4 className="text-base font-bold text-white">AI Insight</h4>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {overallAvg >= 4 
                ? "Excellent team performance! Your squad is consistently delivering across all metrics."
                : overallAvg >= 3
                ? "Good performance with room for improvement. Focus on the lower-rated areas."
                : "Team performance needs attention. Consider targeted training sessions."
              }
            </p>
            
            {metrics.filter(m => m.value < 3 && m.value > 0).length > 0 && (
              <div className="mt-3 pt-3 border-t border-violet-500/20">
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>Improve: {metrics.filter(m => m.value < 3 && m.value > 0).map(m => m.label === 'Spirit' ? 'Team Spirit' : m.label).join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSummary;
