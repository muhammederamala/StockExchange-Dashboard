import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Calendar, TrendingUp, TrendingDown, Clock, CheckCircle2, BarChart3, Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { HighVolumeToggle } from "../components/HighVolumeToggle";
import { DataTable } from "../components/DataTable";
import { apiFetch } from "../lib/api";

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getWeekDays(mondayStr) {
    const monday = new Date(mondayStr);
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

function thisWeekMonday() {
    const d = new Date();
    const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
}

function shiftWeek(mondayStr, delta) {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + delta * 7);
    return d.toISOString().split('T')[0];
}

export function Simulation() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    const [weekMonday, setWeekMonday] = useState(thisWeekMonday);
    const weekDays = getWeekDays(weekMonday);

    // Default selected day: today if it's in this week, else Friday
    const [selectedDate, setSelectedDate] = useState(() => {
        const days = getWeekDays(thisWeekMonday());
        return days.includes(today) ? today : days[4];
    });

    const [highVolumeOnly, setHighVolumeOnly] = useState(true);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const fetch = async () => {
                setLoading(true);
                try {
                    const params = new URLSearchParams({
                        date: selectedDate,
                        highVolume: highVolumeOnly.toString(),
                        page: page.toString(),
                        limit: "20",
                        q: search,
                    });
                    const res = await apiFetch(`/api/performance/simulation?${params}`);
                    const data = await res.json();
                    setResults(data.data || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                    setTotal(data.pagination?.total || 0);
                } catch (err) {
                    console.error("Simulation fetch Error:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetch();
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedDate, highVolumeOnly, page, search]);

    useEffect(() => {
        setPage(1);
    }, [search, selectedDate, highVolumeOnly]);

    const handleWeekShift = (delta) => {
        const newMonday = shiftWeek(weekMonday, delta);
        setWeekMonday(newMonday);
        // Select the same weekday index in the new week (capped to today)
        const newDays = getWeekDays(newMonday);
        const oldIdx = weekDays.indexOf(selectedDate);
        const targetIdx = oldIdx >= 0 ? oldIdx : 4;
        const candidate = newDays[targetIdx];
        setSelectedDate(candidate <= today ? candidate : newDays.findLast(d => d <= today) || newDays[0]);
    };

    const formatVolume = (vol) => {
        if (!vol || vol === 0) return "—";
        if (vol >= 10000000) return (vol / 10000000).toFixed(2) + " Cr";
        if (vol >= 100000) return (vol / 100000).toFixed(2) + " L";
        return vol.toString();
    };

    const formatPrice = (price) => {
        if (!price) return "—";
        return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const formatDayNum = (dateStr) => new Date(dateStr).getDate();

    const columns = [
        {
            header: "Symbol & Company",
            key: "symbol",
            render: (item) => (
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-indigo-400">
                        <Activity size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 font-bold">{item.symbol}</span>
                        <span className="text-xs text-zinc-500 truncate max-w-[200px]">{item.companyName}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Score Snapshot",
            align: "center",
            render: (item) => (
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={12} className="text-indigo-500" />
                        <span className="text-sm font-mono text-zinc-200">{(item.cumulativeScore || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600">Cumul. Score</span>
                </div>
            )
        },
        {
            header: "Traded Value",
            align: "center",
            render: (item) => (
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <Volume2 size={12} className="text-indigo-500" />
                        <span className={`text-xs font-mono font-bold ${((item.volume || 0) * (item.entryPrice || 0)) >= 50000000 ? 'text-indigo-400' : 'text-zinc-300'}`}>
                            ₹{formatVolume((item.volume || 0) * (item.entryPrice || 0))}
                        </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Activity</span>
                </div>
            )
        },
        {
            header: "Alert Entry",
            render: (item) => item.alertTime ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock size={12} className="text-zinc-500" />
                        {item.entryTime?.t || "at-alert"}
                        <span className="text-zinc-600 ml-1">({item.alertTime.split('T')[1]?.substring(0, 5)})</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                        {formatPrice(item.entryPrice)}
                    </div>
                </div>
            ) : (
                <span className="text-[11px] text-zinc-700 italic">No formal alert fired</span>
            )
        },
        {
            header: "Max Potential",
            align: "right",
            render: (item) => (
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 text-sm font-bold ${(item.maxGain || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(item.maxGain || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        +{(item.maxGain || 0).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono tracking-tighter">
                        Drop: {(item.maxDrop || 0).toFixed(1)}%
                    </div>
                </div>
            )
        },
        {
            header: "Optimal Exit",
            align: "right",
            render: (item) => item.optimalExit ? (
                <div className="flex flex-col items-end border-l border-zinc-800/50 pl-4 py-1">
                    <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                        <CheckCircle2 size={12} className="text-indigo-500" />
                        {formatDate(item.optimalExit.date)}
                    </div>
                    <div className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock size={10} /> {item.optimalExit.t}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-400 mt-2 font-mono bg-zinc-800/50 px-2 py-0.5 rounded">
                        {formatPrice(item.optimalExit.price)}
                    </div>
                </div>
            ) : (
                <span className="text-zinc-700 font-mono text-[10px] italic">IN-PROGRESS</span>
            )
        }
    ];

    // Week label e.g. "12 May – 16 May"
    const weekLabel = `${formatDate(weekDays[0])} – ${formatDate(weekDays[4])}`;
    const isCurrentWeek = weekMonday === thisWeekMonday();

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between mb-4 shrink-0 gap-3 min-h-[44px]">
                <div className="flex items-center gap-3">
                    <HighVolumeToggle
                        isActive={highVolumeOnly}
                        onClick={() => setHighVolumeOnly(!highVolumeOnly)}
                    />
                    <div className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
                        {total} STOCKS TRACKED • REALISM DELAY: 20M
                    </div>
                </div>

                {/* Week navigator + day pills */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Week prev/next */}
                    <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-2 py-1.5 backdrop-blur-md">
                        <button
                            onClick={() => handleWeekShift(-1)}
                            className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className="flex items-center gap-1.5 px-1">
                            <Calendar size={12} className="text-zinc-600" />
                            <span className="text-[11px] font-mono text-zinc-400">{weekLabel}</span>
                            {isCurrentWeek && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">THIS WEEK</span>
                            )}
                        </div>
                        <button
                            onClick={() => handleWeekShift(1)}
                            disabled={isCurrentWeek}
                            className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Day pills */}
                    <div className="flex items-center gap-1">
                        {weekDays.map((day, i) => {
                            const isFuture = day > today;
                            const isSelected = day === selectedDate;
                            return (
                                <button
                                    key={day}
                                    disabled={isFuture}
                                    onClick={() => setSelectedDate(day)}
                                    className={`flex flex-col items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        isSelected
                                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10'
                                            : isFuture
                                                ? 'bg-transparent border-transparent text-zinc-700 cursor-not-allowed'
                                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
                                    }`}
                                >
                                    <span>{DAY_LABELS[i]}</span>
                                    <span className={`font-mono text-[9px] mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-zinc-600'}`}>
                                        {formatDayNum(day)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Table Body */}
            <div className="flex-1 min-h-0 flex flex-col">
                <DataTable
                    columns={columns}
                    data={results}
                    loading={loading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onRowClick={(item) => navigate(`/stocks/${item.symbol}`)}
                    searchPlaceholder="Search ticker or name..."
                    pagination={{
                        page,
                        totalPages,
                        total,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    );
}
