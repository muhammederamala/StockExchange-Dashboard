import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, TrendingUp, TrendingDown, Clock, CheckCircle2, Ghost, Filter } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { DataTable } from "../components/DataTable";
import { apiFetch } from "../lib/api";

// Capacity-unconstrained mirror of Trades.jsx — reads /api/shadow-trades
// instead of /api/trades. See StockExchange-AI src/shared/configs/shadowTrades.js
// for which strategies feed this collection.

// Shadow BOOK = which challenger config opened the row (configId in shadowTrades.js
// BOOKS.DEFINITIONS). The API supplies the list; this only maps ids to display labels.
const BOOK_LABELS = {
    champion: "Champion",
    pb2: "PB2 · 2% dip",
    chase_chop: "Chase · CHOP",
    pullback: "Pullback",
    vcp: "VCP",
    hard_gate: "Hard Gate",
    mean_reversion: "Mean Reversion",
    score: "Score",
    live_mirror: "Live Mirror",
};
const BOOK_STYLES = {
    champion: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    live_mirror: "bg-zinc-800 text-zinc-300 border-zinc-700",
};
const DEFAULT_BOOK_STYLE = "bg-violet-500/10 text-violet-300 border-violet-500/20";
const bookLabel = (id) => BOOK_LABELS[id] || id;

export function ShadowTrades() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [strategyFilter, setStrategyFilter] = useState("ALL");
    const [familyFilter, setFamilyFilter] = useState("ALL");
    const [bookFilter, setBookFilter] = useState("ALL");
    const [books, setBooks] = useState([]);

    const today = new Date();
    const monday = format(addDays(startOfWeek(today, { weekStartsOn: 1 }), 0), 'yyyy-MM-dd');
    const friday = format(addDays(startOfWeek(today, { weekStartsOn: 1 }), 4), 'yyyy-MM-dd');

    const [fromDate, setFromDate] = useState(monday);
    const [toDate, setToDate] = useState(friday);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [summaryStats, setSummaryStats] = useState(null);

    const fetchTrades = async (p, q, status, strategy, family, book, from, to) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p.toString(),
                limit: "20",
                q,
            });
            if (status !== "ALL") params.append("status", status);
            if (strategy !== "ALL") params.append("strategy", strategy);
            if (family !== "ALL") params.append("family", family);
            if (book !== "ALL") params.append("book", book);
            if (from) params.append("from", from);
            if (to) params.append("to", to);

            const res = await apiFetch(`/api/shadow-trades?${params}`);
            const data = await res.json();
            setResults(data.data || []);
            setSummaryStats(data.summaryStats || null);
            setBooks(data.books || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            console.error("Shadow Trades fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTrades(page, search, statusFilter, strategyFilter, familyFilter, bookFilter, fromDate, toDate);
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search, statusFilter, strategyFilter, familyFilter, bookFilter, fromDate, toDate]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, strategyFilter, familyFilter, bookFilter, fromDate, toDate]);

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const columns = [
        {
            header: "Symbol & Company",
            key: "symbol",
            render: (item) => (
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg border border-zinc-700/50 ${item.status === 'ACTIVE' ? 'bg-violet-500/10 text-violet-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Ghost size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-bold flex items-center gap-2">
                            {item.symbol}
                            {item.status === 'CLOSED' && (
                                <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-medium border border-zinc-700">Sold</span>
                            )}
                            {item.status === 'PENDING_SETUP' && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-medium border border-amber-500/20">Setup</span>
                            )}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {item.companyName}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Book & Strategy",
            render: (item) => (
                <div className="flex flex-col gap-1 items-start">
                    <span
                        title={books.find(b => b.configId === item.book)?.question || ""}
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${BOOK_STYLES[item.book] || DEFAULT_BOOK_STYLE}`}
                    >
                        {bookLabel(item.book)}
                    </span>
                    <span className="text-xs text-zinc-300 font-mono">
                        {item.archetype?.replace(/_/g, ' ') || "—"}
                        {item.regime && <span className="text-zinc-500"> · {item.regime}</span>}
                    </span>
                    {item.fillReason && (
                        <span className="text-[10px] text-zinc-600 font-mono">
                            {item.fillReason.replace(/_/g, ' ')}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Entry Details",
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-zinc-200 font-mono">
                        {formatPrice(item.entryPrice)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <Calendar size={10} />
                        {formatDate(item.entryTime)}
                        <span className="opacity-50">@ {formatTime(item.entryTime)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Performance",
            align: "center",
            render: (item) => {
                const gain = parseFloat(item.currentGainPct);
                const isProfit = gain >= 0;
                return (
                    <div className="flex flex-col items-center gap-1">
                        <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {isProfit ? '+' : ''}{gain.toFixed(2)}%
                        </div>
                        <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">
                            {item.status === 'CLOSED' ? 'Final PnL' : 'Current PnL'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Peak Potential",
            align: "center",
            render: (item) => (
                <div className="flex flex-col items-center gap-1">
                    <div className="text-xs font-bold text-indigo-400 font-mono">
                        +{item.peakGainPct}%
                    </div>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">MFE</span>
                </div>
            )
        },
        {
            header: "Position Info",
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <div className="text-xs text-zinc-300 flex items-center gap-2">
                        <span className="text-zinc-500">Shares:</span>
                        <span className="font-mono font-bold text-indigo-400">{item.shares || "—"}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                        <span>Capital:</span>
                        <span className="font-mono">₹{(item.allocatedCapital || 0).toLocaleString("en-IN")}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Status & Exit",
            align: "right",
            render: (item) => {
                if (item.status === 'CLOSED') {
                    return (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                                <CheckCircle2 size={12} />
                                EXITED
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                                {item.exitReason?.replace(/_/g, ' ') || 'Closed'}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                {formatDate(item.exitTime)}
                            </div>
                        </div>
                    );
                } else if (item.status === 'PENDING_SETUP') {
                    return (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                <Clock size={12} className="animate-pulse" />
                                PENDING
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1 font-medium italic">
                                {item.pendingReason?.replace(/_/g, ' ') || 'Awaiting Setup'}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                Ref: {formatPrice(item.entryPrice)}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-violet-400 text-xs font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                LIVE
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                                Held: {item.tradingDaysHeld || 0} Days
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                In: {formatPrice(item.entryPrice)}
                            </div>
                        </div>
                    );
                }
            }
        }
    ];

    const strategyOptions = [
        { value: "ALL", label: "All" },
        { value: "swing", label: "Swing" },
        { value: "intraday", label: "Intraday" },
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                {strategyOptions.map(({ value, label }) => {
                    const active = strategyFilter === value;
                    const colorMap = {
                        swing: active ? "bg-indigo-500 text-white border-indigo-500" : "text-zinc-400 border-zinc-700 hover:border-indigo-500/50 hover:text-indigo-300",
                        intraday: active ? "bg-amber-500 text-white border-amber-500" : "text-zinc-400 border-zinc-700 hover:border-amber-500/50 hover:text-amber-300",
                        ALL: active ? "bg-zinc-700 text-white border-zinc-600" : "text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300",
                    };
                    return (
                        <button
                            key={value}
                            onClick={() => setStrategyFilter(value)}
                            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${colorMap[value]}`}
                        >
                            {label}
                        </button>
                    );
                })}
                <span className="text-zinc-700 text-xs font-mono ml-1 uppercase tracking-widest">Strategy</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-violet-400/80 font-mono uppercase tracking-widest border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 rounded-lg">
                    <Ghost size={12} />
                    Unrestricted — no slot/cash/daily-entry caps
                </span>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-md px-3">
                        <Filter size={14} className="text-zinc-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-zinc-300 font-medium cursor-pointer py-1"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="CLOSED">Closed Only</option>
                            <option value="PENDING_SETUP">Pending Setup</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-md px-3">
                        <Filter size={14} className="text-zinc-500" />
                        <select
                            value={familyFilter}
                            onChange={(e) => setFamilyFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-zinc-300 font-medium cursor-pointer py-1"
                        >
                            <option value="ALL">All Families</option>
                            <option value="FILING">System (Filing)</option>
                            <option value="DELIVERY_SPIKE">Delivery Family</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-md px-3">
                        <Ghost size={14} className="text-zinc-500" />
                        <select
                            value={bookFilter}
                            onChange={(e) => setBookFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-zinc-300 font-medium cursor-pointer py-1"
                        >
                            <option value="ALL">All Books</option>
                            {books.map(b => (
                                <option key={b.configId} value={b.configId}>
                                    {bookLabel(b.configId)} ({b.count})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-md px-3">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">From</span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-zinc-300 font-mono cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-md px-3">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">To</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-zinc-300 font-mono cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
                    {total} SHADOW POSITIONS
                </div>
            </div>

            {/* Summary Stats */}
            {summaryStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-md flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Invested</span>
                        <span className="text-lg font-bold text-zinc-200 font-mono">₹{(summaryStats.totalTradedAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-emerald-500/20 backdrop-blur-md flex flex-col">
                        <span className="text-[10px] text-emerald-500/70 uppercase font-bold mb-1">Profit</span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">+₹{(summaryStats.totalProfit || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-rose-500/20 backdrop-blur-md flex flex-col">
                        <span className="text-[10px] text-rose-500/70 uppercase font-bold mb-1">Loss</span>
                        <span className="text-lg font-bold text-rose-400 font-mono">-₹{(summaryStats.totalLoss || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className={`bg-zinc-900/50 p-4 rounded-xl border backdrop-blur-md flex flex-col ${summaryStats.netProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                        <span className={`text-[10px] uppercase font-bold mb-1 ${summaryStats.netProfit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>Net Profit</span>
                        <span className={`text-lg font-bold font-mono ${summaryStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {summaryStats.netProfit >= 0 ? '+' : '-'}₹{Math.abs(summaryStats.netProfit || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            )}

            {/* Main Table Body */}
            <div className="flex-1 min-h-0 flex flex-col">
                <DataTable
                    columns={columns}
                    data={results}
                    loading={loading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onRowClick={(item) => navigate(`/stocks/${item.symbol}`)}
                    searchPlaceholder="Search positions by symbol or name..."
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
