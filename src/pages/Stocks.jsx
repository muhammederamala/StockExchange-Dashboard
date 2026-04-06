import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, SlidersHorizontal, ChevronDown, Activity } from "lucide-react";
import { HighVolumeToggle } from "../components/HighVolumeToggle";
import { DataTable } from "../components/DataTable";

export function Stocks() {
    const [search, setSearch] = useState("");
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
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
        return vol.toString();
    };

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const columns = [
        {
            header: "Symbol & Company",
            key: "symbol",
            render: (stock) => (
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-indigo-400">
                        <Activity size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-bold flex items-center gap-2">
                            {stock.symbol}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {stock.companyName}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Score",
            align: "right",
            render: (stock) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold font-mono border ${stock.dailyScore > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : stock.dailyScore < 0
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                    {stock.dailyScore > 0 && '+'}{(stock.dailyScore || 0).toFixed(2)}
                </span>
            )
        },
        {
            header: "Price / Change",
            align: "right",
            render: (stock) => {
                const m = stock.market || {};
                const dayChange = m.open && m.close ? ((m.close - m.open) / m.open * 100) : null;
                return (
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold font-mono text-zinc-200">{formatPrice(m.close)}</span>
                        {dayChange !== null && (
                            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {dayChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Market Volume",
            align: "right",
            hiddenOnMobile: true,
            render: (stock) => {
                const m = stock.market || {};
                return (
                    <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold font-mono ${((m.volume || 0) * (m.close || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                            {formatVolume(m.volume)}
                        </span>
                        <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Day Liquidity</span>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Quick Filter Bar */}
            <div className="flex items-center justify-between mb-4 shrink-0 gap-4 min-h-[44px]">
                <div className="flex items-center gap-3">
                    <HighVolumeToggle isActive={highVolumeOnly} onClick={() => setHighVolumeOnly(!highVolumeOnly)} />
                    <div className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase font-bold">
                        {total} RECORDS FOUND IN CACHE
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all backdrop-blur-sm ${showAdvanced
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10'
                            : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                            }`}
                    >
                        <SlidersHorizontal size={14} />
                        Advanced Filters
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${showAdvanced ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-md flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest px-2">Score</span>
                        <input type="number" placeholder="Min" value={minScore} onChange={e => setMinScore(e.target.value)} className="w-20 bg-black/30 border border-zinc-700/50 text-zinc-300 text-xs rounded-xl px-3 py-2 font-mono" />
                        <span className="text-zinc-700 text-xs">—</span>
                        <input type="number" placeholder="Max" value={maxScore} onChange={e => setMaxScore(e.target.value)} className="w-20 bg-black/30 border border-zinc-700/50 text-zinc-300 text-xs rounded-xl px-3 py-2 font-mono" />
                    </div>
                    <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
                    <div className="flex items-center gap-2 relative">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest px-2">Sort By</span>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-black/30 border border-zinc-700/50 text-zinc-300 text-xs rounded-xl px-4 py-2 font-mono appearance-none pr-8 cursor-pointer">
                            <option value="score">Catalyst Strength</option>
                            <option value="volume">Trading Volume</option>
                            <option value="name">Company A-Z</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 text-zinc-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Main Content Area (DataTable) */}
            <div className="flex-1 min-h-0 flex flex-col">
                <DataTable 
                    columns={columns}
                    data={stocks}
                    loading={loading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filter symbols or company names..."
                    onRowClick={(stock) => navigate(`/stocks/${stock.symbol}`)}
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
