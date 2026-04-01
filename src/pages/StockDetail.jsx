import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, FileText, Newspaper, FileDown, Activity, ChevronDown, ChevronRight } from "lucide-react";

export function StockDetail() {
    const { symbol } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScoresOpen, setIsScoresOpen] = useState(true);
    const [isFilingsOpen, setIsFilingsOpen] = useState(true);
    const [isNewsOpen, setIsNewsOpen] = useState(true);

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
        ? data.scores[0].dailyScore
        : 0;

    const cScore = data.cumulativeScore !== null ? data.cumulativeScore : 0;

    return (
        <div className="flex flex-col flex-1 w-full gap-6 overflow-y-auto pr-2 custom-scrollbar pb-12">


            {/* Header Panel */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-md flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl relative overflow-hidden shrink-0">
                {/* Subtle Glow */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[80px] rounded-full opacity-30 ${cScore > 0 ? 'bg-emerald-500' : cScore < 0 ? 'bg-red-500' : 'bg-indigo-500'}`} />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded font-mono text-xs border border-zinc-700 tracking-widest shadow-inner">
                            TICKER: {data.symbol}
                        </span>
                    </div>
                    <h2 className="text-4xl font-extrabold pb-1 bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-600 tracking-tight">
                        {data.companyName}
                    </h2>
                </div>

                <div className="flex gap-4 relative z-10">
                    <div className="bg-black/40 border border-zinc-800 px-5 py-3 rounded-xl flex flex-col items-center min-w-[120px]">
                        <span className="text-xs text-zinc-500 font-semibold mb-1 uppercase tracking-wider">Daily Score</span>
                        <span className={`text-xl font-bold font-mono px-3 py-1 border rounded-lg shadow-sm ${getScoreColor(currentScore)}`}>
                            {currentScore > 0 ? '+' : ''}{currentScore.toFixed(2)}
                        </span>
                    </div>
                    <div className="bg-black/40 border border-zinc-800 px-5 py-3 rounded-xl flex flex-col items-center min-w-[120px]">
                        <span className="text-xs text-zinc-500 font-semibold mb-1 uppercase tracking-wider">Cumulative</span>
                        <span className={`text-xl font-bold flex items-center gap-2 font-mono px-3 py-1 border rounded-lg shadow-sm ${getScoreColor(cScore)}`}>
                            {cScore > 0 ? <TrendingUp size={18} /> : cScore < 0 ? <TrendingDown size={18} /> : null}
                            {cScore > 0 ? '+' : ''}{cScore.toFixed(2)}
                        </span>
                    </div>
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
        </div>
    );
}


