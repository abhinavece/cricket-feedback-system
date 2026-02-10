'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

// Schemas for SEO
const toolSchema = generateToolSchema({
  name: 'Cricket Run Rate Calculator',
  description: 'Calculate current run rate, required run rate, and projected scores for cricket matches.',
  url: `${siteConfig.url}/tools/run-rate`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Calculate Cricket Run Rate',
  description: 'Learn how to use the run rate calculator to analyze cricket match situations.',
  steps: [
    {
      name: 'Enter Current Score',
      text: 'Enter the total runs scored so far by the batting team.',
    },
    {
      name: 'Enter Overs Faced',
      text: 'Enter the number of overs bowled (e.g., 12.3 for 12 overs and 3 balls).',
    },
    {
      name: 'Enter Target (Optional)',
      text: 'For chasing situations, enter the target score to calculate required run rate.',
    },
    {
      name: 'Enter Total Overs (Optional)',
      text: 'Enter total overs in the innings for projected score and required rate calculations.',
    },
    {
      name: 'View Results',
      text: 'The calculator shows current run rate, required run rate, and projected score.',
    },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'what-is-run-rate',
    question: 'What is run rate in cricket?',
    answer: 'Run rate is the average number of runs scored per over. It is calculated by dividing total runs by overs faced. A run rate of 6.0 means the team scores 6 runs per over on average.',
    category: 'definition',
  },
  {
    id: 'calculate-required-run-rate',
    question: 'How do you calculate required run rate?',
    answer: 'Required run rate is calculated by dividing runs needed by overs remaining. Formula: Required RR = (Target - Current Score) / (Total Overs - Overs Faced).',
    category: 'formula',
  },
  {
    id: 'good-run-rate-t20',
    question: 'What is a good run rate in T20 cricket?',
    answer: 'In T20 cricket, a run rate of 8-9 is considered average. A run rate above 10 is excellent, while below 7 is usually considered slow.',
    category: 'context',
  },
]);

export default function RunRateCalculator() {
  const [runs, setRuns] = useState('');
  const [overs, setOvers] = useState('');
  const [target, setTarget] = useState('');
  const [totalOvers, setTotalOvers] = useState('20');

  // Parse overs (e.g., "12.3" means 12 overs and 3 balls)
  const parseOvers = (oversStr: string): number => {
    if (!oversStr) return 0;
    const parts = oversStr.split('.');
    const completeOvers = parseInt(parts[0]) || 0;
    const balls = parts[1] ? parseInt(parts[1]) : 0;
    return completeOvers + balls / 6;
  };

  const currentRuns = parseInt(runs) || 0;
  const oversPlayed = parseOvers(overs);
  const targetRuns = parseInt(target) || 0;
  const totalOversNum = parseOvers(totalOvers);

  // Calculations
  const currentRunRate = oversPlayed > 0 ? (currentRuns / oversPlayed).toFixed(2) : '0.00';
  const oversRemaining = totalOversNum - oversPlayed;
  const runsNeeded = targetRuns > 0 ? targetRuns - currentRuns : 0;
  const requiredRunRate = oversRemaining > 0 && runsNeeded > 0 
    ? (runsNeeded / oversRemaining).toFixed(2) 
    : '0.00';
  const projectedScore = oversPlayed > 0 
    ? Math.round((currentRuns / oversPlayed) * totalOversNum) 
    : 0;

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div className="pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Run Rate Calculator', href: '/tools/run-rate' },
          ]}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Run Rate Calculator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Calculate current run rate, required run rate, and projected scores 
            for any cricket match situation.
          </p>
        </div>

        {/* Calculator */}
        <div className="card p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {/* Current Score */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current Score (Runs)
              </label>
              <input
                type="number"
                value={runs}
                onChange={(e) => setRuns(e.target.value)}
                placeholder="e.g., 120"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Overs Played */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Overs Played
              </label>
              <input
                type="text"
                value={overs}
                onChange={(e) => setOvers(e.target.value)}
                placeholder="e.g., 12.3"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-slate-500 mt-1">Use decimal for balls (12.3 = 12 overs, 3 balls)</p>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Score (Optional)
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g., 180"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Total Overs */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total Overs in Innings
              </label>
              <select
                value={totalOvers}
                onChange={(e) => setTotalOvers(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="20">20 (T20)</option>
                <option value="50">50 (ODI)</option>
                <option value="10">10 (The Hundred - 10 sets)</option>
                <option value="5">5 (Super Over format)</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-primary-400 mb-1">
                {currentRunRate}
              </div>
              <div className="text-sm text-slate-400">Current Run Rate</div>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {requiredRunRate}
              </div>
              <div className="text-sm text-slate-400">Required Run Rate</div>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {projectedScore}
              </div>
              <div className="text-sm text-slate-400">Projected Score</div>
            </div>
          </div>

          {/* Chase Summary */}
          {targetRuns > 0 && oversPlayed > 0 && (
            <div className="mt-6 p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Chase Summary</p>
                  <p className="text-slate-400 text-sm">
                    Need <span className="text-white font-medium">{runsNeeded} runs</span> from{' '}
                    <span className="text-white font-medium">{oversRemaining.toFixed(1)} overs</span> at{' '}
                    <span className="text-white font-medium">{requiredRunRate} runs per over</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formula Section */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">How Run Rate is Calculated</h2>
          <div className="space-y-4 text-slate-300">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Current Run Rate Formula:</p>
              <code className="text-primary-400">Run Rate = Total Runs ÷ Overs Faced</code>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Required Run Rate Formula:</p>
              <code className="text-primary-400">Required RR = Runs Needed ÷ Overs Remaining</code>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Projected Score Formula:</p>
              <code className="text-primary-400">Projected = Current Run Rate × Total Overs</code>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">What is run rate in cricket?</h3>
              <p className="text-slate-400">
                Run rate is the average number of runs scored per over. It is calculated by 
                dividing total runs by overs faced. A run rate of 6.0 means the team scores 
                6 runs per over on average.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">How do you calculate required run rate?</h3>
              <p className="text-slate-400">
                Required run rate is calculated by dividing runs needed by overs remaining. 
                For example, if you need 60 runs in 10 overs, the required run rate is 6.0.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">What is a good run rate in T20?</h3>
              <p className="text-slate-400">
                In T20 cricket, a run rate of 8-9 is considered average. A run rate above 10 
                is excellent, while below 7 is usually considered slow. In powerplay overs, 
                teams often target 9-10+ run rate.
              </p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Related Tools</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/tools/dls"
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              DLS Calculator
            </Link>
            <Link
              href="/tools/nrr"
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              Net Run Rate Calculator
            </Link>
            <Link
              href="/tools/target"
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              Target Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
