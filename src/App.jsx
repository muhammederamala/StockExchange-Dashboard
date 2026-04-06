import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import io from "socket.io-client";
import { Cpu, Database, Activity, TrendingUp, FastForward, Menu, X } from "lucide-react";

import { Home } from "./pages/Home";
import { Stocks } from "./pages/Stocks";
import { Alerts } from "./pages/Alerts";
import { Simulation } from "./pages/Simulation";
import { StockDetail } from "./pages/StockDetail";
import { Login } from "./pages/Login";

const getSocketUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
};

function NavLinks({ closeSidebar }) {
  const location = useLocation();
  const links = [
    { to: "/", label: "Live Feed", icon: Activity },
    { to: "/stocks", label: "Database", icon: Database },
    { to: "/alerts", label: "Performance", icon: TrendingUp },
    { to: "/simulation", label: "Simulation", icon: FastForward },
  ];

  return (
    <nav className="flex flex-col gap-2 w-full">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.to || (link.to !== "/" && location.pathname.startsWith(link.to));
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
              ? 'bg-zinc-800 text-white shadow-lg shadow-indigo-500/10 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
          >
            <Icon size={18} className={isActive ? "text-indigo-400" : ""} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({ isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          {/* Logo / Title */}
          <div className="mb-10">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight flex items-center gap-2">
              Antigravity AI
            </h1>
            <p className="text-zinc-500 mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold">
              <Cpu size={12} />
              Command Center
            </p>
          </div>

          <NavLinks closeSidebar={() => setIsOpen(false)} />

          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-200">Terminal Admin</span>
                <span className="text-[10px] text-zinc-500">v2.4.0-prod</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Layout({ children, socket, isConnected, url, setUrl }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col md:ml-64 min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-900/50 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 md:flex-none">
            <h2 className="text-sm font-medium text-zinc-300 md:hidden ml-2">
              {location.pathname === '/' ? 'Live Telemetry' : 
               location.pathname.startsWith('/stocks') ? 'Database' : 
               location.pathname.startsWith('/alerts') ? 'Performance' : 
               location.pathname.startsWith('/simulation') ? 'Simulation' : 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Server Connection Info */}
            <div className="hidden sm:flex items-center gap-3 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 backdrop-blur-md px-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="bg-transparent border-none outline-none text-[10px] text-zinc-400 w-32 font-mono placeholder:text-zinc-800"
              />
              <div className="h-3 w-px bg-zinc-800" />
              <div className={`flex items-center gap-1.5`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
                <span className={`text-[10px] font-bold font-mono tracking-tighter ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isConnected ? 'STABLE' : 'DROPPED'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
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
  const [systemStatus, setSystemStatus] = useState(null);

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

    newSocket.on("status", (status) => {
      setSystemStatus(status);
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
          <Route path="/" element={<Home socket={socket} isConnected={isConnected} status={systemStatus} />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/stocks/:symbol" element={<StockDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
