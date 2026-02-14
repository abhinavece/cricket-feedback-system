'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRightLeft, Info } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'Cricket Overs Converter',
  description: 'Convert between overs and balls in cricket. Understand cricket overs notation (e.g., 12.3 = 12 overs 3 balls = 75 balls).',
  url: `${siteConfig.url}/tools/overs`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Convert Overs to Balls',
  description: 'Learn how to convert between overs and balls in cricket.',
  steps: [
    { name: 'Enter Overs', text: 'Enter overs in cricket notation (e.g., 12.3 for 12 overs and 3 balls).' },
    { name: 'Or Enter Balls', text: 'Alternatively, enter the total number of balls.' },
    { name: 'View Conversion', text: 'The tool shows the equivalent in both formats.' },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'overs-notation',
    question: 'How does cricket overs notation work?',
    answer: 'In cricket, overs are written as X.Y where X is complete overs and Y is additional balls. Since there are 6 balls per over, 12.3 means 12 complete overs plus 3 balls = 75 balls total.',
    category: 'definition',
  },
  {
    id: 'balls-per-over',
    question: 'How many balls are in a cricket over?',
    answer: 'There are 6 legal deliveries (balls) in one cricket over. Wides and no-balls don\'t count toward the 6 balls.',
    category: 'rules',
  },
]);

export default function OversConverter() {
  const [oversInput, setOversInput] = useState('');
  const [ballsInput, setBallsInput] = useState('');
  const [activeInput, setActiveInput] = useState<'overs' | 'balls'>('overs');

  const parseOversToTotalBalls = (oversStr: string): number => {
    if (!oversStr) return 0;
    const parts = oversStr.split('.');
    const completeOvers = parseInt(parts[0]) || 0;
    const balls = parts[1] ? parseInt(parts[1]) : 0;
    return completeOvers * 6 + balls;
  };

  const totalBallsToOvers = (balls: number): string => {
    const completeOvers = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return remainingBalls > 0 ? `${completeOvers}.${remainingBalls}` : `${completeOvers}`;
  };

  const handleOversChange = (value: string) => {
    setOversInput(value);
    setActiveInput('overs');
    const totalBalls = parseOversToTotalBalls(value);
    setBallsInput(totalBalls.toString());
  };

  const handleBallsChange = (value: string) => {
    setBallsInput(value);
    setActiveInput('balls');
    const balls = parseInt(value) || 0;
    setOversInput(totalBallsToOvers(balls));
  };

  const totalBalls = activeInput === 'overs' ? parseOversToTotalBalls(oversInput) : parseInt(ballsInput) || 0;
  const oversDisplay = totalBallsToOvers(totalBalls);

  // Common conversions
  const commonFormats = [
    { name: 'T20', overs: 20, balls: 120 },
    { name: 'ODI', overs: 50, balls: 300 },
    { name: 'T10', overs: 10, balls: 60 },
    { name: 'The Hundred', overs: 16.4, balls: 100 },
  ];

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Overs Converter', href: '/tools/overs' },
          ]}
        />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <Clock className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Overs Converter
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Convert between cricket overs notation and total balls. 
            Understand how overs work in cricket.
          </p>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Overs (cricket notation)
              </label>
              <input
                type="text"
                value={oversInput}
                onChange={(e) => handleOversChange(e.target.value)}
                placeholder="e.g., 12.3"
                className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none ${
                  activeInput === 'overs' ? 'border-primary-500' : 'border-white/10'
                }`}
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: X.Y (X overs, Y balls)
              </p>
            </div>

            <div className="flex items-center justify-center sm:hidden">
              <ArrowRightLeft className="w-6 h-6 text-slate-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total Balls
              </label>
              <input
                type="number"
                value={ballsInput}
                onChange={(e) => handleBallsChange(e.target.value)}
                placeholder="e.g., 75"
                className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none ${
                  activeInput === 'balls' ? 'border-primary-500' : 'border-white/10'
                }`}
              />
              <p className="text-xs text-slate-500 mt-1">
                6 balls = 1 over
              </p>
            </div>
          </div>

          {totalBalls > 0 && (
            <div className="mt-6 p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Conversion Result</p>
                  <p className="text-slate-400 text-sm">
                    <span className="text-primary-400 font-medium">{oversDisplay}</span> overs = 
                    <span className="text-primary-400 font-medium"> {totalBalls}</span> balls = 
                    <span className="text-primary-400 font-medium"> {Math.floor(totalBalls / 6)}</span> complete overs + 
                    <span className="text-primary-400 font-medium"> {totalBalls % 6}</span> balls
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Common Formats */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Common Cricket Formats</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {commonFormats.map((format) => (
              <button
                key={format.name}
                onClick={() => handleBallsChange(format.balls.toString())}
                className="p-4 bg-slate-800/50 border border-white/10 rounded-xl hover:border-primary-500/50 transition-colors text-left"
              >
                <div className="text-lg font-bold text-white mb-1">{format.name}</div>
                <div className="text-sm text-slate-400">
                  {format.overs} overs = {format.balls} balls
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Reference Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 px-3">Overs</th>
                  <th className="text-left py-2 px-3">Balls</th>
                  <th className="text-left py-2 px-3">Meaning</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  { overs: '5.0', balls: 30, meaning: '5 complete overs' },
                  { overs: '5.3', balls: 33, meaning: '5 overs and 3 balls' },
                  { overs: '10.5', balls: 65, meaning: '10 overs and 5 balls' },
                  { overs: '15.1', balls: 91, meaning: '15 overs and 1 ball' },
                  { overs: '19.4', balls: 118, meaning: '19 overs and 4 balls' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 px-3 text-primary-400 font-mono">{row.overs}</td>
                    <td className="py-2 px-3 font-mono">{row.balls}</td>
                    <td className="py-2 px-3 text-slate-400">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">How does cricket overs notation work?</h3>
              <p className="text-slate-400">
                Cricket uses X.Y notation where X is complete overs and Y is the number of balls 
                in the current over. Since each over has 6 balls, 12.3 means 12 overs + 3 balls = 75 total balls.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Why can&apos;t overs have .6 or higher?</h3>
              <p className="text-slate-400">
                Since an over is complete after 6 balls, you&apos;ll never see 12.6 - that would be written 
                as 13.0 (13 complete overs). Valid decimal values are .1 through .5 only.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">What about extras like wides and no-balls?</h3>
              <p className="text-slate-400">
                Wides and no-balls don&apos;t count toward the 6 legal deliveries needed to complete an over. 
                The bowler must deliver 6 legal balls regardless of extras bowled.
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
            <Link href="/tools/strike-rate" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Strike Rate Calculator
            </Link>
            <Link href="/tools/target" className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors">
              Target Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
