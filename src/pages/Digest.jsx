import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

/**
 * Digest — one screen answering "what is the market doing, and what is the system seeing".
 *
 * First cut (2026-08-20), deliberately minimal: it renders exactly what GET /api/digest
 * returns and computes nothing client-side, so there is no second opinion that can drift
 * from what the scanner actually acted on. Enhance once we know which parts get used.
 */

const REGIME_TONE = {
    CLEAN: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
    BULL_TREND: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
    CHOP: "text-amber-300 border-amber-500/40 bg-amber-500/10",
    WEAK: "text-amber-300 border-amber-500/40 bg-amber-500/10",
    BEAR: "text-rose-300 border-rose-500/40 bg-rose-500/10",
    BEARISH: "text-rose-300 border-rose-500/40 bg-rose-500/10",
};
const tone = (r) => REGIME_TONE[r] || "text-slate-300 border-slate-600 bg-slate-700/30";

const num = (v, d = 2) =>
    typeof v === "number" && isFinite(v) ? v.toFixed(d) : "—";

const timeAgo = (ts) => {
    if (!ts) return "—";
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// Event tags come from the API's keyword pass. HIGH set is styled loud on purpose —
// the whole point of this page is that a merger or an NCLT filing should catch the eye
// before a routine results note does.
const TAG_STYLE = {
    MERGER: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    BANKRUPTCY: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    FRAUD: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    ORDER_WIN: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    RESULTS: "bg-slate-600/40 text-slate-300 border-slate-500/40",
    RATING: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    FUNDRAISE: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    MANAGEMENT: "bg-slate-600/40 text-slate-300 border-slate-500/40",
};

function Tag({ tag }) {
    if (!tag) return null;
    return (
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${TAG_STYLE[tag] || TAG_STYLE.RESULTS}`}>
            {tag.replace("_", " ")}
        </span>
    );
}

/** Source initials tile — shown when the feed carried no thumbnail, so layout never jumps. */
function Thumb({ src, source, alt }) {
    const [failed, setFailed] = useState(false);
    const initials = (source || "?")
        .split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    if (!src || failed) {
        return (
            <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-sm font-bold text-slate-500">
                {initials}
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="h-20 w-28 shrink-0 rounded-lg border border-slate-700 object-cover"
        />
    );
}

function Card({ title, children, right }) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
                {right}
            </div>
            {children}
        </div>
    );
}

export default function Digest() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await apiFetch("/api/digest");
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            setData(json);
            setErr(null);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const t = setInterval(load, 60000); // refresh each minute
        return () => clearInterval(t);
    }, []);

    if (loading) return <div className="p-6 text-slate-400">Loading digest…</div>;
    if (err) {
        return (
            <div className="m-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300">
                Digest unavailable: {err}
            </div>
        );
    }

    const r = data.regime || {};
    const aboveEma =
        typeof r.niftyClose === "number" && typeof r.niftyEma === "number"
            ? r.niftyClose >= r.niftyEma
            : null;

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-baseline justify-between">
                <h1 className="text-xl font-bold text-slate-100">Market Digest</h1>
                <span className="text-xs text-slate-500">refreshed {timeAgo(new Date())}</span>
            </div>

            {/* Regime */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card title="Market Gate">
                    <div className={`inline-block rounded-lg border px-3 py-1 text-lg font-semibold ${tone(r.gate)}`}>
                        {r.gate || "—"}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                        evaluated {timeAgo(r.evaluatedAt)}
                    </p>
                </Card>

                <Card title="Strategic Regime">
                    <div className={`inline-block rounded-lg border px-3 py-1 text-lg font-semibold ${tone(r.strategic)}`}>
                        {r.strategic || "—"}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                        drives entry route &amp; size multiplier
                        {typeof r.sizeMultiplier === "number" ? ` (×${num(r.sizeMultiplier, 2)})` : ""}
                    </p>
                </Card>

                <Card title="NIFTY">
                    <div className="text-lg font-semibold text-slate-100">{num(r.niftyClose, 1)}</div>
                    <p className="mt-2 text-xs text-slate-500">
                        EMA {num(r.niftyEma, 1)} · ADX {num(r.niftyAdx, 1)}
                        {aboveEma !== null && (
                            <span className={aboveEma ? " text-emerald-400" : " text-rose-400"}>
                                {aboveEma ? " · above EMA" : " · below EMA"}
                            </span>
                        )}
                    </p>
                </Card>
            </div>

            {/* Pipeline counters */}
            <div className="grid gap-4 md:grid-cols-3">
                {[
                    ["Pending entries", data.counts?.pending, "queued, awaiting fill"],
                    ["Open swing positions", data.counts?.activeSwing, "of 3 slots"],
                    ["Filings (24h)", data.counts?.filings24h, "ingested & scored"],
                ].map(([label, value, hint]) => (
                    <Card key={label} title={label}>
                        <div className="text-2xl font-bold text-slate-100">{value ?? "—"}</div>
                        <p className="mt-1 text-xs text-slate-500">{hint}</p>
                    </Card>
                ))}
            </div>

            {/* News — the five-minute read. High-impact events are sorted to the top by the API. */}
            <Card
                title="Market News"
                right={
                    <div className="flex flex-wrap items-center gap-1">
                        {Object.entries(data.newsTagCounts || {})
                            .sort((a, b) => b[1] - a[1])
                            .map(([t, n]) => (
                                <span key={t} className="flex items-center gap-1">
                                    <Tag tag={t} />
                                    <span className="text-[10px] text-slate-500">{n}</span>
                                </span>
                            ))}
                    </div>
                }
            >
                {!data.news?.length ? (
                    <p className="text-sm text-slate-500">No news in the last 7 days.</p>
                ) : (
                    <ul className="space-y-3">
                        {data.news.slice(0, 20).map((n, i) => (
                            <li
                                key={i}
                                className={`flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-700/30 ${n.highImpact ? "bg-slate-700/20 ring-1 ring-inset ring-slate-600/50" : ""
                                    }`}
                            >
                                <Thumb src={n.imageUrl} source={n.source} alt={n.headline} />
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <Tag tag={n.tag} />
                                        {n.symbol && (
                                            <a href={`/stocks/${n.symbol}`} className="text-xs font-semibold text-sky-300 hover:underline">
                                                {n.symbol}
                                            </a>
                                        )}
                                        {n.companyName && (
                                            <span className="truncate text-xs text-slate-500" title={n.companyName}>
                                                {n.companyName}
                                            </span>
                                        )}
                                        <span className="ml-auto shrink-0 text-[11px] text-slate-500">
                                            {n.source} · {timeAgo(n.timestamp)}
                                        </span>
                                    </div>
                                    <a
                                        href={n.url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="block text-sm font-medium leading-snug text-slate-200 hover:text-sky-300"
                                    >
                                        {n.headline}
                                    </a>
                                    {typeof n.sentiment === "number" && (
                                        <span
                                            className={`mt-1 inline-block text-[11px] ${n.sentiment >= 0.7
                                                ? "text-emerald-400"
                                                : n.sentiment <= 0.3
                                                    ? "text-rose-400"
                                                    : "text-slate-500"
                                                }`}
                                        >
                                            sentiment {num(n.sentiment, 2)}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Trending topics */}
                <Card title="Trending Topics" right={<span className="text-xs text-slate-500">last 7 days</span>}>
                    {!data.topics?.length ? (
                        <p className="text-sm text-slate-500">No filings in the window.</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.topics.map((t) => {
                                const max = data.topics[0].count || 1;
                                return (
                                    <li key={t.category} className="flex items-center gap-3">
                                        <span className="w-44 shrink-0 truncate text-sm text-slate-300" title={t.category}>
                                            {t.category}
                                        </span>
                                        <span className="h-2 flex-1 overflow-hidden rounded bg-slate-700">
                                            <span
                                                className="block h-full rounded bg-sky-500/70"
                                                style={{ width: `${Math.max(4, (t.count / max) * 100)}%` }}
                                            />
                                        </span>
                                        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-400">
                                            {t.count}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                {/* Top cumulative scores */}
                <Card title="Highest Cumulative Scores">
                    {!data.topScores?.length ? (
                        <p className="text-sm text-slate-500">No scores yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-700/60">
                            {data.topScores.map((s, i) => (
                                <li key={`${s.symbol}-${i}`} className="flex items-center justify-between py-1.5">
                                    <a href={`/stocks/${s.symbol}`} className="text-sm text-sky-300 hover:underline">
                                        {s.symbol}
                                    </a>
                                    <span className="text-sm font-semibold tabular-nums text-slate-200">
                                        {num(s.score, 2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {/* Headlines */}
            <Card title="Latest Filings" right={<span className="text-xs text-slate-500">last 24h</span>}>
                {!data.headlines?.length ? (
                    <p className="text-sm text-slate-500">Nothing in the last 24 hours.</p>
                ) : (
                    <ul className="divide-y divide-slate-700/60">
                        {data.headlines.map((h, i) => (
                            <li key={i} className="py-2">
                                <div className="flex items-baseline gap-2">
                                    <a href={`/stocks/${h.symbol}`} className="text-sm font-medium text-sky-300 hover:underline">
                                        {h.symbol}
                                    </a>
                                    <span className="text-xs text-slate-500">{h.category}</span>
                                    {typeof h.sentiment === "number" && (
                                        <span
                                            className={`text-xs ${h.sentiment >= 0.7
                                                ? "text-emerald-400"
                                                : h.sentiment <= 0.3
                                                    ? "text-rose-400"
                                                    : "text-slate-500"
                                                }`}
                                        >
                                            {num(h.sentiment, 2)}
                                        </span>
                                    )}
                                    <span className="ml-auto shrink-0 text-xs text-slate-500">{timeAgo(h.timestamp)}</span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-sm text-slate-400">{h.headline}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
