'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Plus, X, Shuffle, RotateCcw, Download } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateToolSchema, generateHowToSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const toolSchema = generateToolSchema({
  name: 'Cricket Team Picker',
  description: 'Randomly generate fair cricket teams from a pool of players. Perfect for practice matches and friendly games.',
  url: `${siteConfig.url}/tools/team-picker`,
  category: 'SportsApplication',
});

const howToSchema = generateHowToSchema({
  name: 'How to Create Fair Cricket Teams',
  description: 'Use the team picker to randomly divide players into balanced teams.',
  steps: [
    {
      name: 'Add Players',
      text: 'Enter the names of all players who will be participating in the match.',
    },
    {
      name: 'Set Team Count',
      text: 'Choose whether you want 2, 3, or 4 teams.',
    },
    {
      name: 'Shuffle Teams',
      text: 'Click the shuffle button to randomly assign players to teams.',
    },
    {
      name: 'Review & Adjust',
      text: 'Review the teams and shuffle again if needed for better balance.',
    },
  ],
});

const faqSchema = generateFAQSchema([
  {
    id: 'how-fair',
    question: 'How does the team picker ensure fair teams?',
    answer: 'The team picker uses a random shuffle algorithm to distribute players evenly across teams. For truly balanced teams based on skill, consider using the skill-based picker in the CricSmart app.',
    category: 'fairness',
  },
  {
    id: 'max-players',
    question: 'How many players can I add?',
    answer: 'You can add unlimited players. For standard cricket, 11 players per team is typical, but you can create smaller teams for practice games.',
    category: 'usage',
  },
]);

export default function TeamPicker() {
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);
  const [teamNames, setTeamNames] = useState(['Team A', 'Team B', 'Team C', 'Team D']);

  const addPlayer = () => {
    const trimmed = newPlayer.trim();
    if (trimmed && !players.includes(trimmed)) {
      setPlayers([...players, trimmed]);
      setNewPlayer('');
      setTeams([]); // Reset teams when players change
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
    setTeams([]); // Reset teams when players change
  };

  const addMultiplePlayers = (text: string) => {
    const names = text
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n && !players.includes(n));
    if (names.length > 0) {
      setPlayers([...players, ...names]);
      setTeams([]);
    }
  };

  const shuffleTeams = () => {
    if (players.length < teamCount) return;

    // Fisher-Yates shuffle
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Distribute to teams
    const newTeams: string[][] = Array.from({ length: teamCount }, () => []);
    shuffled.forEach((player, index) => {
      newTeams[index % teamCount].push(player);
    });

    setTeams(newTeams);
  };

  const resetAll = () => {
    setPlayers([]);
    setTeams([]);
    setNewPlayer('');
  };

  const copyTeams = () => {
    const text = teams
      .map((team, i) => `${teamNames[i]}:\n${team.map((p, j) => `${j + 1}. ${p}`).join('\n')}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  return (
    <>
      <SchemaScript schema={[toolSchema, howToSchema, faqSchema]} />
      
      <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Tools', href: '/tools' },
            { name: 'Team Picker', href: '/tools/team-picker' },
          ]}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            <span>Free Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Cricket Team Picker
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Randomly generate fair cricket teams. Perfect for practice matches 
            and friendly games.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Player Input */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Add Players ({players.length})
            </h2>

            {/* Single Player Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter player name"
                className="flex-1 px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={addPlayer}
                disabled={!newPlayer.trim()}
                className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Bulk Add */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Or paste multiple names (comma or newline separated):
              </label>
              <textarea
                placeholder="Player 1, Player 2, Player 3..."
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 h-20 resize-none"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addMultiplePlayers(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Player List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg"
                >
                  <span className="text-slate-300">
                    {index + 1}. {player}
                  </span>
                  <button
                    onClick={() => removePlayer(index)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-slate-500 text-center py-4">
                  No players added yet
                </p>
              )}
            </div>
          </div>

          {/* Team Configuration & Results */}
          <div className="space-y-6">
            {/* Configuration */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Number of Teams
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        setTeamCount(count);
                        setTeams([]);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        teamCount === count
                          ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                          : 'bg-slate-800 border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      {count} Teams
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Names */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Array.from({ length: teamCount }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    value={teamNames[i]}
                    onChange={(e) => {
                      const newNames = [...teamNames];
                      newNames[i] = e.target.value;
                      setTeamNames(newNames);
                    }}
                    className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={shuffleTeams}
                  disabled={players.length < teamCount}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle Teams
                </button>
                <button
                  onClick={resetAll}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:border-white/30 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {players.length > 0 && players.length < teamCount && (
                <p className="text-amber-400 text-sm mt-2">
                  Add at least {teamCount} players to create teams
                </p>
              )}
            </div>

            {/* Teams Display */}
            {teams.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Teams</h2>
                  <button
                    onClick={copyTeams}
                    className="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Copy
                  </button>
                </div>

                <div className="grid gap-4">
                  {teams.map((team, teamIndex) => (
                    <div
                      key={teamIndex}
                      className="bg-slate-800/50 border border-white/10 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-primary-400 mb-2">
                        {teamNames[teamIndex]} ({team.length} players)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {team.map((player, playerIndex) => (
                          <span
                            key={playerIndex}
                            className="px-3 py-1 bg-slate-700 rounded-full text-slate-300 text-sm"
                          >
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={shuffleTeams}
                  className="w-full mt-4 py-2 text-slate-400 hover:text-primary-400 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card p-6 sm:p-8 mt-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-white mb-2">How does the team picker ensure fair teams?</h3>
              <p className="text-slate-400">
                The team picker uses a random shuffle algorithm to distribute players evenly 
                across teams. Each player has an equal chance of being on any team.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Can I create skill-based teams?</h3>
              <p className="text-slate-400">
                This basic picker is random. For skill-based team creation that considers 
                player abilities, use the full CricSmart app which has player ratings and 
                smart team balancing.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">How many players can I add?</h3>
              <p className="text-slate-400">
                You can add unlimited players. For standard cricket, 11 players per team 
                is typical, but you can create smaller teams for practice games.
              </p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Related Tools</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/tools/toss"
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              Virtual Toss
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
