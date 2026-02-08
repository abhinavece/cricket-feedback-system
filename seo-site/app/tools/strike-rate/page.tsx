'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Info } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'Cricket Strike Rate Calculator',
  description: 'Calculate batting strike rate and bowling strike rate for cricket statistics.',
  url: `${siteConfig.url}/tools/strike-rate`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Calculate Strike Rate in Cricket',
  description: 'Learn how to calculate batting and bowling strike rates.',
  steps: [
    { name: 'For Batting', text: 'Enter runs scored and balls faced to get batting strike rate.' },
    { name: 'For Bowling', text: 'Enter balls bowled and wickets taken to get bowling strike rate.' },
    { name: 'View Results', text: 'The calculator shows both batting and bowling strike rates.' },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'batting-strike-rate',
    question: 'What is batting strike rate?',
    answer: 'Batting strike rate is the number of runs scored per 100 balls faced. Formula: (Runs / Balls) × 100. A strike rate of 150 means 150 runs per 100 balls.',
    category: 'definition',
  },
  {
    id: 'bowling-strike-rate',
    question: 'What is bowling strike rate?',
    answer: 'Bowling strike rate is the average number of balls bowled per wicket taken. Formula: Balls bowled / Wickets taken. Lower is better - it means you take wickets more frequently.',
    category: 'definition',
  },
]);

export default function StrikeRateCalculator() {
  const [battingRuns, setBattingRuns] = useState('');
  const [battingBalls, setBattingBalls] = useState('');
  const [bowlingBalls, setBowlingBalls] = useState('');
  const [bowlingWickets, setBowlingWickets] = useState('');

  const runs = parseInt(battingRuns) || 0;
  const ballsFaced = parseInt(battingBalls) || 0;
  const ballsBowled = parseInt(bowlingBalls) || 0;
  const wickets = parseInt(bowlingWickets) || 0;

  const battingStrikeRate = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(2) : '0.00';
  const bowlingStrikeRate = wickets > 0 ? (ballsBowled / wickets).toFixed(1) : '-';

  const getBattingSRRating = (sr: number): { label: string; color: string } => {
    if (sr >= 150) return { label: 'Excellent', color: 'text-green-400' };
    if (sr >= 130) return { label: 'Very Good', color: 'text-emerald-400' };
    if (sr >= 100) return { label: 'Good', color: 'text-blue-400' };
    if (sr >= 80) return { label: 'Average', color: 'text-yellow-400' };
    return { label: 'Slow', color: 'text-red-400' };
  };

  const getBowlingSRRating = (sr: number): { label: string; color: string } => {
    if (sr <= 20) return { label: 'Excellent', color: 'text-green-400' };
    if (sr <= 30) return { label: 'Very Good', color: 'text-emerald-400' };
    if (sr <= 40) return { label: 'Good', color: 'text-blue-400' };
    if (sr <= 50) return { label: 'Average', color: 'text-yellow-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const battingRating = getBattingSRRating(parseFloat(battingStrikeRate));
  const bowlingRating = wickets > 0 ? getBowlingSRRating(parseFloat(bowlingStrikeRate)) : null;

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div className="pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Strike Rate Calculator', href: '/tools/strike-rate' },
          ]}
        />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Strike Rate Calculator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Calculate batting and bowling strike rates for cricket statistics and analysis.
          </p>
        </div>

        {/* Batting Strike Rate */}
        <div className="card p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">🏏</span>
            Batting Strike Rate
          </h3>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Runs Scored
              </label>
              <input
                type="number"
                value={battingRuns}
                onChange={(e) => setBattingRuns(e.target.value)}
                placeholder="e.g., 75"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Balls Faced
              </label>
              <input
                type="number"
                value={battingBalls}
                onChange={(e) => setBattingBalls(e.target.value)}
                placeholder="e.g., 50"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary-400">
                  {battingStrikeRate}
                </div>
                <div className="text-sm text-slate-400">Batting Strike Rate</div>
              </div>
              {ballsFaced > 0 && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${battingRating.color} bg-slate-800`}>
                  {battingRating.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bowling Strike Rate */}
        <div className="card p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">🎾</span>
            Bowling Strike Rate
          </h3>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Balls Bowled
              </label>
              <input
                type="number"
                value={bowlingBalls}
                onChange={(e) => setBowlingBalls(e.target.value)}
                placeholder="e.g., 120"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Wickets Taken
              </label>
              <input
                type="number"
                value={bowlingWickets}
                onChange={(e) => setBowlingWickets(e.target.value)}
                placeholder="e.g., 4"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-400">
                  {bowlingStrikeRate}
                </div>
                <div className="text-sm text-slate-400">Bowling Strike Rate (balls per wicket)</div>
              </div>
              {bowlingRating && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${bowlingRating.color} bg-slate-800`}>
                  {bowlingRating.label}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Strike Rate Formulas</h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Batting Strike Rate:</p>
              <code className="text-primary-400">SR = (Runs Scored ÷ Balls Faced) × 100</code>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Bowling Strike Rate:</p>
              <code className="text-primary-400">SR = Balls Bowled ÷ Wickets Taken</code>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Key Difference</p>
                <p className="text-slate-400 text-sm">
                  For <span className="text-blue-400">batting</span>, higher is better (more runs per ball). 
                  For <span className="text-orange-400">bowling</span>, lower is better (fewer balls to take a wicket).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Strike Rate Benchmarks</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-white mb-3">Batting (T20)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Excellent</span><span className="text-green-400">150+</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Very Good</span><span className="text-emerald-400">130-150</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Good</span><span className="text-blue-400">100-130</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Average</span><span className="text-yellow-400">80-100</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-white mb-3">Bowling (T20)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Excellent</span><span className="text-green-400">&lt;20</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Very Good</span><span className="text-emerald-400">20-30</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Good</span><span className="text-blue-400">30-40</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Average</span><span className="text-yellow-400">40-50</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Related Tools</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/tools/run-rate" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Run Rate Calculator
            </Link>
            <Link href="/tools/overs" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Overs Converter
            </Link>
            <Link href="/tools/nrr" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Net Run Rate Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
