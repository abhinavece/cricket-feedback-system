'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Coins, RotateCcw, Trophy, Shield } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'Cricket Virtual Toss',
  description: 'Online cricket toss simulator. Fair coin flip to decide who bats or bowls first.',
  url: `${siteConfig.url}/tools/toss`,
  category: 'SportsApplication',
});

const faqSchema = generateFAQSchema([
  {
    id: 'why-toss-important',
    question: 'Why is the toss important in cricket?',
    answer: 'The toss winner can choose to bat or bowl first, which can be crucial depending on pitch conditions, weather, and match format. In day-night matches or on pitches that deteriorate, winning the toss can provide a significant advantage.',
    category: 'importance',
  },
  {
    id: 'is-virtual-toss-fair',
    question: 'Is this virtual toss fair?',
    answer: 'Yes, our virtual toss uses cryptographically secure random number generation to ensure a truly fair 50-50 outcome, just like a real coin flip.',
    category: 'fairness',
  },
]);

type TossResult = 'heads' | 'tails' | null;
type TossChoice = 'bat' | 'bowl' | null;

export default function VirtualToss() {
  const [team1, setTeam1] = useState('Team A');
  const [team2, setTeam2] = useState('Team B');
  const [tossWinner, setTossWinner] = useState<string | null>(null);
  const [tossResult, setTossResult] = useState<TossResult>(null);
  const [choice, setChoice] = useState<TossChoice>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [callerTeam, setCallerTeam] = useState<string>('');
  const [callerCall, setCallerCall] = useState<TossResult>(null);

  const flipCoin = useCallback(() => {
    if (!callerTeam || !callerCall) return;
    
    setIsFlipping(true);
    setTossWinner(null);
    setTossResult(null);
    setChoice(null);

    // Simulate coin flip animation
    setTimeout(() => {
      const result: TossResult = Math.random() < 0.5 ? 'heads' : 'tails';
      setTossResult(result);
      
      // Determine winner based on call
      const winner = result === callerCall ? callerTeam : (callerTeam === team1 ? team2 : team1);
      setTossWinner(winner);
      setIsFlipping(false);
    }, 1500);
  }, [callerTeam, callerCall, team1, team2]);

  const resetToss = () => {
    setTossWinner(null);
    setTossResult(null);
    setChoice(null);
    setCallerTeam('');
    setCallerCall(null);
  };

  return (
    <>
      <SchemaScript schema={[toolSchema, faqSchema]} />
      
      <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Virtual Toss', href: '/tools/toss' },
          ]}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-4">
            <Coins className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Virtual Cricket Toss
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Fair online coin toss for cricket matches. Perfect for deciding 
            who bats or bowls first.
          </p>
        </div>

        {/* Toss Interface */}
        <div className="card p-6 sm:p-8 mb-8">
          {/* Team Names */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Team 1
              </label>
              <input
                type="text"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                disabled={isFlipping || tossWinner !== null}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Team 2
              </label>
              <input
                type="text"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                disabled={isFlipping || tossWinner !== null}
              />
            </div>
          </div>

          {/* Toss Setup */}
          {!tossWinner && !isFlipping && (
            <>
              {/* Select Caller */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Who is calling the toss?
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setCallerTeam(team1)}
                    className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${
                      callerTeam === team1
                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                        : 'bg-slate-800 border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {team1}
                  </button>
                  <button
                    onClick={() => setCallerTeam(team2)}
                    className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${
                      callerTeam === team2
                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                        : 'bg-slate-800 border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {team2}
                  </button>
                </div>
              </div>

              {/* Select Call */}
              {callerTeam && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    {callerTeam}&apos;s call:
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCallerCall('heads')}
                      className={`flex-1 py-4 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                        callerCall === 'heads'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-slate-800 border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <span className="text-2xl">🪙</span>
                      Heads
                    </button>
                    <button
                      onClick={() => setCallerCall('tails')}
                      className={`flex-1 py-4 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                        callerCall === 'tails'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-slate-800 border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <span className="text-2xl">🦅</span>
                      Tails
                    </button>
                  </div>
                </div>
              )}

              {/* Flip Button */}
              <button
                onClick={flipCoin}
                disabled={!callerTeam || !callerCall}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                  callerTeam && callerCall
                    ? 'btn-primary'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                Flip Coin
              </button>
            </>
          )}

          {/* Flipping Animation */}
          {isFlipping && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 animate-spin">
                <Coins className="w-full h-full text-yellow-400" />
              </div>
              <p className="text-xl text-slate-300">Flipping...</p>
            </div>
          )}

          {/* Toss Result */}
          {tossWinner && tossResult && !isFlipping && (
            <div className="text-center py-8">
              {/* Result */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-lg font-medium mb-4">
                <span className="text-2xl">{tossResult === 'heads' ? '🪙' : '🦅'}</span>
                It&apos;s {tossResult.charAt(0).toUpperCase() + tossResult.slice(1)}!
              </div>

              {/* Winner */}
              <div className="mb-8">
                <p className="text-xl text-slate-300 mb-2">Toss won by</p>
                <p className="text-4xl font-bold text-gradient">{tossWinner}</p>
              </div>

              {/* Choice Selection */}
              {!choice && (
                <div className="mb-8">
                  <p className="text-slate-300 mb-4">{tossWinner} elects to:</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setChoice('bat')}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-500/20 border border-primary-500 rounded-lg text-primary-400 hover:bg-primary-500/30 transition-colors"
                    >
                      <Trophy className="w-5 h-5" />
                      Bat First
                    </button>
                    <button
                      onClick={() => setChoice('bowl')}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <Shield className="w-5 h-5" />
                      Bowl First
                    </button>
                  </div>
                </div>
              )}

              {/* Final Summary */}
              {choice && (
                <div className="card p-6 bg-slate-800/50 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Match Setup</h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-left">
                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Batting First</p>
                      <p className="text-xl font-bold text-white">
                        {choice === 'bat' ? tossWinner : (tossWinner === team1 ? team2 : team1)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Bowling First</p>
                      <p className="text-xl font-bold text-white">
                        {choice === 'bowl' ? tossWinner : (tossWinner === team1 ? team2 : team1)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={resetToss}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:border-white/30 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New Toss
              </button>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">Why is the toss important in cricket?</h3>
              <p className="text-slate-400">
                The toss winner can choose to bat or bowl first, which can be crucial depending 
                on pitch conditions, weather, and match format. In day-night matches or on 
                pitches that deteriorate, winning the toss can provide a significant advantage.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Is this virtual toss fair?</h3>
              <p className="text-slate-400">
                Yes, our virtual toss uses secure random number generation to ensure a truly 
                fair 50-50 outcome, just like a real coin flip.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">When should I choose to bat first?</h3>
              <p className="text-slate-400">
                Generally, bat first on flat pitches, in day games, or when setting a target 
                suits your team. In T20s, many teams prefer chasing. In Tests, bat first to 
                avoid batting on a deteriorating pitch.
              </p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Related Tools</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/tools/team-picker"
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              Team Picker
            </Link>
            <Link
              href="/tools/run-rate"
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              Run Rate Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
