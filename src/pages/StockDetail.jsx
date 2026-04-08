import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, FileText, Newspaper, FileDown, Activity, ChevronDown, ChevronRight, BarChart3, Volume2, ArrowUpRight, ArrowDownRight, Calendar, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { DataTable } from "../components/DataTable";

import { StockPriceChart } from "../components/StockPriceChart";

export function StockDetail() {
    const { symbol } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScoresOpen, setIsScoresOpen] = useState(true);
    const [isFilingsOpen, setIsFilingsOpen] = useState(true);
    const [isNewsOpen, setIsNewsOpen] = useState(true);
    const [alertSearch, setAlertSearch] = useState("");

    useEffect(() => {
        let isMounted = true;
        const fetchStats = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                const res = await fetch(`${baseUrl}/api/stocks/${symbol}`);
                const result = await res.json();
                if (isMounted) setData(result);
            } catch (err) {
                console.error("Failed to load details:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchStats();
        return () => { isMounted = false; };
    }, [symbol]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                <div className="text-zinc-500 animate-pulse font-mono flex items-center gap-3">
                    <Activity className="animate-spin text-indigo-500" size={20} />
                    QUANTIFYING DATA VECTORS...
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-red-500 flex-1">Database Error. Could not load ticker information.</div>;

    const getScoreColor = (score) => {
        if (score > 1.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (score > 0) return 'text-emerald-300 bg-emerald-500/5 border-emerald-500/10';
        if (score < -1.5) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (score < 0) return 'text-red-300 bg-red-500/5 border-red-500/10';
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    };

    const currentScore = data.scores && data.scores.length > 0
        ? data.scores[data.scores.length - 1].dailyScore
        : 0;

    const cScore = data.cumulativeScore !== null ? data.cumulativeScore : 0;
    const market = data.market || null;

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

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const dayChange = market && market.open && market.close
        ? ((market.close - market.open) / market.open * 100)
        : null;

    return (
        <div className="flex flex-col flex-1 w-full gap-6 overflow-y-auto pr-2 custom-scrollbar pb-12">

            {/* Back Link */}
            <Link to="/stocks" className="flex items-center gap-2 text-zinc-500 hover:text-indigo-400 transition-colors text-sm w-fit">
                <ArrowLeft size={14} />
                Back to Database
            </Link>

            {/* Header Panel */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-md flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl relative overflow-hidden shrink-0">
                {/* Subtle Glow */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[80px] rounded-full opacity-30 ${cScore > 0 ? 'bg-emerald-500' : cScore < 0 ? 'bg-red-500' : 'bg-indigo-500'}`} />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded font-mono text-xs border border-zinc-700 tracking-widest shadow-inner">
                            TICKER: {data.symbol}
                        </span>
                        {market && ((market.volume || 0) * (market.close || 0)) >= 50000000 && (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20 rounded flex items-center gap-1">
                                <Volume2 size={10} />
                                High Volume
                            </span>
                        )}
                    </div>
                    <h2 className="text-4xl font-extrabold pb-1 bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-600 tracking-tight">
                        {data.companyName}
                    </h2>
                </div>

                <div className="flex gap-3 flex-wrap relative z-10">
                    <div className="bg-black/40 border border-zinc-800 px-5 py-3 rounded-xl flex flex-col items-center min-w-[110px]">
                        <span className="text-[10px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">Daily Score</span>
                        <span className={`text-xl font-bold font-mono px-3 py-1 border rounded-lg shadow-sm ${getScoreColor(currentScore)}`}>
                            {currentScore > 0 ? '+' : ''}{currentScore.toFixed(2)}
                        </span>
                    </div>
                    <div className="bg-black/40 border border-zinc-800 px-5 py-3 rounded-xl flex flex-col items-center min-w-[110px]">
                        <span className="text-[10px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">Cumulative</span>
                        <span className={`text-xl font-bold flex items-center gap-2 font-mono px-3 py-1 border rounded-lg shadow-sm ${getScoreColor(cScore)}`}>
                            {cScore > 0 ? <TrendingUp size={18} /> : cScore < 0 ? <TrendingDown size={18} /> : null}
                            {cScore > 0 ? '+' : ''}{cScore.toFixed(2)}
                        </span>
                    </div>
                    {market && market.close && (
                        <div className="bg-black/40 border border-zinc-800 px-5 py-3 rounded-xl flex flex-col items-center min-w-[110px]">
                            <span className="text-[10px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">LTP</span>
                            <span className="text-xl font-bold font-mono text-zinc-100">
                                {formatPrice(market.close)}
                            </span>
                            {dayChange !== null && (
                                <span className={`text-[10px] font-mono flex items-center gap-0.5 mt-0.5 ${dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {dayChange >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Market Data Panel */}
            {market && (market.open || market.volume > 0) && (
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 backdrop-blur-md shrink-0">
                    <h3 className="text-sm font-semibold text-zinc-400 mb-4 border-b border-zinc-800/80 pb-3 flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-400" />
                        TODAY'S MARKET DATA
                        {market.candleCount > 0 && (
                            <span className="text-[10px] font-mono text-zinc-600 ml-auto">
                                {market.candleCount} candles tracked
                            </span>
                        )}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Open */}
                        <div className="bg-black/30 rounded-xl p-3.5 border border-zinc-800/50">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Open</span>
                            <span className="text-lg font-bold font-mono text-zinc-200">{formatPrice(market.open)}</span>
                        </div>

                        {/* High */}
                        <div className="bg-black/30 rounded-xl p-3.5 border border-emerald-500/10">
                            <span className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-semibold block mb-1">Day High</span>
                            <span className="text-lg font-bold font-mono text-emerald-400">{formatPrice(market.high)}</span>
                        </div>

                        {/* Low */}
                        <div className="bg-black/30 rounded-xl p-3.5 border border-red-500/10">
                            <span className="text-[10px] text-red-400/60 uppercase tracking-wider font-semibold block mb-1">Day Low</span>
                            <span className="text-lg font-bold font-mono text-red-400">{formatPrice(market.low)}</span>
                        </div>

                        {/* Close / LTP */}
                        <div className="bg-black/30 rounded-xl p-3.5 border border-zinc-800/50">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Last Price</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold font-mono text-zinc-200">{formatPrice(market.close)}</span>
                                {dayChange !== null && (
                                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${dayChange >= 0
                                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                                        }`}>
                                        {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Volume */}
                        <div className="bg-black/30 rounded-xl p-3.5 border border-indigo-500/10">
                            <span className="text-[10px] text-indigo-400/60 uppercase tracking-wider font-semibold block mb-1">Volume</span>
                            <span className={`text-lg font-bold font-mono ${((market.volume || 0) * (market.close || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                                {formatVolume(market.volume)}
                            </span>
                            {((market.volume || 0) * (market.close || 0)) >= 50000000 && (
                                <span className="text-[10px] text-indigo-400/50 block mt-0.5">High Volume</span>
                            )}
                        </div>
                    </div>

                    {/* Day Range Bar */}
                    {market.low && market.high && market.close && (
                        <div className="mt-4 px-1">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
                                <span>Day Low: {formatPrice(market.low)}</span>
                                <span>Day High: {formatPrice(market.high)}</span>
                            </div>
                            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500/70 via-amber-400/50 to-emerald-500/70 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, Math.max(3, ((market.close - market.low) / (market.high - market.low)) * 100))}%`
                                    }}
                                />
                                {/* Current price marker */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg shadow-white/30 transition-all duration-500"
                                    style={{
                                        left: `${Math.min(99, Math.max(1, ((market.close - market.low) / (market.high - market.low)) * 100))}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Historical Alerts Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Historical Alpha Alerts</h3>
                    <span className="text-[10px] font-mono text-zinc-600 ml-auto uppercase tracking-widest">
                        {data.alerts?.length || 0} signals processed
                    </span>
                </div>
                
                <div className="h-[400px]">
                    <DataTable 
                        columns={[
                            {
                                header: "Sent / Entry",
                                render: (alert) => (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                                            <Calendar size={12} className="text-zinc-600" />
                                            {formatDate(alert.alertTime)}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                                            <Clock size={10} /> {formatPrice(alert.entryPrice)} 
                                            <span className="opacity-50">({alert.entryTime?.t || 'at-alert'})</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: "Strategy",
                                render: (alert) => (
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-tighter">
                                        {alert.strategy}
                                    </span>
                                )
                            },
                            {
                                header: "Max Gain",
                                align: "right",
                                render: (alert) => (
                                    <div className="flex flex-col items-end">
                                        <span className={`text-sm font-black font-mono flex items-center gap-1 ${alert.maxGain > 5 ? 'text-emerald-400' : alert.maxGain > 0 ? 'text-emerald-400/70' : 'text-zinc-500'}`}>
                                            <ArrowUpRight size={14} />
                                            +{(alert.maxGain || 0).toFixed(2)}%
                                        </span>
                                        <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Peak Outcome</span>
                                    </div>
                                )
                            },
                            {
                                header: "Optimal Exit",
                                align: "right",
                                render: (alert) => alert.optimalExit ? (
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-zinc-300 text-[10px] font-bold">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            {formatDate(alert.optimalExit.date)}
                                        </div>
                                        <div className="text-[11px] font-mono font-bold text-zinc-400 mt-0.5">
                                            {formatPrice(alert.optimalExit.price)}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-zinc-700 font-mono text-[10px]">IN-PROGRESS</span>
                                )
                            }
                        ]}
                        data={(data.alerts || []).filter(a => 
                            alertSearch === "" || 
                            a.strategy.toLowerCase().includes(alertSearch.toLowerCase()) ||
                            formatDate(a.alertTime).toLowerCase().includes(alertSearch.toLowerCase())
                        )}
                        searchValue={alertSearch}
                        onSearchChange={setAlertSearch}
                        searchPlaceholder="Filter strategy or date..."
                        emptyState={
                            <div className="py-12 text-center flex flex-col items-center gap-3 opacity-40">
                                <ShieldAlert size={32} className="text-zinc-600" />
                                <p className="text-sm font-mono tracking-widest text-zinc-500 uppercase">No historical alpha alerts detected for this ticker</p>
                            </div>
                        }
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                {/* Left Column (Scores Chart) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
                        <h3
                            className="text-sm font-semibold text-zinc-400 mb-4 border-b border-zinc-800/80 pb-3 flex justify-between items-center cursor-pointer select-none hover:text-indigo-300 transition-colors"
                            onClick={() => setIsScoresOpen(!isScoresOpen)}
                        >
                            <span className="flex items-center gap-2">
                                {isScoresOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                20-DAY SCORE HISTORY
                            </span>
                            <Activity size={14} className="text-indigo-400" />
                        </h3>
                        {isScoresOpen && (
                            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {[...data.scores].sort((a, b) => new Date(b.date) - new Date(a.date)).map((s, i) => (
                                    <div key={i} className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg border border-transparent hover:border-zinc-800/50 transition-colors">
                                        <span className="text-xs font-mono text-zinc-500">
                                            {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getScoreColor(s.dailyScore)}`}>
                                            {s.dailyScore > 0 ? '+' : ''}{(s.dailyScore || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                {data.scores.length === 0 && <div className="text-zinc-600 text-sm text-center py-6">No recent scoring history.</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Catalysts) */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Filings Section */}
                    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
                        <h3
                            className="text-sm font-semibold text-zinc-400 mb-4 border-b border-zinc-800/80 pb-3 flex items-center justify-between cursor-pointer select-none hover:text-emerald-300 transition-colors"
                            onClick={() => setIsFilingsOpen(!isFilingsOpen)}
                        >
                            <span className="flex items-center gap-2">
                                {isFilingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <FileText size={16} className="text-emerald-400" />
                                OFFICIAL FILINGS
                            </span>
                        </h3>

                        {isFilingsOpen && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {data.filings.length === 0 && (
                                    <p className="text-zinc-500 text-sm py-4 text-center">No recent exchange filings found.</p>
                                )}
                                {data.filings.map((f, i) => (
                                    <div key={i} className="bg-black/30 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">
                                                        {f.category}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 font-mono">
                                                        {new Date(f.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-medium text-zinc-200 leading-tight mb-2">
                                                    {f.subject}
                                                </h4>
                                                {f.financialFacts && f.financialFacts.length > 0 && (
                                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-800/50 pt-3">
                                                        {f.financialFacts.map((fact, idx) => (
                                                            <div key={idx} className="bg-zinc-900/50 px-2 py-1.5 rounded text-xs border border-zinc-800">
                                                                <p className="text-zinc-500 truncate">{fact.metric}</p>
                                                                <p className={`font-mono font-bold truncate ${fact.growth > 0 ? 'text-emerald-400' : fact.growth < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                                                                    {fact.value} {fact.growth ? `(${fact.growth > 0 ? '+' : ''}${fact.growth}%)` : ''}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {f.attachmentUrl && (
                                                <a
                                                    href={f.attachmentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-shrink-0 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 p-2.5 rounded-lg border border-indigo-500/20 transition-all group"
                                                    title="Download Source PDF"
                                                >
                                                    <FileDown size={18} className="group-hover:scale-110 transition-transform" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* News Section */}
                    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
                        <h3
                            className="text-sm font-semibold text-zinc-400 mb-4 border-b border-zinc-800/80 pb-3 flex flex-row items-center justify-between cursor-pointer select-none hover:text-blue-300 transition-colors"
                            onClick={() => setIsNewsOpen(!isNewsOpen)}
                        >
                            <span className="flex items-center gap-2">
                                {isNewsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <Newspaper size={16} className="text-blue-400" />
                                MEDIA & HEADLINES
                            </span>
                        </h3>

                        {isNewsOpen && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {data.news.length === 0 && (
                                    <p className="text-zinc-500 text-sm py-4 text-center">No recent localized news found.</p>
                                )}
                                {data.news.map((n, i) => (
                                    <div key={i} className="bg-black/30 p-4 rounded-xl border border-zinc-800/50">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${n.sentiment === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                n.sentiment === 'BEARISH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                {n.sentiment}
                                            </span>
                                            <span className="text-xs text-zinc-500 font-mono">
                                                {new Date(n.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium text-zinc-300 leading-snug">
                                            <a href={n.link} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors underline decoration-zinc-700 decoration-1 underline-offset-4 font-serif">
                                                "{n.title}"
                                            </a>
                                        </h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Price Chart Section - Full Row */}
            <div className="w-full shrink-0">
                <StockPriceChart symbol={symbol} />
            </div>
        </div>
    );
}
