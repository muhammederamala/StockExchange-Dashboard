import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceDot, ReferenceLine, LabelList, Scatter, ComposedChart, Line
} from 'recharts';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { Calendar, Activity, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export function StockPriceChart({ symbol }) {
  // Default to current week (Monday to Friday)
  const today = new Date();
  const monday = format(addDays(startOfWeek(today, { weekStartsOn: 1 }), 0), 'yyyy-MM-dd');
  const friday = format(addDays(startOfWeek(today, { weekStartsOn: 1 }), 4), 'yyyy-MM-dd');

  const [dateFrom, setDateFrom] = useState(monday);
  const [dateTo, setDateTo] = useState(friday);
  const [data, setData] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo
      });
      const res = await fetch(`${baseUrl}/api/stocks/${symbol}/chart?${params}`);
      const result = await res.json();
      
      // Combine candles and events for the chart
      const chartData = (result.candles || []).map(candle => {
        const candleDate = parseISO(candle.date);
        
        // Find events that happen exactly within this 5m candle's window
        const candleTime = candleDate.getTime();
        const candleEnd = candleTime + (5 * 60 * 1000); // +5 mins
        
        const validEvents = (result.events || []).filter(e => {
            const eTime = new Date(e.time).getTime();
            return eTime >= candleTime && eTime < candleEnd;
        });

        return {
          ...candle,
          formattedDate: format(candleDate, 'dd MMM HH:mm'),
          price: candle.close,
          buys: validEvents.filter(e => e.type === 'BUY').map(e => ({ price: e.price, shares: e.shares || 0 })),
          sells: validEvents.filter(e => e.type === 'SELL').map(e => ({ price: e.price, shares: e.shares || 0 })),
        };
      });
      
      setData(chartData);
      setEvents(result.events || []);
    } catch (err) {
      console.error("Failed to load chart data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, dateFrom, dateTo]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">{format(parseISO(item.date), 'EEEE, MMM dd HH:mm')}</p>
          <p className="text-sm font-bold text-zinc-100 mb-1">Price: ₹{item.price.toLocaleString()}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 border-t border-zinc-800 pt-2">
            <span className="text-[10px] text-zinc-500 uppercase">Open</span>
            <span className="text-[10px] text-zinc-300 text-right">₹{item.open.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500 uppercase">High</span>
            <span className="text-[10px] text-zinc-300 text-right">₹{item.high.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500 uppercase">Low</span>
            <span className="text-[10px] text-zinc-300 text-right">₹{item.low.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500 uppercase">Vol</span>
            <span className="text-[10px] text-zinc-300 text-right">{(item.volume || 0).toLocaleString()}</span>
          </div>
          {item.buys.length > 0 && (
            <div className="mt-2 text-emerald-400 text-[10px] font-bold border-t border-zinc-800 pt-2 flex flex-col gap-1">
              {item.buys.map((b, i) => (
                <div key={i} className="flex items-center gap-1">
                  <TrendingUp size={10} /> BOUGHT {b.shares} @ ₹{b.price}
                </div>
              ))}
            </div>
          )}
          {item.sells.length > 0 && (
            <div className="mt-1 text-rose-400 text-[10px] font-bold flex flex-col gap-1">
              {item.sells.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <TrendingDown size={10} /> SOLD {s.shares} @ ₹{s.price}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-md w-full shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Price Trajectory & Signals</h3>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tighter">HISTORICAL EXECUTION OVERLAY</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 border border-zinc-800 p-1.5 rounded-xl px-3">
            <Calendar size={14} className="text-zinc-600" />
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-zinc-300 font-mono cursor-pointer"
            />
            <span className="text-zinc-700 mx-1">—</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-zinc-300 font-mono cursor-pointer"
            />
          </div>
          <button 
            onClick={fetchChartData}
            disabled={loading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="h-[400px] w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10 rounded-xl">
             <div className="flex flex-col items-center gap-2">
                <RefreshCw size={24} className="text-indigo-500 animate-spin" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[.2em]">Recalculating...</span>
             </div>
          </div>
        )}
        
        {data.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
            <Calendar size={32} className="mb-2 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-mono">No candle data for this range</p>
            <p className="text-[10px] opacity-60 mt-1">Try expanding the date filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 500 }}
                interval="preserveStartEnd"
                dy={10}
              />
              <YAxis 
                hide 
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                animationDuration={1500}
              />
              
              {/* Buy Points */}
              {data.map((entry, index) => 
                entry.buys.map((buy, bIdx) => (
                  <React.Fragment key={`buy-group-${index}-${bIdx}`}>
                    <ReferenceLine
                      x={entry.formattedDate}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      strokeWidth={1}
                    />
                    <ReferenceDot
                      x={entry.formattedDate}
                      y={buy.price}
                      r={6}
                      fill="#10b981"
                      stroke="#064e3b"
                      strokeWidth={2}
                      isFront={true}
                    />
                  </React.Fragment>
                ))
              )}

              {/* Sell Points */}
              {data.map((entry, index) => 
                entry.sells.map((sell, sIdx) => (
                  <React.Fragment key={`sell-group-${index}-${sIdx}`}>
                    <ReferenceLine
                      x={entry.formattedDate}
                      stroke="#f43f5e"
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      strokeWidth={1}
                    />
                    <ReferenceDot
                      x={entry.formattedDate}
                      y={sell.price}
                      r={6}
                      fill="#f43f5e"
                      stroke="#4c0519"
                      strokeWidth={2}
                      isFront={true}
                    />
                  </React.Fragment>
                ))
              )}

              {/* Labels for Buy/Sell on Chart */}
              <Scatter dataKey="price" fill="transparent">
                <LabelList 
                  dataKey="buys" 
                  content={({ x, y, value }) => value && value.length > 0 ? (
                    <g transform={`translate(${x},${y - 15})`}>
                      <rect x="-20" y="-10" width="40" height="16" rx="4" fill="#064e3b" opacity="0.8" />
                      <text x="0" y="2" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">BUY</text>
                    </g>
                  ) : null}
                />
                <LabelList 
                  dataKey="sells" 
                  content={({ x, y, value }) => value && value.length > 0 ? (
                    <g transform={`translate(${x},${y + 15})`}>
                      <rect x="-20" y="-6" width="40" height="16" rx="4" fill="#4c0519" opacity="0.8" />
                      <text x="0" y="6" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">SELL</text>
                    </g>
                  ) : null}
                />
              </Scatter>

            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 border-t border-zinc-800/50 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Price Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Buy Event</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sell Event</span>
        </div>
      </div>
    </div>
  );
}
