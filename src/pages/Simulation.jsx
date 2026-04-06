import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Calendar, TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowUpRight, BarChart3, Volume2 } from "lucide-react";
import { HighVolumeToggle } from "../components/HighVolumeToggle";
import { DataTable } from "../components/DataTable";

export function Simulation() {
    const navigate = useNavigate();
    // Default to today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [highVolumeOnly, setHighVolumeOnly] = useState(true);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchSimulation = async (date, highVolume, p, q) => {
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
            const params = new URLSearchParams({
                date,
                highVolume: highVolume.toString(),
                page: p.toString(),
                limit: "20",
                q
            });
            const res = await fetch(`${baseUrl}/api/performance/simulation?${params}`);
            const data = await res.json();
            setResults(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            console.error("Simulation fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSimulation(selectedDate, highVolumeOnly, page, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedDate, highVolumeOnly, page, search]);

    // Reset page on search/filter change
    useEffect(() => {
        setPage(1);
    }, [search, selectedDate, highVolumeOnly]);

    const formatVolume = (vol) => {
        if (!vol || vol === 0) return "—";
        if (vol >= 10000000) return (vol / 10000000).toFixed(2) + " Cr";
        if (vol >= 100000) return (vol / 100000).toFixed(2) + " L";
        return vol.toString();
    };

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const columns = [
        {
            header: "Symbol & Company",
            key: "symbol",
            render: (item) => (
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-indigo-400">
                        <Activity size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-bold flex items-center gap-2">
                            {item.symbol}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {item.companyName}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Score Snapshot",
            align: "center",
            render: (item) => (
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={12} className="text-indigo-500" />
                        <span className="text-sm font-mono text-zinc-200">{(item.cumulativeScore || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600">Cumul. Score</span>
                </div>
            )
        },
        {
            header: "Traded Value",
            align: "center",
            render: (item) => (
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <Volume2 size={12} className="text-indigo-500" />
                        <span className={`text-xs font-mono font-bold ${((item.volume || 0) * (item.entryPrice || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-300'}`}>
                            ₹{formatVolume((item.volume || 0) * (item.entryPrice || 0))}
                        </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Activity</span>
                </div>
            )
        },
        {
            header: "Alert Entry",
            render: (item) => item.alertTime ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock size={12} className="text-zinc-500" />
                        {item.entryTime?.t || "at-alert"} 
                        <span className="text-zinc-600 ml-1">({item.alertTime.split('T')[1]?.substring(0,5)})</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                        {formatPrice(item.entryPrice)}
                    </div>
                </div>
            ) : (
                <span className="text-[11px] text-zinc-700 italic">No formal alert fired</span>
            )
        },
        {
            header: "Max Potential",
            align: "right",
            render: (item) => (
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 text-sm font-bold ${(item.maxGain || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(item.maxGain || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        +{(item.maxGain || 0).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono tracking-tighter">
                        Drop: {(item.maxDrop || 0).toFixed(1)}%
                    </div>
                </div>
            )
        },
        {
            header: "Optimal Exit",
            align: "right",
            render: (item) => item.optimalExit ? (
                <div className="flex flex-col items-end border-l border-zinc-800/50 pl-4 py-1">
                    <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                        <CheckCircle2 size={12} className="text-indigo-500" />
                        {formatDate(item.optimalExit.date)}
                    </div>
                    <div className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock size={10} /> {item.optimalExit.t}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-400 mt-2 font-mono bg-zinc-800/50 px-2 py-0.5 rounded">
                        {formatPrice(item.optimalExit.price)}
                    </div>
                </div>
            ) : (
                <span className="text-zinc-700 font-mono text-[10px] italic">IN-PROGRESS</span>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Quick Filter Bar */}
            <div className="flex items-center justify-between mb-4 shrink-0 gap-4 min-h-[44px]">
                <div className="flex items-center gap-3">
                    <HighVolumeToggle 
                        isActive={highVolumeOnly} 
                        onClick={() => setHighVolumeOnly(!highVolumeOnly)} 
                    />
                    <div className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
                        {total} STOCKS TRACKED • REALISM DELAY: 20M
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-md px-3 shrink-0">
                    <Calendar size={14} className="text-zinc-600" />
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        onClick={(e) => e.target.showPicker()}
                        className="bg-transparent border-none outline-none text-xs text-zinc-300 font-mono cursor-pointer"
                        max={today}
                    />
                </div>
            </div>

            {/* Main Table Body */}
            <div className="flex-1 min-h-0 flex flex-col">
                <DataTable 
                    columns={columns}
                    data={results}
                    loading={loading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onRowClick={(item) => navigate(`/stocks/${item.symbol}`)}
                    searchPlaceholder="Search ticker or name..."
                    pagination={{
                        page,
                        totalPages,
                        total,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    );
}
