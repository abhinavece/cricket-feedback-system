'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Plus, Trash2, Info } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'Net Run Rate (NRR) Calculator',
  description: 'Calculate Net Run Rate for cricket tournament standings. Essential for league stage qualification.',
  url: `${siteConfig.url}/tools/nrr`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Calculate Net Run Rate',
  description: 'Learn how to calculate NRR for cricket tournaments.',
  steps: [
    { name: 'Add Match Results', text: 'Enter runs scored, overs faced, runs conceded, and overs bowled for each match.' },
    { name: 'Include All Matches', text: 'Add all completed matches in the tournament.' },
    { name: 'View NRR', text: 'The calculator shows your team\'s net run rate based on all matches.' },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'what-is-nrr',
    question: 'What is Net Run Rate in cricket?',
    answer: 'Net Run Rate (NRR) is the difference between the run rate a team scores at and the run rate they concede. It\'s used to separate teams on equal points in tournament standings.',
    category: 'definition',
  },
  {
    id: 'nrr-formula',
    question: 'How is NRR calculated?',
    answer: 'NRR = (Total runs scored / Total overs faced) - (Total runs conceded / Total overs bowled). A positive NRR means you score faster than you concede.',
    category: 'formula',
  },
]);

interface Match {
  id: number;
  runsScored: string;
  oversFaced: string;
  runsConceded: string;
  oversBowled: string;
}

export default function NRRCalculator() {
  const [matches, setMatches] = useState<Match[]>([
    { id: 1, runsScored: '', oversFaced: '', runsConceded: '', oversBowled: '' },
  ]);

  const parseOvers = (oversStr: string): number => {
    if (!oversStr) return 0;
    const parts = oversStr.split('.');
    const completeOvers = parseInt(parts[0]) || 0;
    const balls = parts[1] ? parseInt(parts[1]) : 0;
    return completeOvers + balls / 6;
  };

  const addMatch = () => {
    setMatches([
      ...matches,
      { id: Date.now(), runsScored: '', oversFaced: '', runsConceded: '', oversBowled: '' },
    ]);
  };

  const removeMatch = (id: number) => {
    if (matches.length > 1) {
      setMatches(matches.filter((m) => m.id !== id));
    }
  };

  const updateMatch = (id: number, field: keyof Match, value: string) => {
    setMatches(
      matches.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Calculate totals
  const totals = matches.reduce(
    (acc, match) => {
      acc.runsScored += parseInt(match.runsScored) || 0;
      acc.oversFaced += parseOvers(match.oversFaced);
      acc.runsConceded += parseInt(match.runsConceded) || 0;
      acc.oversBowled += parseOvers(match.oversBowled);
      return acc;
    },
    { runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0 }
  );

  const runRateFor = totals.oversFaced > 0 ? totals.runsScored / totals.oversFaced : 0;
  const runRateAgainst = totals.oversBowled > 0 ? totals.runsConceded / totals.oversBowled : 0;
  const nrr = runRateFor - runRateAgainst;

  const getNRRColor = (value: number): string => {
    if (value > 0.5) return 'text-green-400';
    if (value > 0) return 'text-emerald-400';
    if (value > -0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Net Run Rate Calculator', href: '/tools/nrr' },
          ]}
        />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <BarChart3 className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Net Run Rate Calculator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Calculate your team&apos;s NRR for tournament standings. 
            Essential for league stage qualification scenarios.
          </p>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Match Results</h3>
            <button
              onClick={addMatch}
              className="flex items-center gap-2 px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Match
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="p-4 bg-slate-800/50 border border-white/10 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-400">
                    Match {index + 1}
                  </span>
                  {matches.length > 1 && (
                    <button
                      onClick={() => removeMatch(match.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Runs Scored</label>
                    <input
                      type="number"
                      value={match.runsScored}
                      onChange={(e) => updateMatch(match.id, 'runsScored', e.target.value)}
                      placeholder="180"
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Overs Faced</label>
                    <input
                      type="text"
                      value={match.oversFaced}
                      onChange={(e) => updateMatch(match.id, 'oversFaced', e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Runs Conceded</label>
                    <input
                      type="number"
                      value={match.runsConceded}
                      onChange={(e) => updateMatch(match.id, 'runsConceded', e.target.value)}
                      placeholder="160"
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Overs Bowled</label>
                    <input
                      type="text"
                      value={match.oversBowled}
                      onChange={(e) => updateMatch(match.id, 'oversBowled', e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {runRateFor.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Run Rate For</div>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1">
                {runRateAgainst.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Run Rate Against</div>
            </div>

            <div className="sm:col-span-2 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className={`text-3xl font-bold mb-1 ${getNRRColor(nrr)}`}>
                {nrr >= 0 ? '+' : ''}{nrr.toFixed(3)}
              </div>
              <div className="text-sm text-slate-400">Net Run Rate</div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 border border-white/10 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">NRR Summary</p>
                <p className="text-slate-400 text-sm">
                  Total: <span className="text-white">{totals.runsScored}</span> runs scored in{' '}
                  <span className="text-white">{totals.oversFaced.toFixed(1)}</span> overs |{' '}
                  <span className="text-white">{totals.runsConceded}</span> runs conceded in{' '}
                  <span className="text-white">{totals.oversBowled.toFixed(1)}</span> overs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">How NRR is Calculated</h2>
          <div className="space-y-4 text-slate-300">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Net Run Rate Formula:</p>
              <code className="text-primary-400">NRR = (Runs Scored ÷ Overs Faced) - (Runs Conceded ÷ Overs Bowled)</code>
            </div>
            <p>
              A positive NRR means your team scores runs faster than it concedes them. 
              In tournaments, teams with the same points are ranked by NRR.
            </p>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">What is a good NRR?</h3>
              <p className="text-slate-400">
                An NRR above +1.0 is considered excellent. Between 0 and +0.5 is decent. 
                A negative NRR means you&apos;re conceding runs faster than scoring them.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">How do all-out innings affect NRR?</h3>
              <p className="text-slate-400">
                When a team is all out, they&apos;re considered to have used all allocated overs 
                (e.g., 20 in T20), even if they got out earlier. This impacts NRR calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Related Tools</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/tools/run-rate" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Run Rate Calculator
            </Link>
            <Link href="/tools/target" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Target Calculator
            </Link>
            <Link href="/tools/dls" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              DLS Calculator
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
