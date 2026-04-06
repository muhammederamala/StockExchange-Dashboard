import React from 'react';
import { Search, Loader2, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A highly reusable, premium data table component for the dashboard.
 * Includes integrated search, loading states, and pagination controls.
 */
export function DataTable({
    columns = [],
    data = [],
    loading = false,
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    pagination = null, // { page, totalPages, onPageChange }
    emptyState = null,
    onRowClick = null,
}) {
    return (
        <div className="flex flex-col h-full w-full min-h-0 bg-zinc-900/10 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Table Internal Header (Search Bar) */}
            {(onSearchChange || searchValue !== undefined) && (
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/30 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-200 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-600 font-medium"
                        />
                    </div>
                </div>
            )}

            {/* Main Table Body */}
            <div className="flex-1 overflow-auto custom-scrollbar relative min-h-0">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/20 backdrop-blur-[1px] z-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="text-zinc-600 animate-spin" />
                            <span className="text-xs font-mono text-zinc-500 tracking-tighter uppercase">Synchronizing Cache...</span>
                        </div>
                    </div>
                ) : null}

                {data.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-zinc-500 gap-4 opacity-60">
                        {emptyState || (
                            <>
                                <BarChart3 size={48} className="text-zinc-800" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-zinc-400">No signals detected</p>
                                    <p className="text-xs text-zinc-600 mt-1">Refine your search or tracking filters</p>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md border-b border-zinc-800/50">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th 
                                        key={idx} 
                                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.hiddenOnMobile ? 'hidden sm:table-cell' : ''}`}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/20">
                            {data.map((row, rowIdx) => (
                                <tr 
                                    key={rowIdx} 
                                    onClick={() => onRowClick?.(row)}
                                    className={`group transition-all duration-200 hover:bg-indigo-500/[0.03] ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td 
                                            key={colIdx} 
                                            className={`px-6 py-4 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.hiddenOnMobile ? 'hidden sm:table-cell' : ''}`}
                                        >
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Table Footer (Pagination) */}
            {pagination && (
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex items-center justify-between gap-4 font-mono">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        PAGE {pagination.page} OF {pagination.totalPages || 1} • {pagination.total || 0} RECORDS
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page <= 1}
                            className="p-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-zinc-200 transition-all shadow-lg"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages || 1, pagination.page + 1))}
                            disabled={pagination.page >= (pagination.totalPages || 1)}
                            className="p-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-zinc-200 transition-all shadow-lg"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
