import React from 'react';
import { Volume2 } from 'lucide-react';

/**
 * A shared toggle component for filtering high-liquidity assets (>= 5 Cr Traded Value).
 * Used across Live Feed, Database, Performance, and Simulation tabs.
 */
export function HighVolumeToggle({ isActive, onClick, label = "High Value (5 Cr+)" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 select-none ${isActive
        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20'
        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 backdrop-blur-sm'
        }`}
    >
      <Volume2 
        size={14} 
        className={`transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-400 animate-pulse' : 'text-zinc-600'}`} 
      />
      <span className="tracking-tight">{label}</span>
    </button>
  );
}
