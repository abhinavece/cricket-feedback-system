'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Target, Info } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'Cricket Target Calculator',
  description: 'Calculate the target score needed to win a cricket match based on first innings score.',
  url: `${siteConfig.url}/tools/target`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Calculate Cricket Target',
  description: 'Learn how to calculate targets and winning margins in cricket.',
  steps: [
    { name: 'Enter First Innings Score', text: 'Enter the score made by the team batting first.' },
    { name: 'Select Match Format', text: 'Choose between Test, ODI, or T20 format.' },
    { name: 'View Target', text: 'The calculator shows the target score and required run rate.' },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'what-is-target',
    question: 'How is target calculated in cricket?',
    answer: 'The target in cricket is simply the first innings score plus one. The chasing team needs to score more than the first innings total to win.',
    category: 'definition',
  },
]);

export default function TargetCalculator() {
  const [firstInningsScore, setFirstInningsScore] = useState('');
  const [totalOvers, setTotalOvers] = useState('20');
  const [currentScore, setCurrentScore] = useState('');
  const [oversPlayed, setOversPlayed] = useState('');

  const parseOvers = (oversStr: string): number => {
    if (!oversStr) return 0;
    const parts = oversStr.split('.');
    const completeOvers = parseInt(parts[0]) || 0;
    const balls = parts[1] ? parseInt(parts[1]) : 0;
    return completeOvers + balls / 6;
  };

  const score = parseInt(firstInningsScore) || 0;
  const target = score + 1;
  const overs = parseInt(totalOvers) || 20;
  const current = parseInt(currentScore) || 0;
  const played = parseOvers(oversPlayed);

  const requiredRunRate = overs > 0 ? (target / overs).toFixed(2) : '0.00';
  const runsNeeded = target - current;
  const oversRemaining = overs - played;
  const currentRequiredRR = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : '0.00';
  
  // Win probability (simplified)
  const getWinProbability = (): number => {
    if (current >= target) return 100;
    if (runsNeeded <= 0) return 100;
    if (oversRemaining <= 0) return 0;
    
    const rrRatio = parseFloat(currentRequiredRR) / 10; // Assuming 10 is max sustainable RR
    return Math.max(0, Math.min(100, Math.round((1 - rrRatio) * 100)));
  };

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div className="pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Target Calculator', href: '/tools/target' },
          ]}
        />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Target Calculator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Calculate the target score needed to win and track chase progress 
            in any cricket match.
          </p>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">First Innings</h3>
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                First Innings Score
              </label>
              <input
                type="number"
                value={firstInningsScore}
                onChange={(e) => setFirstInningsScore(e.target.value)}
                placeholder="e.g., 180"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total Overs
              </label>
              <select
                value={totalOvers}
                onChange={(e) => setTotalOvers(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="20">20 (T20)</option>
                <option value="50">50 (ODI)</option>
                <option value="10">10 (Super Over format)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold text-primary-400 mb-1">
                {score > 0 ? target : '-'}
              </div>
              <div className="text-sm text-slate-400">Target to Win</div>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-1">
                {score > 0 ? requiredRunRate : '-'}
              </div>
              <div className="text-sm text-slate-400">Required Run Rate</div>
            </div>
          </div>

          {score > 0 && (
            <>
              <h3 className="text-lg font-semibold text-white mb-4 pt-4 border-t border-white/10">
                Chase Tracker (Optional)
              </h3>
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Current Score
                  </label>
                  <input
                    type="number"
                    value={currentScore}
                    onChange={(e) => setCurrentScore(e.target.value)}
                    placeholder="e.g., 85"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Overs Played
                  </label>
                  <input
                    type="text"
                    value={oversPlayed}
                    onChange={(e) => setOversPlayed(e.target.value)}
                    placeholder="e.g., 10.3"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {current > 0 && played > 0 && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {runsNeeded > 0 ? runsNeeded : 'WON!'}
                    </div>
                    <div className="text-sm text-slate-400">Runs Needed</div>
                  </div>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-1">
                      {oversRemaining.toFixed(1)}
                    </div>
                    <div className="text-sm text-slate-400">Overs Left</div>
                  </div>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400 mb-1">
                      {currentRequiredRR}
                    </div>
                    <div className="text-sm text-slate-400">Current Req. RR</div>
                  </div>
                </div>
              )}
            </>
          )}

          {score > 0 && (
            <div className="mt-6 p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Chase Summary</p>
                  <p className="text-slate-400 text-sm">
                    Team 2 needs <span className="text-white font-medium">{target} runs</span> to win from{' '}
                    <span className="text-white font-medium">{overs} overs</span> at{' '}
                    <span className="text-white font-medium">{requiredRunRate} runs per over</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">How is the target calculated?</h3>
              <p className="text-slate-400">
                The target is the first innings score plus one. To win, the chasing team 
                must score at least one more run than what the first team scored.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">What is a good chase rate in T20?</h3>
              <p className="text-slate-400">
                In T20 cricket, a required run rate of 8-9 is manageable for most teams. 
                Above 12 becomes very difficult, while below 7 is considered comfortable.
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
            <Link href="/tools/dls" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              DLS Calculator
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
