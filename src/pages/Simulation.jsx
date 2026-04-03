import React, { useState, useEffect } from "react";
import { FastForward, Calendar, TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowUpRight, BarChart3, AlertCircle } from "lucide-react";

export function Simulation() {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSimulation = async (date) => {
        if (!date) return;
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
            const res = await fetch(`${baseUrl}/api/performance/simulation?date=${date}`);
            const data = await res.json();
            setResults(data.data || []);
        } catch (err) {
            console.error("Failed to load simulation:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSimulation(selectedDate);
    }, [selectedDate]);

    const formatPrice = (price) => {
        if (!price || price === 0) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    };

    const Sparkline = ({ data }) => {
        if (!data || data.length < 2) return <div className="w-24 h-8 bg-zinc-800/30 rounded" />;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const width = 100;
        const height = 30;
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(" ");

        return (
            <svg width="100" height="30" className="overflow-visible">
                <polyline
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight flex items-center gap-3">
                        <FastForward size={24} className="text-indigo-400" />
                        Alpha Simulator
                    </h2>
                    <p className="text-zinc-500 mt-1 text-sm">
                        Rewind to any date and see how the top-scoring stocks of that day performed.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-2 rounded-xl backdrop-blur-md">
                    <Calendar size={16} className="text-zinc-500 ml-1" />
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-zinc-200 font-medium px-2 py-1"
                        max={today}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl overflow-hidden backdrop-blur-md flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center flex-1 text-zinc-500 animate-pulse">
                        Warping back in time...
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-3">
                        <AlertCircle size={48} className="text-zinc-800" />
                        <span className="text-lg font-medium text-zinc-400">No data for this date</span>
                        <p className="text-sm text-zinc-600 max-w-xs text-center">
                            Try selecting a different date from the picker above.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="sticky top-0 bg-zinc-900 z-10">
                                <tr className="border-b border-zinc-800/50">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Asset</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Score Snapshot</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Alert Entry (1h Post)</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Outcome Trajectory</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Max Potential</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Optimal Exit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, idx) => (
                                    <tr key={idx} className="group border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors">
                                        {/* Asset */}
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                                                    {item.symbol}
                                                </span>
                                                <span className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                                                    {item.companyName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Score Snapshot */}
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 size={12} className="text-indigo-500" />
                                                    <span className="text-sm font-mono text-zinc-200">{(item.cumulativeScore || 0).toFixed(1)}</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-600">Cumul. Score</span>
                                            </div>
                                        </td>

                                        {/* Alert Entry */}
                                        <td className="px-6 py-5">
                                            {item.alertTime ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-zinc-500" />
                                                        <span className="text-xs text-zinc-300 font-medium">
                                                            {item.entryTime?.t || "at-alert"} 
                                                            <span className="text-zinc-600 ml-1">({formatTime(item.alertTime.split('T')[1]?.substring(0,5))})</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-bold text-emerald-400 font-mono">
                                                        {formatPrice(item.entryPrice)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-zinc-700 italic">No formal alert fired</span>
                                            )}
                                        </td>

                                        {/* Outcome Trajectory (Sparkline) */}
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center flex-col items-center gap-2">
                                                <Sparkline data={item.sparkline} />
                                                <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
                                                    <span>Entry</span>
                                                    <span>60D Peak</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Max Potential */}
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className={`flex items-center gap-1 text-sm font-bold ${(item.maxGain || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {(item.maxGain || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {(item.maxGain || 0) > 0 ? "+" : ""}{(item.maxGain || 0).toFixed(2)}%
                                                </div>
                                                <div className="text-[10px] text-zinc-600 font-mono">
                                                    Max Drop: {(item.maxDrop || 0).toFixed(1)}%
                                                </div>
                                            </div>
                                        </td>

                                        {/* Optimal Exit */}
                                        <td className="px-6 py-5 text-right">
                                            {item.optimalExit ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                                                        <CheckCircle2 size={12} className="text-indigo-500" />
                                                        {formatDate(item.optimalExit.date)}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-600 flex items-center gap-1">
                                                        <Clock size={10} /> {item.optimalExit.t}
                                                    </div>
                                                    <div className="text-xs font-bold text-zinc-400 mt-1">
                                                        {formatPrice(item.optimalExit.price)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-700">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    function formatTime(t) {
        return t || "";
    }
}
