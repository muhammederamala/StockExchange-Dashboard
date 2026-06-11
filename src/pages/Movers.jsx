import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp, TrendingDown, Clock, Activity, AlertCircle, FileText,
    Newspaper, RefreshCcw, Zap, BarChart2, Target, ChevronRight, Wifi, WifiOff
} from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "../components/DataTable";
import { apiFetch } from "../lib/api";

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
    if (!price) return "—";
    return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPct = (pct) => {
    if (pct == null) return "—";
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(2)}%`;
};

const REGIME_CONFIG = {
    BULLISH:  { label: "Bullish",  cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
    NEUTRAL:  { label: "Neutral",  cls: "border-zinc-600/40 bg-zinc-800/60 text-zinc-400" },
    WEAK:     { label: "Weak Mkt", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
    ADVERSE:  { label: "⚠ Adverse Market", cls: "border-red-500/40 bg-red-500/10 text-red-300" },
};

// ─── Regime badge ─────────────────────────────────────────────────────────────
function RegimeBadge({ regime, niftyChangePct }) {
    if (!regime) return null;
    const cfg = REGIME_CONFIG[regime] || REGIME_CONFIG.NEUTRAL;
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${cfg.cls}`}>
            Nifty {niftyChangePct != null ? formatPct(niftyChangePct) : ""} · {cfg.label}
        </span>
    );
}

// ─── RVOL badge ───────────────────────────────────────────────────────────────
function RvolBadge({ rvol }) {
    if (rvol == null) return <span className="text-zinc-700 text-xs font-mono">—</span>;
    const color = rvol >= 5 ? "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10"
                : rvol >= 3 ? "text-indigo-300 border-indigo-500/40 bg-indigo-500/10"
                            : "text-zinc-500 border-zinc-700/40 bg-zinc-800/40";
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${color}`}>
            {rvol.toFixed(1)}×
        </span>
    );
}

// ─── RSI badge ────────────────────────────────────────────────────────────────
function RsiBadge({ rsi }) {
    if (rsi == null) return <span className="text-zinc-700 text-xs font-mono">—</span>;
    const inZone = rsi >= 65 && rsi <= 78;
    const color = inZone
        ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
        : rsi > 78
            ? "text-red-300 border-red-500/40 bg-red-500/10"
            : "text-zinc-500 border-zinc-700/40 bg-zinc-800/40";
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${color}`}>
            RSI {rsi.toFixed(1)}
        </span>
    );
}

// ─── Preliminary pill ─────────────────────────────────────────────────────────
function PrelimBadge() {
    return (
        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold tracking-wider uppercase">
            Preliminary
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EARLY MOVERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const WINDOWS = [
    { key: "PRE_MARKET",       label: "Pre-Market", sublabel: "9:08 AM", icon: Clock },
    { key: "OPENING_MOMENTUM", label: "Opening",    sublabel: "9:25 / 9:35", icon: Zap },
    { key: "STEADY_BREAKOUT",  label: "Breakout",   sublabel: "10:00 AM", icon: Target },
];

function EarlyMoversView() {
    const [activeWindow, setActiveWindow] = useState("PRE_MARKET");
    const [grouped, setGrouped]       = useState({ PRE_MARKET: [], OPENING_MOMENTUM: [], STEADY_BREAKOUT: [] });
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const intervalRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch("/api/early-movers");
            if (!res.ok) throw new Error(`early-movers failed (${res.status})`);
            const json = await res.json();
            setGrouped(json.grouped || { PRE_MARKET: [], OPENING_MOMENTUM: [], STEADY_BREAKOUT: [] });
            setLastRefresh(new Date());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh every 60 s while tab is mounted
    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 60_000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const rows = grouped[activeWindow] || [];

    // PRE_MARKET columns
    const preMarketCols = [
        {
            header: "Symbol",
            render: (r) => (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400"><Clock size={14} /></div>
                    <div className="flex flex-col">
                        <span className="text-zinc-100 font-bold text-sm">{r.symbol}</span>
                        <span className="text-zinc-500 text-[10px] truncate max-w-[140px]">{r.companyName}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Gap Up",
            align: "right",
            render: (r) => (
                <span className="text-emerald-400 font-bold font-mono text-sm">
                    {formatPct(r.preMarketGapPct)}
                </span>
            ),
        },
        {
            header: "Pre-Market Price",
            align: "right",
            render: (r) => <span className="font-mono text-zinc-200 text-sm">{formatPrice(r.preMarketPrice)}</span>,
        },
        {
            header: "Pre-Mkt Vol",
            align: "right",
            render: (r) => (
                <span className="font-mono text-zinc-400 text-xs">
                    {r.preMarketVolume ? r.preMarketVolume.toLocaleString("en-IN") : "—"}
                </span>
            ),
        },
        {
            header: "Turnover",
            align: "right",
            render: (r) => <span className="font-mono text-zinc-400 text-xs">{r.turnoverCr != null ? `₹${r.turnoverCr.toFixed(1)} Cr` : "—"}</span>,
        },
        {
            header: "Market",
            align: "center",
            render: (r) => <RegimeBadge regime={r.marketRegime} niftyChangePct={r.niftyChangePct} />,
        },
    ];

    // OPENING_MOMENTUM columns
    const openingCols = [
        {
            header: "Symbol",
            render: (r) => (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"><Zap size={14} /></div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-100 font-bold text-sm">{r.symbol}</span>
                            {r.isPreliminary && <PrelimBadge />}
                        </div>
                        <span className="text-zinc-500 text-[10px] truncate max-w-[140px]">{r.companyName}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Gain",
            align: "right",
            render: (r) => (
                <span className="text-emerald-400 font-bold font-mono text-sm">{formatPct(r.pctGain)}</span>
            ),
        },
        {
            header: "Price",
            align: "right",
            render: (r) => <span className="font-mono text-zinc-200 text-sm">{formatPrice(r.price)}</span>,
        },
        {
            header: "RVOL",
            align: "center",
            render: (r) => <RvolBadge rvol={r.rvol} />,
        },
        {
            header: "Turnover",
            align: "right",
            render: (r) => <span className="font-mono text-zinc-400 text-xs">{r.turnoverCr != null ? `₹${r.turnoverCr.toFixed(1)} Cr` : "—"}</span>,
        },
        {
            header: "Market",
            align: "center",
            render: (r) => <RegimeBadge regime={r.marketRegime} niftyChangePct={r.niftyChangePct} />,
        },
    ];

    // STEADY_BREAKOUT columns
    const breakoutCols = [
        {
            header: "Symbol",
            render: (r) => (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Target size={14} /></div>
                    <div className="flex flex-col">
                        <span className="text-zinc-100 font-bold text-sm">{r.symbol}</span>
                        <span className="text-zinc-500 text-[10px] truncate max-w-[140px]">{r.companyName}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Gain",
            align: "right",
            render: (r) => (
                <span className="text-emerald-400 font-bold font-mono text-sm">{formatPct(r.pctGain)}</span>
            ),
        },
        {
            header: "Price",
            align: "right",
            render: (r) => <span className="font-mono text-zinc-200 text-sm">{formatPrice(r.price)}</span>,
        },
        {
            header: "OR High",
            align: "right",
            render: (r) => (
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-zinc-300 text-xs">{formatPrice(r.openingRangeHigh)}</span>
                    {r.isBreakoutAboveOR && (
                        <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <ChevronRight size={9} /> Above OR
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: "RSI-14",
            align: "center",
            render: (r) => <RsiBadge rsi={r.rsi14} />,
        },
        {
            header: "RVOL",
            align: "center",
            render: (r) => <RvolBadge rvol={r.rvol} />,
        },
        {
            header: "Market",
            align: "center",
            hiddenOnMobile: true,
            render: (r) => <RegimeBadge regime={r.marketRegime} niftyChangePct={r.niftyChangePct} />,
        },
    ];

    const colsByWindow = {
        PRE_MARKET:       preMarketCols,
        OPENING_MOMENTUM: openingCols,
        STEADY_BREAKOUT:  breakoutCols,
    };

    const totalResults = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

    return (
        <div className="flex flex-col gap-4">
            {/* Header bar */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-md p-5 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                            <Zap size={16} className="text-indigo-400" />
                            Early Movers
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                            Real-time intraday scans during the first hour of trading.
                            Scans fire at <span className="text-zinc-300 font-mono">9:08</span>,{" "}
                            <span className="text-zinc-300 font-mono">9:25</span>,{" "}
                            <span className="text-zinc-300 font-mono">9:35</span> and{" "}
                            <span className="text-zinc-300 font-mono">10:00 AM IST</span> on trading days.
                            Results auto-expire after 24 h.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {lastRefresh && (
                            <span className="text-[10px] text-zinc-600 font-mono hidden sm:block">
                                {format(lastRefresh, "HH:mm:ss")}
                            </span>
                        )}
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition"
                        >
                            <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="mt-4 pt-4 border-t border-zinc-900 grid grid-cols-3 gap-3">
                    {WINDOWS.map((w) => {
                        const count = (grouped[w.key] || []).length;
                        const Icon  = w.icon;
                        return (
                            <div key={w.key} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-zinc-800 border border-zinc-700/50 text-indigo-400">
                                    <Icon size={13} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-zinc-200">{count}</div>
                                    <div className="text-[10px] text-zinc-500">{w.label} <span className="font-mono">{w.sublabel}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scan window tabs */}
            <div className="flex items-center gap-1 shrink-0">
                {WINDOWS.map((w) => {
                    const isActive = activeWindow === w.key;
                    const count    = (grouped[w.key] || []).length;
                    const Icon     = w.icon;
                    return (
                        <button
                            key={w.key}
                            onClick={() => setActiveWindow(w.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                                isActive
                                    ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10"
                                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                            }`}
                        >
                            <Icon size={12} />
                            <span>{w.label}</span>
                            <span className="font-mono text-zinc-500">{w.sublabel}</span>
                            {count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    isActive ? "bg-indigo-500/30 text-indigo-300" : "bg-zinc-800 text-zinc-500"
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Auto-refresh 60s
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs shrink-0">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="flex-1 min-h-0">
                <DataTable
                    columns={colsByWindow[activeWindow]}
                    data={rows}
                    loading={loading}
                    emptyState={
                        <div className="text-center text-zinc-500 py-12">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <Clock size={20} className="text-zinc-700" />
                            </div>
                            <p className="text-sm font-medium text-zinc-400">No scan results yet</p>
                            <p className="text-xs text-zinc-600 mt-1">
                                Scans run at 9:08, 9:25, 9:35 and 10:00 AM IST on trading days.
                            </p>
                            {totalResults === 0 && !loading && (
                                <p className="text-[10px] text-zinc-700 mt-3 font-mono">
                                    Outside market hours — results auto-expire at midnight.
                                </p>
                            )}
                        </div>
                    }
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSED MOVERS VIEW  (original, unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────
function MissedMoversView() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [summary, setSummary]       = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [minScore, setMinScore]     = useState(0);
    const [search, setSearch]         = useState("");
    const [page, setPage]             = useState(1);
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

    const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
    const paginatedData = useMemo(() =>
        filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]);

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
            ),
        },
        {
            header: "Date / Day Change",
            render: (c) => (
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 font-mono">{c.date}</span>
                    <span className={`text-xs font-mono flex items-center gap-1 ${c.dayChangePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {c.dayChangePct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {c.dayChangePct >= 0 ? "+" : ""}{c.dayChangePct?.toFixed(2)}%
                    </span>
                </div>
            ),
        },
        {
            header: "Close",
            align: "right",
            render: (c) => <span className="text-sm font-mono text-zinc-200">{formatPrice(c.dayClose)}</span>,
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
            },
        },
        {
            header: "Signals",
            hiddenOnMobile: true,
            render: (c) => {
                const f = c.features || {};
                return (
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {f.volMult != null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${f.volMult >= 3 ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-300" : "border-zinc-800 bg-zinc-900/40 text-zinc-400"}`}>
                                {f.volMult?.toFixed(1)}×
                            </span>
                        )}
                        {f.closeStrength != null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${f.closeStrength >= 0.8 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-zinc-800 bg-zinc-900/40 text-zinc-400"}`}>
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
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${f.niftyRegime === "BULLISH" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : f.niftyRegime === "BEARISH" ? "border-red-500/30 bg-red-500/5 text-red-300" : "border-zinc-800 bg-zinc-900/40 text-zinc-400"}`}>
                                {f.niftyRegime}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: "Summary",
            hiddenOnMobile: true,
            render: (c) => {
                const s = c.search || {};
                if (!s.summary) return <span className="text-zinc-700 text-xs">—</span>;
                const truncated = s.summary.length > 80 ? s.summary.slice(0, 80) + "…" : s.summary;
                const isGemini = s.backend === "gemini";
                return (
                    <div className="flex flex-col gap-1.5 max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1 py-0.5 rounded uppercase font-bold tracking-wider ${isGemini ? "bg-indigo-500/10 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
                                {isGemini ? "Gemini" : "RSS+Groq"}
                            </span>
                            {s.catalystInferred && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold tracking-wider">
                                    Catalyst
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-zinc-400 leading-relaxed" title={s.summary}>{truncated}</span>
                    </div>
                );
            },
        },
        {
            header: "Outcome",
            align: "center",
            render: (c) => {
                const outcome = c.outcome;
                if (!outcome) return <span className="text-zinc-700 text-xs">—</span>;
                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xs font-bold ${outcome.didContinue ? "text-emerald-400" : "text-zinc-500"}`}>
                            {outcome.didContinue ? "✓ Continued" : "✗ Faded"}
                        </span>
                        {outcome.nextDayClosePct != null && (
                            <span className={`text-[10px] font-mono ${outcome.nextDayClosePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {outcome.nextDayClosePct >= 0 ? "+" : ""}{outcome.nextDayClosePct.toFixed(2)}%
                            </span>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-md p-5 mb-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                            <Activity size={16} className="text-indigo-400" />
                            Continuation Candidates
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                            Stocks that moved sharply today and may continue tomorrow.
                            Scored 0–10 from volume, close strength, fresh filings/news, and
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
                                        {band.scoreBand === "other" ? "<0 or >10" : `Score ≥ ${band.scoreBand}`}
                                    </div>
                                    <div className="text-lg font-bold text-zinc-200 mt-1">
                                        {band.hitRate != null ? `${(band.hitRate * 100).toFixed(0)}%` : "—"}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">
                                        {band.continued}/{band.total} continued · avg close {band.avgClosePct != null ? `${band.avgClosePct.toFixed(2)}%` : "—"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-4 shrink-0">
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
                        onPageChange: setPage,
                    }}
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP-LEVEL Movers PAGE — group toggle
// ─────────────────────────────────────────────────────────────────────────────
export function Movers() {
    const [activeTab, setActiveTab] = useState("missed"); // "missed" | "early"

    return (
        <div className="flex flex-col h-full w-full overflow-hidden gap-4">
            {/* Group toggle */}
            <div className="shrink-0 flex items-center gap-1 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800 w-fit">
                <button
                    id="movers-tab-missed"
                    onClick={() => setActiveTab("missed")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === "missed"
                            ? "bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    <BarChart2 size={15} />
                    Missed Movers
                </button>
                <button
                    id="movers-tab-early"
                    onClick={() => setActiveTab("early")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === "early"
                            ? "bg-indigo-600/25 text-indigo-200 shadow-md border border-indigo-500/40"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    <Zap size={15} />
                    Early Movers
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {activeTab === "missed" ? <MissedMoversView /> : <EarlyMoversView />}
            </div>
        </div>
    );
}
