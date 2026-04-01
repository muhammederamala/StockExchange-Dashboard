import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Database, ArrowRight, TrendingUp } from "lucide-react";

export function Stocks() {
    const [search, setSearch] = useState("");
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        // Fetch stocks from the new API we created
        let isMounted = true;
        const fetchStocks = async () => {
            setLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                const res = await fetch(`${baseUrl}/api/stocks?q=${search}&page=${page}&limit=20`);
                const data = await res.json();
                if (isMounted) {
                    setStocks(data.data || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                }
            } catch (err) {
                console.error("Failed to load stocks:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchStocks();
        }, 300); // 300ms debounce

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [search, page]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight flex items-center gap-3">
                        <Database size={24} className="text-indigo-400" />
                        Stock Database
                    </h2>
                    <p className="text-zinc-500 mt-1 text-sm">
                        Search and view historical scores and signals for all actively monitored stocks.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-72">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search symbol, ID, or company..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600 backdrop-blur-sm"
                    />
                </div>
            </div>

            {/* Modern Grid List */}
            <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl overflow-hidden backdrop-blur-md flex-1 min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-zinc-500 animate-pulse">
                        Scanning Database...
                    </div>
                ) : stocks.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-zinc-500">
                        No stocks found matching '{search}'
                    </div>
                ) : (
                    <div className="overflow-auto h-full w-full">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-900/80 sticky top-0 text-xs uppercase font-semibold text-zinc-500 tracking-wider">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Symbol / ID</th>
                                    <th className="px-4 md:px-6 py-4">Company Name</th>
                                    <th className="px-4 md:px-6 py-4">Score</th>
                                    <th className="px-4 md:px-6 py-4 hidden md:table-cell">Last Updated</th>
                                    <th className="px-4 md:px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {stocks.map((stock) => (
                                    <tr key={stock.symbol} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-4 md:px-6 py-4 font-mono text-zinc-300 hidden sm:table-cell text-xs">
                                            {stock.symbol}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-zinc-200 font-medium truncate max-w-[140px] sm:max-w-[250px]">
                                            {stock.companyName}
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold font-mono border ${stock.dailyScore > 0
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : stock.dailyScore < 0
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                {stock.dailyScore > 0 && '+'}{stock.dailyScore === undefined ? '0.00' : (stock.dailyScore || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-xs text-zinc-500 font-mono hidden md:table-cell">
                                            {stock.updatedAt ? new Date(stock.updatedAt).toLocaleString() : new Date(stock.latestDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <Link
                                                to={`/stocks/${stock.symbol}`}
                                                className="inline-flex items-center gap-1 sm:gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Analyze</span>
                                                <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {stocks.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-2 pb-2 shrink-0">
                    <div className="text-xs text-zinc-500 font-mono">
                        PAGE {page} OF {totalPages}
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
