import React from "react";
import { Activity, ShieldAlert } from "lucide-react";
import { LiveMonitor } from "../components/LiveMonitor";

export function Home({ socket, isConnected }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
            {/* Left Column (Stats / Controls) */}
            <div className="flex flex-col gap-6 lg:col-span-1">
                {/* System Status Card */}
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 backdrop-blur-md hover:bg-zinc-900/60 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-400">Pipeline Status</h3>
                        <Activity size={16} className={isConnected ? "text-cyan-400" : "text-zinc-600"} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300 text-sm">Filing Scraper Loop</span>
                            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">ACTIVE</span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300 text-sm">News Automation</span>
                            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">ACTIVE</span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300 text-sm">Gemini AI Link</span>
                            <span className={`text-xs font-mono px-2 py-1 rounded border ${isConnected ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {isConnected ? 'READY' : 'STANDBY'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* AI Architecture Overview */}
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 backdrop-blur-md flex-1">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400 border-b border-zinc-800 pb-3">
                        <ShieldAlert size={16} />
                        <h3 className="text-sm font-medium">Dual Pipeline Config</h3>
                    </div>

                    <p className="text-sm text-zinc-500 leading-relaxed">
                        The backend parses overlapping 20-word chunks representing incoming data vectors.
                        <br /><br />If a base signal crosses the <span className="text-zinc-300 font-mono bg-zinc-800 px-1 rounded">0.45</span> confidence threshold, or contains financial data anomalies, the system dynamically reroutes that specific chunk buffer sequence into the LLM Reasoning Layer.
                    </p>
                </div>
            </div>

            {/* Right Column (Live Monitor) */}
            <div className="lg:col-span-2 h-full w-full">
                {socket && (
                    <LiveMonitor socket={socket} isConnected={isConnected} />
                )}
            </div>
        </div>
    );
}
