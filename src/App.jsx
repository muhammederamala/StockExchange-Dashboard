import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import io from "socket.io-client";
import { Cpu, Database, Activity } from "lucide-react";

import { Home } from "./pages/Home";
import { Stocks } from "./pages/Stocks";
import { StockDetail } from "./pages/StockDetail";
import { Login } from "./pages/Login";

const getSocketUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
};

function Layout({ children, socket, isConnected, url, setUrl }) {
  const location = useLocation();

  return (
    <div className="min-h-screen md:h-screen bg-black text-white p-6 md:px-10 font-sans antialiased overflow-y-auto md:overflow-hidden flex flex-col selection:bg-indigo-500/30">
      {/* Background Gradients for Premium Look */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight flex items-center gap-3">
            Antigravity Exchange AI
          </h1>
          <p className="text-zinc-500 mt-1 flex items-center gap-2 text-sm">
            <Cpu size={14} />
            Command Center Architecture
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-md">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
            >
              <Activity size={16} /> Live Feed
            </Link>
            <Link
              to="/stocks"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/stocks')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
            >
              <Database size={16} /> Database
            </Link>
          </nav>

          {/* Server Connection Toggle */}
          <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-md px-3 hidden md:flex">
            <div className="text-[10px] text-zinc-500 px-2 font-bold uppercase tracking-wider">Telemetry</div>
            <div className="h-4 w-px bg-zinc-800" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="bg-transparent border-none outline-none text-xs text-zinc-300 w-36 font-mono placeholder:text-zinc-700"
            />
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? 'LIVE' : 'DOWN'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-full md:overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [url, setUrl] = useState(getSocketUrl());

  useEffect(() => {
    // Check Auth on Mount
    const expiry = localStorage.getItem("authExpiry");
    if (expiry && Date.now() < parseInt(expiry, 10)) {
      setIsAuthenticated(true);
    } else {
      // Clear if expired
      localStorage.removeItem("authExpiry");
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const newSocket = io(url, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to AI Telemetry server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from AI Telemetry server");
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [url, isAuthenticated]);

  if (!authChecked) return null; // Prevent flash

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Layout socket={socket} isConnected={isConnected} url={url} setUrl={setUrl}>
        <Routes>
          <Route path="/" element={<Home socket={socket} isConnected={isConnected} />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/stocks/:symbol" element={<StockDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
