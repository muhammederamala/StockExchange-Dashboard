import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Database, ArrowRight, TrendingUp, TrendingDown, BarChart3, SlidersHorizontal, X, ChevronDown, Volume2 } from "lucide-react";

export function Stocks() {
    const [search, setSearch] = useState("");
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [highVolumeOnly, setHighVolumeOnly] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [minScore, setMinScore] = useState("");
    const [maxScore, setMaxScore] = useState("");
    const [sortBy, setSortBy] = useState("score");

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, highVolumeOnly, minScore, maxScore, sortBy]);

    useEffect(() => {
        let isMounted = true;
        const fetchStocks = async () => {
            setLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                const params = new URLSearchParams({
                    q: search,
                    page: page.toString(),
                    limit: "20",
                    highVolume: highVolumeOnly.toString(),
                    sortBy,
                });
                if (minScore) params.set("minScore", minScore);
                if (maxScore) params.set("maxScore", maxScore);

                const res = await fetch(`${baseUrl}/api/stocks?${params}`);
                const data = await res.json();
                if (isMounted) {
                    setStocks(data.data || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                    setTotal(data.pagination?.total || 0);
                }
            } catch (err) {
                console.error("Failed to load stocks:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchStocks();
        }, 350);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [search, page, highVolumeOnly, minScore, maxScore, sortBy]);

    const formatVolume = (vol) => {
        if (!vol || vol === 0) return "—";
        if (vol >= 10000000) return (vol / 10000000).toFixed(2) + " Cr";
        if (vol >= 100000) return (vol / 100000).toFixed(2) + " L";
        if (vol >= 1000) return (vol / 1000).toFixed(1) + " K";
        return vol.toString();
    };

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight flex items-center gap-3">
                        <Database size={24} className="text-indigo-400" />
                        Stock Database
                    </h2>
                    <p className="text-zinc-500 mt-1 text-sm">
                        {total} stocks tracked • Sorted by {sortBy === 'score' ? 'catalyst strength' : sortBy === 'volume' ? 'trading volume' : 'name'}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search Bar */}
                    <div className="relative w-64">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search symbol or company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600 backdrop-blur-sm"
                        />
                    </div>

                    {/* Advanced Filters Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all backdrop-blur-sm ${showAdvanced
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                            }`}
                    >
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${showAdvanced ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 backdrop-blur-md flex flex-wrap items-center gap-x-6 gap-y-3">

                    {/* High Volume Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${highVolumeOnly
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-zinc-600 group-hover:border-zinc-400'
                            }`}>
                            {highVolumeOnly && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                            <Volume2 size={14} className="text-indigo-400" />
                            High Volume Only
                            <span className="text-[10px] text-zinc-500 font-mono">(≥ 5L)</span>
                        </span>
                    </label>

                    {/* Divider */}
                    <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

                    {/* Score Range */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Score</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={minScore}
                            onChange={e => setMinScore(e.target.value)}
                            className="w-20 bg-black/30 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono placeholder:text-zinc-600"
                        />
                        <span className="text-zinc-600">—</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxScore}
                            onChange={e => setMaxScore(e.target.value)}
                            className="w-20 bg-black/30 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

                    {/* Sort By */}
                    <div className="flex items-center gap-2 relative">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Sort</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="bg-black/30 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono appearance-none pr-8 cursor-pointer"
                        >
                            <option value="score">Catalyst Score</option>
                            <option value="volume">Today's Volume</option>
                            <option value="name">Company Name</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 text-zinc-500 pointer-events-none" />
                    </div>

                    {/* Clear All */}
                    {(minScore || maxScore || !highVolumeOnly || sortBy !== 'score') && (
                        <button
                            onClick={() => {
                                setMinScore("");
                                setMaxScore("");
                                setHighVolumeOnly(true);
                                setSortBy("score");
                            }}
                            className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-400 transition-colors ml-auto"
                        >
                            <X size={12} />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Toggle Bar (always visible, above the table) */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
                <button
                    onClick={() => setHighVolumeOnly(!highVolumeOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${highVolumeOnly
                        ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                        : 'bg-zinc-900/30 border-zinc-700/40 text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <Volume2 size={12} />
                    High Volume
                </button>
                <div className="text-[10px] text-zinc-600 font-mono tracking-wider">
                    {total} RESULTS
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl overflow-hidden backdrop-blur-md flex-1 min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-zinc-500 animate-pulse">
                        Scanning Database...
                    </div>
                ) : stocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
                        <BarChart3 size={32} className="text-zinc-700" />
                        <span>No stocks found{search ? ` matching '${search}'` : ''}</span>
                        {highVolumeOnly && <span className="text-xs text-zinc-600">Try unchecking "High Volume Only"</span>}
                    </div>
                ) : (
                    <div className="overflow-auto h-full w-full">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-900/80 sticky top-0 text-xs uppercase font-semibold text-zinc-500 tracking-wider">
                                <tr>
                                    <th className="px-4 md:px-5 py-3.5 hidden sm:table-cell">Symbol</th>
                                    <th className="px-4 md:px-5 py-3.5">Company</th>
                                    <th className="px-4 md:px-5 py-3.5 text-right">Score</th>
                                    <th className="px-4 md:px-5 py-3.5 text-right hidden lg:table-cell">Price</th>
                                    <th className="px-4 md:px-5 py-3.5 text-right hidden md:table-cell">
                                        <span className="flex items-center gap-1 justify-end">
                                            <Volume2 size={12} />
                                            Volume
                                        </span>
                                    </th>
                                    <th className="px-4 md:px-5 py-3.5 text-right hidden xl:table-cell">Day Range</th>
                                    <th className="px-4 md:px-5 py-3.5 text-right w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {stocks.map((stock) => {
                                    const m = stock.market || {};
                                    const hasMarketData = m.close || m.volume;
                                    const dayChange = m.open && m.close ? ((m.close - m.open) / m.open * 100) : null;

                                    return (
                                        <tr key={stock.symbol} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="px-4 md:px-5 py-3.5 font-mono text-zinc-300 hidden sm:table-cell text-xs">
                                                {stock.symbol}
                                            </td>
                                            <td className="px-4 md:px-5 py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-200 font-medium truncate max-w-[140px] sm:max-w-[220px]">
                                                        {stock.companyName}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600 font-mono sm:hidden">{stock.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-5 py-3.5 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono border ${stock.dailyScore > 0
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : stock.dailyScore < 0
                                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                    }`}>
                                                    {stock.dailyScore > 0 && '+'}{(stock.dailyScore || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3.5 text-right hidden lg:table-cell">
                                                {hasMarketData ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-mono text-zinc-200">{formatPrice(m.close)}</span>
                                                        {dayChange !== null && (
                                                            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {dayChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-zinc-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-5 py-3.5 text-right hidden md:table-cell">
                                                <span className={`text-xs font-mono ${((m.volume || 0) * (m.close || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                                    {formatVolume(m.volume)}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3.5 text-right hidden xl:table-cell">
                                                {m.low && m.high ? (
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <span className="text-[10px] font-mono text-red-400/70">{formatPrice(m.low)}</span>
                                                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full relative overflow-hidden">
                                                            {m.close && (
                                                                <div
                                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500/60 via-zinc-400/60 to-emerald-500/60 rounded-full"
                                                                    style={{
                                                                        width: `${Math.min(100, Math.max(5, ((m.close - m.low) / (m.high - m.low)) * 100))}%`
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-mono text-emerald-400/70">{formatPrice(m.high)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-zinc-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-5 py-3.5 text-right">
                                                <Link
                                                    to={`/stocks/${stock.symbol}`}
                                                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                                                >
                                                    <span className="text-[10px] font-medium uppercase tracking-wider">View</span>
                                                    <ArrowRight size={12} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {stocks.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-2 pb-2 shrink-0">
                    <div className="text-xs text-zinc-500 font-mono">
                        PAGE {page} OF {totalPages} • {total} STOCKS
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors backdrop-blur-sm"
                        >
                            PREV
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors backdrop-blur-sm"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
