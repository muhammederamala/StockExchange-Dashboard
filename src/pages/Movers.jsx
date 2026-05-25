import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Clock, Activity, AlertCircle, FileText, Newspaper, Search, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "../lib/api";

// Forward-looking next-day continuation candidates. Source:
//   POST/EOD cron movers.predictContinuation → mover_continuation_candidates
//
// IMPORTANT: this page is SHADOW MODE. None of these candidates are
// auto-traded — they're for human review and learning-loop validation.
// Once the recentHitRate stabilises above the baseline, we'll wire the
// high-score band into next-morning swing entry.

export function Movers() {
    const [candidates, setCandidates] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [minScore, setMinScore] = useState(0);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (minScore > 0) params.set("minScore", String(minScore));
            params.set("limit", "100");

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

    useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [minScore]);

    const filtered = useMemo(() => {
        if (!search.trim()) return candidates;
        const q = search.trim().toUpperCase();
        return candidates.filter(c =>
            (c.symbol || "").toUpperCase().includes(q) ||
            (c.companyName || "").toUpperCase().includes(q)
        );
    }, [candidates, search]);

    return (
        <div className="flex flex-col gap-6">
            {/* Header / disclaimer */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-md p-5">
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

                {/* Hit-rate snapshot from recent backfilled outcomes */}
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Filter by symbol or name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-xs text-zinc-200 w-64 outline-none focus:border-indigo-500"
                    />
                </div>
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
                <span className="text-[10px] text-zinc-600 ml-auto font-mono">
                    {loading ? "loading…" : `${filtered.length} candidates`}
                </span>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Cards list */}
            <div className="flex flex-col gap-3">
                {filtered.length === 0 && !loading && (
                    <div className="text-center text-zinc-600 py-12 text-sm">
                        No continuation candidates yet. Comes alive after the 17:30 IST EOD cron.
                    </div>
                )}
                {filtered.map(c => <CandidateCard key={c._id} c={c} />)}
            </div>
        </div>
    );
}

function CandidateCard({ c }) {
    const f = c.features || {};
    const search = c.search || {};
    const outcome = c.outcome || null;

    const scoreColor = c.continuationScore >= 8 ? "text-emerald-400"
        : c.continuationScore >= 6 ? "text-amber-400"
        : c.continuationScore >= 4 ? "text-zinc-300"
        : "text-zinc-500";

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md p-5 hover:border-zinc-700 transition">
            <div className="flex items-start justify-between gap-6">
                {/* Left: identity + day stats */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                        <h4 className="text-base font-bold text-zinc-100">{c.symbol}</h4>
                        <span className="text-xs text-zinc-500 truncate">{c.companyName}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-zinc-500 font-mono">
                        <span>{c.date}</span>
                        <span className={c.dayChangePct >= 0 ? "text-emerald-400 flex items-center gap-1" : "text-red-400 flex items-center gap-1"}>
                            <TrendingUp size={11} /> {c.dayChangePct?.toFixed(2)}%
                        </span>
                        <span>Close ₹{c.dayClose?.toFixed(2)}</span>
                        {c.nseSymbol && <span className="text-zinc-700">{c.nseSymbol}</span>}
                    </div>
                </div>

                {/* Right: score */}
                <div className="text-right">
                    <div className={`text-2xl font-bold ${scoreColor}`}>
                        {c.continuationScore?.toFixed(1)}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                        score / 10
                    </div>
                </div>
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 mt-4">
                <Chip label="Vol mult" value={`${f.volMult?.toFixed(1)}×`} highlight={f.volMult >= 3} />
                <Chip label="Close strength" value={`${((f.closeStrength || 0) * 100).toFixed(0)}%`} highlight={f.closeStrength >= 0.8} />
                <Chip label="Turnover" value={`₹${f.liquidityCr?.toFixed(1)} Cr`} />
                {f.hasFreshFiling && <Chip icon={<FileText size={10} />} label="Filing" value={String(f.freshFilingCount)} highlight />}
                {f.hasFreshSignal && <Chip icon={<Newspaper size={10} />} label="News/signal" value={String(f.freshSignalCount)} highlight />}
                {f.priorSpike && <Chip label="Prior spike" value={`${f.priorSpikePct?.toFixed(1)}%`} negative />}
                <Chip label="NIFTY" value={f.niftyRegime} negative={f.niftyRegime === 'BEARISH'} highlight={f.niftyRegime === 'BULLISH'} />
            </div>

            {/* Gemini search summary */}
            {search?.summary && (
                <div className={`mt-4 p-3 rounded-lg border text-xs leading-relaxed ${search.catalystInferred ? "border-indigo-500/20 bg-indigo-500/5 text-zinc-300" : "border-zinc-800 bg-zinc-900/30 text-zinc-500"}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Search size={11} className="text-zinc-500" />
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                            {search.backend === 'gemini' ? 'Gemini Search' : 'RSS+Groq'}
                            {search.catalystInferred ? ' · catalyst found' : ' · no clear catalyst'}
                        </span>
                    </div>
                    {search.summary}
                </div>
            )}

            {/* Outcome (if filled) */}
            {outcome && (
                <div className={`mt-3 p-3 rounded-lg border text-xs ${outcome.didContinue ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
                            <Clock size={10} /> Next-day outcome ({outcome.nextDayDate})
                        </span>
                        <OutcomeStat label="Open" pct={outcome.nextDayOpenPct} />
                        <OutcomeStat label="High" pct={outcome.nextDayHighPct} />
                        <OutcomeStat label="Close" pct={outcome.nextDayClosePct} />
                        <span className={`text-[11px] font-bold ml-auto ${outcome.didContinue ? "text-emerald-400" : "text-zinc-500"}`}>
                            {outcome.didContinue ? "✓ continued" : "✗ faded"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function Chip({ label, value, icon, highlight, negative }) {
    const color = negative ? "text-red-300 border-red-500/30 bg-red-500/5"
        : highlight ? "text-indigo-300 border-indigo-500/30 bg-indigo-500/5"
        : "text-zinc-400 border-zinc-800 bg-zinc-900/40";
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono ${color}`}>
            {icon}
            <span className="text-zinc-500">{label}</span>
            <span className="font-bold">{value ?? "—"}</span>
        </div>
    );
}

function OutcomeStat({ label, pct }) {
    const color = pct == null ? "text-zinc-600" : pct >= 0 ? "text-emerald-400" : "text-red-400";
    const Icon = pct >= 0 ? TrendingUp : TrendingDown;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-mono ${color}`}>
            <span className="text-zinc-500">{label}</span>
            {pct != null && <Icon size={10} />}
            {pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
        </span>
    );
}
