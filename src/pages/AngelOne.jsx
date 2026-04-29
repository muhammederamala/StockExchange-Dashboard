import React, { useState, useEffect, useCallback } from "react";
import { Zap, RefreshCw, IndianRupee, TrendingUp, TrendingDown, Clock, AlertTriangle, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "../lib/api";

function StatusBadge({ connected }) {
    return connected ? (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            CONNECTED
        </span>
    ) : (
        <span className="flex items-center gap-1.5 text-red-400 text-xs font-mono font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            DISCONNECTED
        </span>
    );
}

function Card({ children, className = "" }) {
    return (
        <div className={`bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ icon: Icon, title }) {
    return (
        <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Icon size={16} className="text-indigo-400" />
            {title}
        </h2>
    );
}

function PasswordInput({ value, onChange, placeholder, disabled }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="new-password"
                className="w-full bg-black/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600 disabled:opacity-40"
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    );
}

const formatCurrency = (v) =>
    v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

const orderStatusColor = (s) => {
    if (!s) return "text-zinc-500";
    const u = s.toUpperCase();
    if (u === "COMPLETE") return "text-emerald-400";
    if (u === "REJECTED" || u === "CANCELLED") return "text-red-400";
    if (u === "OPEN" || u === "PENDING") return "text-amber-400";
    return "text-zinc-400";
};

export function AngelOne() {
    const [status, setStatus] = useState(null);
    const [orders, setOrders] = useState([]);
    const [positions, setPositions] = useState([]);
    const [trades, setTrades] = useState([]);

    // Credential form
    const [creds, setCreds] = useState({ clientId: "", apiKey: "", password: "" });
    const [savingCreds, setSavingCreds] = useState(false);
    const [credsError, setCredsError] = useState("");
    const [credsSaved, setCredsSaved] = useState(false);

    // Connect form
    const [totp, setTotp] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState("");

    // Budget form
    const [budgetInput, setBudgetInput] = useState("");
    const [maxOrderInput, setMaxOrderInput] = useState("");
    const [savingBudget, setSavingBudget] = useState(false);

    const [activeTab, setActiveTab] = useState("orders");
    const [loadingData, setLoadingData] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await apiFetch("/api/angelone/status");
            const data = await res.json();
            setStatus(data);
            setBudgetInput(String(data.budget || 0));
            setMaxOrderInput(String(data.maxOrderSize || 0));
        } catch {
            setStatus({ hasCredentials: false, connected: false });
        }
    }, []);

    const fetchTabData = useCallback(async (tab) => {
        setLoadingData(true);
        try {
            if (tab === "orders") {
                const res = await apiFetch("/api/angelone/orders");
                const data = await res.json();
                setOrders(data.data || []);
            } else if (tab === "positions") {
                const res = await apiFetch("/api/angelone/positions");
                const data = await res.json();
                setPositions(data.data || []);
            } else if (tab === "history") {
                const res = await apiFetch("/api/angelone/trades");
                const data = await res.json();
                setTrades(data.data || []);
            }
        } catch {} finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);
    useEffect(() => {
        if (status?.connected) fetchTabData(activeTab);
    }, [status?.connected, activeTab, fetchTabData]);

    const handleSaveCreds = async (e) => {
        e.preventDefault();
        if (!creds.clientId || !creds.apiKey || !creds.password) {
            setCredsError("Client ID, API Key, and Password are required");
            return;
        }
        setSavingCreds(true);
        setCredsError("");
        try {
            const res = await apiFetch("/api/angelone/credentials", {
                method: "PUT",
                body: JSON.stringify(creds),
            });
            const data = await res.json();
            if (!res.ok) { setCredsError(data.error || "Failed to save"); return; }
            setCredsSaved(true);
            setTimeout(() => setCredsSaved(false), 3000);
            await fetchStatus();
        } catch { setCredsError("Network error"); } finally { setSavingCreds(false); }
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        setConnecting(true);
        setConnectError("");
        try {
            const res = await apiFetch("/api/angelone/connect", {
                method: "POST",
                body: JSON.stringify({ totp }),
            });
            const data = await res.json();
            if (!res.ok) { setConnectError(data.error || "Connection failed"); return; }
            setTotp("");
            await fetchStatus();
            fetchTabData(activeTab);
        } catch { setConnectError("Network error"); } finally { setConnecting(false); }
    };

    const handleSaveBudget = async () => {
        setSavingBudget(true);
        try {
            await apiFetch("/api/angelone/budget", {
                method: "PUT",
                body: JSON.stringify({
                    totalBudget: parseFloat(budgetInput) || 0,
                    maxOrderSize: parseFloat(maxOrderInput) || 0,
                }),
            });
            await fetchStatus();
        } catch {} finally { setSavingBudget(false); }
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── Credentials Setup ─────────────────────────────── */}
            <Card>
                <SectionTitle icon={KeyRound} title="Angel One Credentials" />
                <p className="text-xs text-zinc-500 mb-4">
                    Credentials are encrypted with AES-256-GCM before being stored. They are never logged or exposed.
                </p>
                <form onSubmit={handleSaveCreds} autoComplete="off" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mb-1.5">Client ID</label>
                        <input
                            type="text"
                            value={creds.clientId}
                            onChange={e => setCreds(c => ({ ...c, clientId: e.target.value }))}
                            placeholder="A123456"
                            autoComplete="off"
                            className="w-full bg-black/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mb-1.5">API Key</label>
                        <PasswordInput
                            value={creds.apiKey}
                            onChange={e => setCreds(c => ({ ...c, apiKey: e.target.value }))}
                            placeholder="SmartAPI key"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mb-1.5">Trading Password</label>
                        <PasswordInput
                            value={creds.password}
                            onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
                            placeholder="Angel One login password"
                        />
                    </div>
                    {credsError && (
                        <div className="sm:col-span-2 text-red-400 text-xs font-mono flex items-center gap-1.5">
                            <AlertTriangle size={12} /> {credsError}
                        </div>
                    )}
                    <div className="sm:col-span-2 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={savingCreds}
                            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            {savingCreds ? "Saving..." : "Save Credentials"}
                        </button>
                        {credsSaved && (
                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                                <CheckCircle2 size={13} /> Saved
                            </span>
                        )}
                        {status?.hasCredentials && (
                            <span className="text-xs text-zinc-500">
                                Credentials already configured — saving will overwrite.
                            </span>
                        )}
                    </div>
                </form>
            </Card>

            {/* ── Connection Card ───────────────────────────────── */}
            <Card>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Zap size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-zinc-100">Session</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {status?.connectedAt
                                    ? `Last connected ${new Date(status.connectedAt).toLocaleString("en-IN")}`
                                    : "Not yet authenticated"}
                            </p>
                        </div>
                    </div>
                    {status && <StatusBadge connected={status.connected} />}
                </div>

                {!status?.hasCredentials ? (
                    <p className="text-zinc-600 text-xs font-mono">Save your Angel One credentials above to enable connection.</p>
                ) : (
                    <form onSubmit={handleConnect} className="flex flex-col gap-3">
                        {!status?.connected && (
                            <p className="text-xs text-zinc-500">Enter the 6-digit code from your authenticator app.</p>
                        )}
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={totp}
                                onChange={e => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="6-digit TOTP code"
                                className="flex-1 bg-black/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600 font-mono tracking-widest"
                            />
                            <button
                                type="submit"
                                disabled={connecting || totp.length !== 6}
                                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                                {connecting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                {status?.connected ? "Re-authenticate" : connecting ? "Connecting..." : "Connect"}
                            </button>
                        </div>
                        {connectError && (
                            <p className="text-red-400 text-xs font-mono flex items-center gap-1.5">
                                <AlertTriangle size={12} /> {connectError}
                            </p>
                        )}
                    </form>
                )}
            </Card>

            {/* ── Budget Card ───────────────────────────────────── */}
            <Card>
                <SectionTitle icon={IndianRupee} title="Trading Budget" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mb-1.5">Total Budget (₹)</label>
                        <input
                            type="number"
                            value={budgetInput}
                            onChange={e => setBudgetInput(e.target.value)}
                            placeholder="e.g. 50000"
                            className="w-full bg-black/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mb-1.5">Max Per Order (₹) — 0 = no cap</label>
                        <input
                            type="number"
                            value={maxOrderInput}
                            onChange={e => setMaxOrderInput(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full bg-black/50 border border-zinc-700/50 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSaveBudget}
                    disabled={savingBudget}
                    className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    {savingBudget ? "Saving..." : "Save Budget"}
                </button>
            </Card>

            {/* ── Orders / Positions / History Tabs ────────────── */}
            {status?.connected && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
                            {["orders", "positions", "history"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => fetchTabData(activeTab)}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Orders */}
                    {activeTab === "orders" && (
                        orders.length === 0
                            ? <p className="text-zinc-600 text-sm text-center py-8 font-mono">No orders today</p>
                            : <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-zinc-500 font-mono uppercase tracking-widest border-b border-zinc-800">
                                            {["Symbol", "Side", "Qty", "Price", "Status", "Time"].map(h => (
                                                <th key={h} className={`pb-3 pr-4 ${h === "Qty" || h === "Price" ? "text-right" : "text-left"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/40">
                                        {orders.map((o, i) => (
                                            <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-zinc-100">{o.tradingsymbol || "—"}</td>
                                                <td className="py-3 pr-4">
                                                    <span className={`flex items-center gap-1 font-bold ${o.transactiontype === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                                                        {o.transactiontype === "BUY" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {o.transactiontype}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-right text-zinc-300">{o.quantity}</td>
                                                <td className="py-3 pr-4 text-right text-zinc-300">{o.price ? formatCurrency(o.price) : "MKT"}</td>
                                                <td className={`py-3 pr-4 font-mono font-bold ${orderStatusColor(o.orderstatus)}`}>{o.orderstatus}</td>
                                                <td className="py-3 text-zinc-500 flex items-center gap-1">
                                                    <Clock size={10} />{o.updatetime || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                    )}

                    {/* Positions */}
                    {activeTab === "positions" && (
                        positions.length === 0
                            ? <p className="text-zinc-600 text-sm text-center py-8 font-mono">No open positions</p>
                            : <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-zinc-500 font-mono uppercase tracking-widest border-b border-zinc-800">
                                            {["Symbol", "Qty", "Avg Price", "LTP", "P&L"].map(h => (
                                                <th key={h} className={`pb-3 pr-4 ${h !== "Symbol" ? "text-right" : "text-left"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/40">
                                        {positions.map((p, i) => {
                                            const pnl = parseFloat(p.unrealised || p.pnl || 0);
                                            return (
                                                <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                                                    <td className="py-3 pr-4 font-semibold text-zinc-100">{p.tradingsymbol || "—"}</td>
                                                    <td className="py-3 pr-4 text-right text-zinc-300">{p.netqty}</td>
                                                    <td className="py-3 pr-4 text-right text-zinc-300">{formatCurrency(p.averageprice)}</td>
                                                    <td className="py-3 pr-4 text-right text-zinc-300">{formatCurrency(p.ltp)}</td>
                                                    <td className={`py-3 text-right font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                    )}

                    {/* History (our DB) */}
                    {activeTab === "history" && (
                        trades.length === 0
                            ? <p className="text-zinc-600 text-sm text-center py-8 font-mono">No trade history</p>
                            : <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-zinc-500 font-mono uppercase tracking-widest border-b border-zinc-800">
                                            {["Symbol", "Side", "Qty", "Price", "Status", "Date"].map(h => (
                                                <th key={h} className={`pb-3 pr-4 ${h === "Qty" || h === "Price" ? "text-right" : "text-left"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/40">
                                        {trades.map((t, i) => (
                                            <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-zinc-100">{t.symbol}</td>
                                                <td className="py-3 pr-4">
                                                    <span className={`flex items-center gap-1 font-bold ${t.transactionType === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                                                        {t.transactionType === "BUY" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {t.transactionType}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-right text-zinc-300">{t.quantity}</td>
                                                <td className="py-3 pr-4 text-right text-zinc-300">{t.price ? formatCurrency(t.price) : "MKT"}</td>
                                                <td className={`py-3 pr-4 font-mono font-bold ${orderStatusColor(t.status)}`}>{t.status}</td>
                                                <td className="py-3 text-zinc-500">{new Date(t.placedAt).toLocaleString("en-IN")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                    )}
                </Card>
            )}
        </div>
    );
}
