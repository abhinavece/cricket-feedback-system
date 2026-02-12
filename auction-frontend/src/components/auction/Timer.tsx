'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  expiresAt: string | null;
  phase: 'open' | 'going_once' | 'going_twice' | 'revealed' | string;
  className?: string;
}

const PHASE_LABELS: Record<string, string> = {
  revealed: 'REVEALING',
  open: 'BIDDING OPEN',
  going_once: 'GOING ONCE',
  going_twice: 'GOING TWICE',
};

const PHASE_COLORS: Record<string, string> = {
  revealed: 'text-blue-400',
  open: 'text-emerald-400',
  going_once: 'text-amber-400',
  going_twice: 'text-red-400',
};

const PHASE_BG: Record<string, string> = {
  revealed: 'from-blue-500/20 to-cyan-500/20',
  open: 'from-emerald-500/20 to-teal-500/20',
  going_once: 'from-amber-500/20 to-orange-500/20',
  going_twice: 'from-red-500/20 to-rose-500/20',
};

export default function Timer({ expiresAt, phase, className = '' }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const label = PHASE_LABELS[phase] || phase.toUpperCase();
  const color = PHASE_COLORS[phase] || 'text-slate-400';
  const bg = PHASE_BG[phase] || 'from-slate-500/20 to-slate-600/20';
  const isUrgent = phase === 'going_twice' || (phase === 'going_once' && secondsLeft <= 2);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`text-xs font-bold uppercase tracking-[0.2em] ${color} ${isUrgent ? 'animate-pulse' : ''}`}>
        {label}
      </div>
      <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center border border-white/10 ${isUrgent ? 'ring-2 ring-red-500/50' : ''}`}>
        <span className={`text-4xl sm:text-5xl font-bold font-mono ${color} ${isUrgent ? 'animate-pulse' : ''}`}>
          {String(secondsLeft).padStart(2, '0')}
        </span>
        {/* Progress ring */}
        {expiresAt && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${
                phase === 'going_twice' ? 'from-red-500/20' :
                phase === 'going_once' ? 'from-amber-500/20' : 'from-emerald-500/20'
              } to-transparent transition-all duration-300`}
              style={{ height: `${Math.min(100, (secondsLeft / 30) * 100)}%` }}
            />
          </div>
        )}
      </div>
      <div className="text-[10px] text-slate-500">seconds</div>
    </div>
  );
}
