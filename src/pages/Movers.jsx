import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Clock, Activity, AlertCircle, FileText, Newspaper, Search, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "../components/DataTable";
import { apiFetch } from "../lib/api";

export function Movers() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [minScore, setMinScore] = useState(0);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (minScore > 0) params.set("minScore", String(minScore));
            params.set("limit", "200");

            const today = format(new Date(), "yyyy-MM-dd");

            const [listRes, summaryRes] = await Promise.all([
                apiFetch(`/api/movers/candidates?${params}`),
                apiFetch(`/api/movers/candidates/summary?date=${today}`),
            ]);

            if (!listRes.ok) throw new Error(`candidates list failed (${listRes.status})`);
            const listJson = await listRes.json();
            setCandidates(listJson.data || []);

            if (summaryRes.ok) {
                const summaryJson = await summaryRes.json();
                setSummary(summaryJson);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [minScore]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { setPage(1); }, [search, minScore]);

    const filtered = useMemo(() => {
        if (!search.trim()) return candidates;
        const q = search.trim().toUpperCase();
        return candidates.filter(c =>
            (c.symbol || "").toUpperCase().includes(q) ||
            (c.companyName || "").toUpperCase().includes(q)
        );
    }, [candidates, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginatedData = useMemo(() => {
        return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }, [filtered, page]);

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const columns = [
        {
            header: "Symbol & Company",
            key: "symbol",
            render: (c) => (
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-indigo-400">
                        <Activity size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-bold">{c.symbol}</span>
                        <span className="text-xs text-zinc-500 truncate max-w-[180px]">{c.companyName}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Date / Day Change",
            render: (c) => (
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 font-mono">{c.date}</span>
                    <span className={`text-xs font-mono flex items-center gap-1 ${c.dayChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {c.dayChangePct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {c.dayChangePct >= 0 ? '+' : ''}{c.dayChangePct?.toFixed(2)}%
                    </span>
                </div>
            )
        },
        {
            header: "Close",
            align: "right",
            render: (c) => (
                <span className="text-sm font-mono text-zinc-200">{formatPrice(c.dayClose)}</span>
            )
        },
        {
            header: "Score",
            align: "right",
            render: (c) => {
                const score = c.continuationScore;
                const color = score >= 8 ? "text-emerald-400" : score >= 6 ? "text-amber-400" : score >= 4 ? "text-zinc-300" : "text-zinc-500";
                return (
                    <span className={`text-base font-bold font-mono ${color}`}>
                        {score != null ? score.toFixed(1) : "—"}
                    </span>
                );
            }
        },
        {
            header: "Signals",
            hiddenOnMobile: true,
            render: (c) => {
                const f = c.features || {};
                return (
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {f.volMult != null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${f.volMult >= 3 ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' : 'border-zinc-800 bg-zinc-900/40 text-zinc-400'}`}>
                                {f.volMult?.toFixed(1)}×
                            </span>
                        )}
                        {f.closeStrength != null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${f.closeStrength >= 0.8 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-zinc-800 bg-zinc-900/40 text-zinc-400'}`}>
                                {((f.closeStrength || 0) * 100).toFixed(0)}%
                            </span>
                        )}
                        {f.hasFreshFiling && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 flex items-center gap-1">
                                <FileText size={9} /> {f.freshFilingCount}
                            </span>
                        )}
                        {f.hasFreshSignal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/5 text-amber-300 flex items-center gap-1">
                                <Newspaper size={9} /> {f.freshSignalCount}
                            </span>
                        )}
                        {f.niftyRegime && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${f.niftyRegime === 'BULLISH' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : f.niftyRegime === 'BEARISH' ? 'border-red-500/30 bg-red-500/5 text-red-300' : 'border-zinc-800 bg-zinc-900/40 text-zinc-400'}`}>
                                {f.niftyRegime}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Summary",
            hiddenOnMobile: true,
            render: (c) => {
                const s = c.search || {};
                if (!s.summary) return <span className="text-zinc-700 text-xs">—</span>;
                const truncated = s.summary.length > 80 ? s.summary.slice(0, 80) + "…" : s.summary;
                const isGemini = s.backend === 'gemini';
                const foundCatalyst = s.catalystInferred;
                return (
                    <div className="flex flex-col gap-1.5 max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1 py-0.5 rounded uppercase font-bold tracking-wider ${isGemini ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                {isGemini ? 'Gemini' : 'RSS+Groq'}
                            </span>
                            {foundCatalyst && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold tracking-wider">
                                    Catalyst
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-zinc-400 leading-relaxed" title={s.summary}>
                            {truncated}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Outcome",
            align: "center",
            render: (c) => {
                const outcome = c.outcome;
                if (!outcome) return <span className="text-zinc-700 text-xs">—</span>;
                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xs font-bold ${outcome.didContinue ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {outcome.didContinue ? '✓ Continued' : '✗ Faded'}
                        </span>
                        {outcome.nextDayClosePct != null && (
                            <span className={`text-[10px] font-mono ${outcome.nextDayClosePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {outcome.nextDayClosePct >= 0 ? '+' : ''}{outcome.nextDayClosePct.toFixed(2)}%
                            </span>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-md p-5 mb-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                            <Activity size={16} className="text-indigo-400" />
                            Continuation Candidates
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                            Stocks that moved sharply today and may continue tomorrow.
                            Scored 0-10 from volume, close strength, fresh filings/news, and
                            an on-the-fly Gemini search. Shadow mode — not auto-traded;
                            for review and learning-loop validation only.
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition"
                    >
                        <RefreshCcw size={12} /> Refresh
                    </button>
                </div>

                {summary?.recentHitRate?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-900">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">
                            Rolling 200-doc Hit Rate by Score Band
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {summary.recentHitRate.map(band => (
                                <div key={band.scoreBand} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                                    <div className="text-[10px] text-zinc-500 font-mono">
                                        {band.scoreBand === 'other' ? '<0 or >10' : `Score ≥ ${band.scoreBand}`}
                                    </div>
                                    <div className="text-lg font-bold text-zinc-200 mt-1">
                                        {band.hitRate != null ? `${(band.hitRate * 100).toFixed(0)}%` : '—'}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">
                                        {band.continued}/{band.total} continued · avg close {band.avgClosePct != null ? `${band.avgClosePct.toFixed(2)}%` : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <label className="text-xs text-zinc-500 flex items-center gap-2">
                        Min score:
                        <select
                            value={minScore}
                            onChange={(e) => setMinScore(parseFloat(e.target.value))}
                            className="bg-zinc-950/50 border border-zinc-800 rounded-lg text-xs text-zinc-200 px-2 py-1.5 outline-none"
                        >
                            <option value={0}>All</option>
                            <option value={4}>≥ 4</option>
                            <option value={6}>≥ 6</option>
                            <option value={8}>≥ 8</option>
                        </select>
                    </label>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
                    {loading ? "Loading…" : `${filtered.length} CANDIDATES`}
                </span>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs mb-4 shrink-0">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col">
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    loading={loading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filter by symbol or name…"
                    emptyState={
                        <div className="text-center text-zinc-500 py-8">
                            <p className="text-sm font-medium">No continuation candidates yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Comes alive after the 17:30 IST EOD cron.</p>
                        </div>
                    }
                    onRowClick={(c) => navigate(`/stocks/${c.symbol}`)}
                    pagination={{
                        page,
                        totalPages: totalPages || 1,
                        total: filtered.length,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    );
}
