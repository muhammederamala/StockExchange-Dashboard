import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, ArrowUpRight, BarChart3, Calendar } from "lucide-react";
import { HighVolumeToggle } from "../components/HighVolumeToggle";
import { DataTable } from "../components/DataTable";
import { apiFetch } from "../lib/api";

export function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [highValueOnly, setHighValueOnly] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

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

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [search, fromDate, toDate, highValueOnly]);

    useEffect(() => {
        let isMounted = true;
        const fetchAlerts = async () => {
            setLoading(true);
            try {

                const params = new URLSearchParams({
                    from: fromDate,
                    to: toDate,
                    highValue: highValueOnly.toString(),
                    q: search,
                    page: page.toString(),
                    limit: "20"
                });

                const res = await apiFetch(`/api/performance/top-alerts?${params}`);
                const data = await res.json();
                if (isMounted) {
                    setAlerts(data.data || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                    setTotal(data.pagination?.total || 0);
                }
            } catch (err) {
                console.error("Failed to load alerts:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchAlerts();
        }, 350);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [fromDate, toDate, highValueOnly, search, page]);

    const formatVolume = (vol) => {
        if (!vol) return "0";
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
            header: "Symbol & Strategy",
            key: "symbol",
            render: (alert) => (
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-indigo-400">
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
            )
        },
        {
            header: "Score Snapshot",
            align: "center",
            render: (alert) => (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold text-zinc-100">{(alert.cumulativeScore || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Cumul. Score</span>
                </div>
            )
        },
        {
            header: "Sent / Entry",
            render: (alert) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Calendar size={12} className="text-zinc-600" />
                        {formatDate(alert.alertTime)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                        <Clock size={12} className="text-zinc-700" />
                        {alert.entryPrice > 0 ? formatPrice(alert.entryPrice) : "—"}
                        <span className="opacity-60 ml-0.5 uppercase tracking-tighter">
                            ({alert.entryTime?.t || "at-alert"})
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Traded Value",
            align: "right",
            render: (alert) => (
                <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold font-mono ${((alert.volume || 0) * (alert.dayPrice || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                        ₹{formatVolume((alert.volume || 0) * (alert.dayPrice || 0))}
                    </span>
                    <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Day Liquidity</span>
                </div>
            )
        },
        {
            header: "Max Gain",
            align: "right",
            render: (alert) => (
                <div className="flex flex-col items-end">
                    <span className={`text-base font-black font-mono flex items-center gap-1 ${(alert.maxGain || 0) > 10 ? 'text-emerald-400' : (alert.maxGain || 0) > 0 ? 'text-emerald-400/70' : 'text-zinc-500'}`}>
                        <ArrowUpRight size={16} />
                        +{(alert.maxGain || 0).toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Peak Profit</span>
                </div>
            )
        },
        {
            header: "Optimal Exit",
            align: "right",
            render: (alert) => alert.optimalExit ? (
                <div className="flex flex-col items-end border-l border-zinc-800/50 pl-4 py-1">
                    <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        {formatDate(alert.optimalExit.date)}
                    </div>
                    <div className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock size={10} /> {alert.optimalExit.t}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-400 mt-2 font-mono bg-zinc-800/50 px-2 py-0.5 rounded">
                        {formatPrice(alert.optimalExit.price)}
                    </div>
                </div>
            ) : (
                <span className="text-zinc-700">—</span>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Quick Filter Bar */}
            <div className="flex items-center justify-between mb-4 shrink-0 gap-4 min-h-[44px]">
                <div className="flex items-center gap-3">
                    <HighVolumeToggle 
                        isActive={highValueOnly} 
                        onClick={() => setHighValueOnly(!highValueOnly)} 
                    />
                    <div className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
                        {total} TOP ALERTS TRACKED
                    </div>
                </div>

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
            </div>

            {/* Main Content Area (DataTable) */}
            <div className="flex-1 min-h-0 flex flex-col">
                <DataTable 
                    columns={columns}
                    data={alerts}
                    loading={loading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filter symbols or company names..."
                    pagination={{
                        page: page,
                        totalPages: totalPages,
                        total: total,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    );
}
