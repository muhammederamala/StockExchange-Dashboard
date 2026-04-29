import React, { useState } from "react";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "INVALID CREDENTIALS");
                setPassword("");
                return;
            }
            localStorage.setItem("token", data.token);
            onLogin();
        } catch {
            setError("CONNECTION FAILED — IS THE SERVER RUNNING?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans antialiased selection:bg-indigo-500/30">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-sm p-8 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800/60 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-zinc-800/50 border border-zinc-700/50 rounded-full flex items-center justify-center text-indigo-400">
                        <Shield size={32} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight">
                    System Restricted
                </h1>
                <p className="text-zinc-500 text-sm text-center mb-8 font-mono">
                    PLEASE AUTHENTICATE TO CONTINUE
                </p>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-700/50 focus:ring-indigo-500/50 text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 transition-all placeholder:text-zinc-600 backdrop-blur-sm"
                            autoFocus
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black/50 border ${error ? "border-red-500/50 focus:ring-red-500/50" : "border-zinc-700/50 focus:ring-indigo-500/50"} text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 transition-all placeholder:text-zinc-600 backdrop-blur-sm`}
                            disabled={loading}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400/90 text-xs font-mono font-bold text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 py-3 rounded-lg transition-colors group"
                    >
                        <span>{loading ? "AUTHENTICATING..." : "SIGN IN"}</span>
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <div className="mt-8 text-center text-[10px] text-zinc-600 font-mono tracking-widest">
                    SESSION VALID FOR 7 DAYS
                </div>
            </div>
        </div>
    );
}
