'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  expiresAt: string | null;
  phase: 'open' | 'going_once' | 'going_twice' | 'revealed' | string;
  totalDuration?: number;
  className?: string;
}

const PHASE_CONFIG: Record<string, { label: string; color: string; stroke: string; bg: string }> = {
  revealed: { label: 'REVEALING', color: 'text-cyan-400', stroke: '#22d3ee', bg: 'from-cyan-500/10 to-blue-500/10' },
  open: { label: 'BIDDING', color: 'text-emerald-400', stroke: '#34d399', bg: 'from-emerald-500/10 to-teal-500/10' },
  going_once: { label: 'GOING ONCE', color: 'text-amber-400', stroke: '#fbbf24', bg: 'from-amber-500/10 to-orange-500/10' },
  going_twice: { label: 'GOING TWICE', color: 'text-red-400', stroke: '#f87171', bg: 'from-red-500/10 to-rose-500/10' },
};

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Timer({ expiresAt, phase, totalDuration, className = '' }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [progress, setProgress] = useState(1);
  const startTimeRef = useRef<number | null>(null);
  const totalRef = useRef<number>(totalDuration || 30);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      setProgress(0);
      return;
    }

    const expiresMs = new Date(expiresAt).getTime();
    if (!startTimeRef.current || totalDuration) {
      const total = totalDuration ? totalDuration : Math.max(1, Math.ceil((expiresMs - Date.now()) / 1000));
      totalRef.current = total;
      startTimeRef.current = expiresMs - total * 1000;
    }

    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, (expiresMs - now) / 1000);
      setSecondsLeft(Math.ceil(remaining));
      const total = totalRef.current;
      setProgress(total > 0 ? remaining / total : 0);
    };

    update();
    const interval = setInterval(update, 50);
    return () => clearInterval(interval);
  }, [expiresAt, totalDuration]);

  const config = PHASE_CONFIG[phase] || { label: phase.toUpperCase(), color: 'text-slate-400', stroke: '#94a3b8', bg: 'from-slate-500/10 to-slate-600/10' };
  const isUrgent = phase === 'going_twice' || (phase === 'going_once' && secondsLeft <= 2);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Phase label */}
      <motion.div
        key={phase}
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`text-[11px] font-bold uppercase tracking-[0.25em] ${config.color} ${isUrgent ? 'animate-pulse' : ''}`}
      >
        {config.label}
      </motion.div>

      {/* Circular timer */}
      <div className={`relative w-28 h-28 sm:w-32 sm:h-32 ${isUrgent ? 'timer-urgent rounded-full' : ''}`}>
        {/* Background gradient */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.bg}`} />

        {/* SVG ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50" cy="50" r={RING_RADIUS}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"
          />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={RING_RADIUS}
            fill="none"
            stroke={config.stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.15s linear' }}
            opacity={0.8}
          />
          {/* Glow */}
          <circle
            cx="50" cy="50" r={RING_RADIUS}
            fill="none"
            stroke={config.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.15s linear', filter: 'blur(6px)' }}
            opacity={0.3}
          />
        </svg>

        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={secondsLeft}
            initial={isUrgent ? { scale: 1.2 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className={`text-4xl sm:text-5xl font-extrabold font-mono ${config.color} tabular-nums`}
          >
            {String(secondsLeft).padStart(2, '0')}
          </motion.span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">sec</span>
        </div>
      </div>
    </div>
  );
}
