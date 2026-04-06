import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Filter, Pause, Play, Download, Trash2 } from "lucide-react";

export function LiveMonitor({ socket, isConnected }) {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState("All"); // All, Filings, News, Market, System
    const [isPaused, setIsPaused] = useState(false);
    const logsEndRef = useRef(null);
    const terminalRef = useRef(null);

    // Track pause state in a ref so listeners don't recreate unnecessarily
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    useEffect(() => {
        if (!socket) return;

        const handleLog = (data) => {
            if (isPausedRef.current) return;
            setLogs((prev) => {
                const newLogs = [...prev, data];
                return newLogs.length > 1000 ? newLogs.slice(newLogs.length - 1000) : newLogs;
            });
        };

        socket.on("log", handleLog);
        return () => socket.off("log", handleLog);
    }, [socket]);

    // Auto-scroll logic 
    useEffect(() => {
        if (!isPaused && terminalRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
            if (isNearBottom) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        }
    }, [logs, isPaused]);

    const filteredLogs = logs.filter((log) => {
        if (filter === "All") return true;
        return log.category === filter;
    });

    const clearLogs = () => setLogs([]);

    const getLogColor = (category, level) => {
        if (level === "error") return "text-red-400";
        if (level === "warn") return "text-amber-400";
        switch (category) {
            case "Filings": return "text-cyan-400";
            case "News": return "text-purple-400";
            case "Market": return "text-indigo-400";
            default: return "text-zinc-400";
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[500px] max-h-[85vh] lg:max-h-[800px] bg-zinc-950/50 rounded-xl border border-zinc-800/50 backdrop-blur-xl overflow-hidden shadow-2xl flex-1">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-zinc-800/50 bg-zinc-900/50 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
                        </div>
                    </div>

                    <div className="hidden sm:block h-4 w-px bg-zinc-700" />

                    {/* Filters */}
                    <div className="flex items-center gap-1 bg-zinc-950/80 rounded-lg p-1 border border-zinc-800 overflow-x-auto no-scrollbar">
                        {["All", "Filings", "News", "Market", "System"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${filter === cat
                                    ? "bg-zinc-100 text-black px-4"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Controls */}
                <div className="hidden sm:flex items-center gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`p-2 rounded-lg transition-colors ${isPaused ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
                        title={isPaused ? "Resume scrolling" : "Pause scrolling"}
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                        onClick={clearLogs}
                        className="p-2 rounded-lg bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Clear logs"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Terminal Area */}
            <div
                ref={terminalRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-sm"
                onScroll={(e) => {
                    const { scrollTop, scrollHeight, clientHeight } = e.target;
                    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
                    if (isScrolledUp && !isPaused) setIsPaused(true);
                }}
            >
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 opacity-50 py-20">
                        <Filter size={24} />
                        <p className="text-xs">Waiting for telemetry logs...</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredLogs.map((log, index) => (
                            <div key={index} className="flex items-start gap-3 py-0.5 hover:bg-zinc-800/30 px-2 rounded -mx-2 transition-colors break-words group">
                                <div className="flex items-center gap-3 opacity-30 flex-shrink-0">
                                    <span className="text-[10px] text-zinc-500">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-tight ${log.category === "Market" ? "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" :
                                            log.category === "Filings" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
                                                log.category === "News" ? "border-purple-500/30 text-purple-400 bg-purple-500/10" :
                                                    "border-zinc-700 text-zinc-500"
                                        }`}>
                                        {log.category}
                                    </span>
                                </div>
                                <div className={`flex-1 text-xs leading-relaxed ${getLogColor(log.category, log.level)}`}>
                                    {log.message}
                                </div>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
}
