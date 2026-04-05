import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowUpRight, BarChart3, AlertCircle, Calendar } from "lucide-react";

export function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [highValueOnly, setHighValueOnly] = useState(false);

    // Default to current week's Mon-Fri
    const getDefaultDates = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 is Sunday
        const diffToMon = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMon);
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        return {
            from: monday.toISOString().split('T')[0],
            to: friday.toISOString().split('T')[0]
        };
    };

    const defaults = getDefaultDates();
    const [fromDate, setFromDate] = useState(defaults.from);
    const [toDate, setToDate] = useState(defaults.to);

    useEffect(() => {
        let isMounted = true;
        const fetchTopAlerts = async () => {
            setLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                const res = await fetch(`${baseUrl}/api/performance/top-alerts?limit=50&highValue=${highValueOnly}&from=${fromDate}&to=${toDate}`);
                const data = await res.json();
                if (isMounted) {
                    setAlerts(data.data || []);
                }
            } catch (err) {
                console.error("Failed to load top alerts:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTopAlerts();
        return () => { isMounted = false; };
    }, [highValueOnly, fromDate, toDate]);

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatVolume = (vol) => {
        if (!vol) return "0";
        if (vol >= 10000000) return (vol / 10000000).toFixed(2) + " Cr";
        if (vol >= 100000) return (vol / 100000).toFixed(2) + " L";
        if (vol >= 1000) return (vol / 1000).toFixed(1) + " K";
        return vol.toString();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        return timeStr; // Assuming HH:MM
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
            <div className="flex flex-col md:flex-row items-end justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight flex items-center gap-3">
                        <TrendingUp size={24} className="text-emerald-400" />
                        Alpha Performance Hub
                    </h2>
                    <p className="text-zinc-500 mt-1 text-sm">
                        Tracking the best historical alerts and their maximum profit potential.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-md px-3 shrink-0">
                        <Calendar size={14} className="text-zinc-600" />
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                            className="bg-transparent border-none outline-none text-xs text-zinc-300 font-mono cursor-pointer"
                        />
                        <span className="text-zinc-700 text-xs">—</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                            className="bg-transparent border-none outline-none text-xs text-zinc-300 font-mono cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={() => setHighValueOnly(!highValueOnly)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${highValueOnly
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                            : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                            }`}
                    >
                        <BarChart3 size={14} className={highValueOnly ? 'animate-pulse' : ''} />
                        High Value (5 Cr+)
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl overflow-hidden backdrop-blur-md flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center flex-1 text-zinc-500 animate-pulse">
                        Calculating ROI Metrics...
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-3">
                        <AlertCircle size={48} className="text-zinc-800" />
                        <span className="text-lg font-medium text-zinc-400">No performance data yet</span>
                        <p className="text-sm text-zinc-600 max-w-xs text-center">
                            Wait for the outcome tracker to process symbols in your database.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-auto h-full w-full">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-900/80 sticky top-0 text-xs uppercase font-semibold text-zinc-500 tracking-wider z-10">
                                <tr>
                                    <th className="px-5 py-4">Symbol & Strategy</th>
                                    <th className="px-5 py-4 text-center">Score Snapshot</th>
                                    <th className="px-5 py-4">Sent / Entry</th>
                                    <th className="px-5 py-4 text-right">Traded Value</th>
                                    <th className="px-5 py-4 text-right">Max Gain</th>
                                    <th className="px-5 py-4 text-right">Optimal Exit</th>
                                    <th className="px-5 py-4 text-right hidden lg:table-cell">Trajectory</th>
                                    <th className="px-5 py-4 text-right w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {alerts.map((alert) => (
                                    <tr key={alert.alertId} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-indigo-400 group-hover:border-indigo-500/30 transition-colors`}>
                                                    <BarChart3 size={18} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-zinc-200 font-bold flex items-center gap-2">
                                                        {alert.symbol}
                                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                            {alert.strategy}
                                                        </span>
                                                    </span>
                                                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                                                        {alert.companyName}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-bold text-zinc-100">{alert.cumulativeScore?.toFixed(1)}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Cumul. Score</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                                    <Calendar size={12} className="text-zinc-600" />
                                                    {formatDate(alert.alertTime)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                                    <Clock size={12} className="text-zinc-700" />
                                                    Entry: {alert.entryPrice > 0 ? formatPrice(alert.entryPrice) : "—"}
                                                    <span className="opacity-60 ml-0.5 uppercase tracking-tighter">
                                                        ({alert.entryTime?.t || "at-alert"})
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-bold font-mono ${((alert.volume || 0) * (alert.dayPrice || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                                                    ₹{formatVolume((alert.volume || 0) * (alert.dayPrice || 0))}
                                                </span>
                                                <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Day Liquidity</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-base font-black font-mono flex items-center gap-1 ${alert.maxGain > 10 ? 'text-emerald-400' : alert.maxGain > 0 ? 'text-emerald-400/70' : 'text-zinc-500'}`}>
                                                    <ArrowUpRight size={16} />
                                                    +{alert.maxGain.toFixed(2)}%
                                                </span>
                                                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Peak Profit</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                {alert.optimalExit ? (
                                                    <>
                                                        <span className="text-xs font-mono text-zinc-300 font-medium">
                                                            {formatPrice(alert.optimalExit.price)}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                            <Calendar size={10} /> {formatDate(alert.optimalExit.date)}
                                                            <Clock size={10} className="ml-1" /> {alert.optimalExit.t}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-zinc-600">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right hidden lg:table-cell">
                                            <div className="inline-flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-zinc-600 uppercase font-bold">60d Horizon</span>
                                                    <Sparkline data={alert.sparkline} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className={`p-1.5 rounded-full ${alert.status === 'COMPLETE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <CheckCircle2 size={16} />
                                            </div>
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
}
