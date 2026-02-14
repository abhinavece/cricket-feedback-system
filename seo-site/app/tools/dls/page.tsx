'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Info } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'DLS Calculator - Duckworth Lewis Stern Method',
  description: 'Calculate revised targets using the Duckworth-Lewis-Stern method for rain-affected cricket matches.',
  url: `${siteConfig.url}/tools/dls`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Calculate DLS Target',
  description: 'Learn how to use the DLS calculator for rain-affected matches.',
  steps: [
    { name: 'Enter First Innings Score', text: 'Enter the score set by the team batting first.' },
    { name: 'Enter Original Overs', text: 'Enter the original number of overs allocated (e.g., 50 for ODI).' },
    { name: 'Enter Revised Overs', text: 'Enter the revised number of overs for the chasing team.' },
    { name: 'Enter Wickets Lost', text: 'If interruption occurred mid-innings, enter wickets lost at that point.' },
    { name: 'View DLS Target', text: 'The calculator shows the revised target using DLS method.' },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'what-is-dls',
    question: 'What is the DLS method in cricket?',
    answer: 'The Duckworth-Lewis-Stern (DLS) method is a mathematical formula used to calculate revised targets in rain-affected limited-overs cricket matches. It considers resources (overs and wickets) available to each team.',
    category: 'definition',
  },
  {
    id: 'when-dls-applied',
    question: 'When is DLS applied?',
    answer: 'DLS is applied when weather interruptions reduce the number of overs available to one or both teams, ensuring a fair target based on resources consumed and remaining.',
    category: 'rules',
  },
]);

export default function DLSCalculator() {
  const [firstInningsScore, setFirstInningsScore] = useState('');
  const [originalOvers, setOriginalOvers] = useState('50');
  const [revisedOvers, setRevisedOvers] = useState('');
  const [wicketsLost, setWicketsLost] = useState('0');
  const [oversAtInterruption, setOversAtInterruption] = useState('');

  // Simplified DLS resource percentage table (approximation)
  const getResourcePercentage = (overs: number, wickets: number, totalOvers: number): number => {
    // Simplified calculation - actual DLS uses complex tables
    const oversPercentage = (overs / totalOvers) * 100;
    const wicketFactor = 1 - (wickets * 0.08); // ~8% per wicket lost
    return Math.min(100, oversPercentage * wicketFactor);
  };

  const score = parseInt(firstInningsScore) || 0;
  const origOvers = parseInt(originalOvers) || 50;
  const revOvers = parseInt(revisedOvers) || 0;
  const wickets = parseInt(wicketsLost) || 0;
  const interruptionOvers = parseFloat(oversAtInterruption) || 0;

  // Calculate resources
  const team1Resources = getResourcePercentage(origOvers, 0, origOvers);
  const team2Resources = getResourcePercentage(revOvers, wickets, origOvers);
  
  // DLS target calculation (simplified)
  const resourceRatio = team2Resources / team1Resources;
  const dlsTarget = revOvers > 0 ? Math.ceil(score * resourceRatio) + 1 : 0;
  const parScore = revOvers > 0 ? Math.ceil(score * resourceRatio) : 0;

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'DLS Calculator', href: '/tools/dls' },
          ]}
        />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            DLS Calculator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Calculate revised targets using the Duckworth-Lewis-Stern method 
            for rain-affected cricket matches.
          </p>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                First Innings Score
              </label>
              <input
                type="number"
                value={firstInningsScore}
                onChange={(e) => setFirstInningsScore(e.target.value)}
                placeholder="e.g., 280"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Original Overs Allocated
              </label>
              <select
                value={originalOvers}
                onChange={(e) => setOriginalOvers(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="50">50 (ODI)</option>
                <option value="20">20 (T20)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Revised Overs for Team 2
              </label>
              <input
                type="number"
                value={revisedOvers}
                onChange={(e) => setRevisedOvers(e.target.value)}
                placeholder="e.g., 40"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Wickets Lost at Interruption
              </label>
              <select
                value={wicketsLost}
                onChange={(e) => setWicketsLost(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((w) => (
                  <option key={w} value={w}>{w} wickets</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-primary-400 mb-1">
                {dlsTarget || '-'}
              </div>
              <div className="text-sm text-slate-400">DLS Target</div>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {parScore || '-'}
              </div>
              <div className="text-sm text-slate-400">Par Score</div>
            </div>
          </div>

          {dlsTarget > 0 && (
            <div className="mt-6 p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">DLS Summary</p>
                  <p className="text-slate-400 text-sm">
                    Team 2 needs <span className="text-white font-medium">{dlsTarget} runs</span> from{' '}
                    <span className="text-white font-medium">{revOvers} overs</span> to win.
                    Par score at any point is <span className="text-white font-medium">{parScore}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> This is a simplified DLS calculator for educational purposes. 
              Official matches use ICC-approved DLS software with detailed resource tables.
            </p>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Understanding DLS</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              The Duckworth-Lewis-Stern (DLS) method is used in limited-overs cricket to calculate 
              fair targets when rain or other interruptions affect a match.
            </p>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Key Concept:</p>
              <code className="text-primary-400">Resources = Overs Remaining × Wickets in Hand</code>
            </div>
            <p>
              The method ensures that both teams have access to equivalent &quot;resources&quot; 
              (combination of overs and wickets) to score runs.
            </p>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">What is the DLS method?</h3>
              <p className="text-slate-400">
                DLS is a mathematical formula to calculate fair targets in rain-affected matches. 
                It replaced the original Duckworth-Lewis method and is now the ICC standard.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">When is DLS applied?</h3>
              <p className="text-slate-400">
                DLS is applied when weather interruptions reduce overs available to one or both teams, 
                or when the match needs to be decided due to time constraints.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Why is wickets important in DLS?</h3>
              <p className="text-slate-400">
                Wickets represent &quot;resources&quot; - a team with 10 overs and 5 wickets in hand 
                has more scoring potential than a team with 10 overs and only 2 wickets remaining.
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
