import React, { useState } from 'react';
import { Layers, ArrowDownLeft, ArrowUpRight, Sliders, Calendar, Search } from 'lucide-react';
import { MovementLog, BaseUnit } from '../types';

interface MovementLogsProps {
  movements: MovementLog[];
}

export default function MovementLogs({ movements }: MovementLogsProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUST'>('ALL');
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const formatDelta = (amount: number, unit: any) => {
    const isPos = amount > 0;
    const absVal = Math.abs(amount);
    
    let text = `${absVal} ${unit}`;
    if (unit === 'gram' && absVal >= 1000) {
      text = `${(absVal / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
    } else if (unit === 'ml' && absVal >= 1000) {
      text = `${(absVal / 1000).toFixed(2).replace(/\.00$/, '')} L`;
    }

    return (
      <span className={`font-mono font-bold ${isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
        {isPos ? '+' : '-'} {text}
      </span>
    );
  };

  const formatBalance = (amount: number, unit: any) => {
    if (unit === 'gram' && amount >= 1000) {
      return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
    } else if (unit === 'ml' && amount >= 1000) {
      return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} L`;
    }
    return `${amount} ${unit}`;
  }

  // Filter logs
  const filtered = movements.filter(m => {
    const matchesSearch = m.ingredient_name?.toLowerCase().includes(query.toLowerCase()) ||
                          m.notes?.toLowerCase().includes(query.toLowerCase());
    
    let matchesDate = true;
    if (selectedDate && m.created_at) {
      const logDateOnly = m.created_at.split('T')[0].split(' ')[0];
      matchesDate = logDateOnly === selectedDate;
    }

    const matchesType = filterType === 'ALL' || m.type === filterType;

    return matchesSearch && matchesType && matchesDate;
  });

  return (
    <div id="logs-section" className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium text-slate-800">Operational Audit Trail</h1>
          <p className="text-slate-500 text-sm mt-0.5">Comprehensive historic ledgers of all chemical inflows, checkout outflows, and manual corrections.</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-1">
        {/* Chips */}
        <div className="flex gap-1.5 overflow-x-auto w-full no-scrollbar">
          {(['ALL', 'IN', 'OUT', 'ADJUST'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterType === type
                  ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200/50'
                  : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200/50 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL' && 'All Movements'}
              {type === 'IN' && 'IN (Restocks)'}
              {type === 'OUT' && 'OUT (Depletions)'}
              {type === 'ADJUST' && 'ADJUST (Opname)'}
            </button>
          ))}
        </div>

        {/* Date Calendar Picker & Search wrapper */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          {/* Calendar Picker Dropdown */}
          <div className="relative w-full sm:w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-bold"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                title="Saring Semua Tanggal"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-movements"
              type="text"
              placeholder="Search material or references..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200/80 rounded-full text-xs text-slate-700 focus:outline-none focus:border-blue-400 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Table / Logs Feed */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table id="tbl-logs-ledger" className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-medium bg-slate-50/50">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Ingredient</th>
                <th className="py-3.5 px-4 text-center">Movement Type</th>
                <th className="py-3.5 px-4 text-right">Delta Change</th>
                <th className="py-3.5 px-4 text-right">Ending Balance</th>
                <th className="py-3.5 px-6">Audit Reference / Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/65 text-sm">
              {filtered.length > 0 ? (
                filtered.map(log => {
                  return (
                    <tr key={log.id} className="text-slate-700 hover:bg-slate-50/50 transition whitespace-nowrap">
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {log.created_at}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">{log.ingredient_name}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type === 'IN' ? 'bg-emerald-50 text-emerald-700' :
                          log.type === 'OUT' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {log.type === 'IN' && (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                              IN
                            </>
                          )}
                          {log.type === 'OUT' && (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-rose-500" />
                              OUT
                            </>
                          )}
                          {log.type === 'ADJUST' && (
                            <>
                              <Sliders className="w-3 h-3 text-amber-500" />
                              OPNAME
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {formatDelta(log.amount, log.base_unit)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-xs font-semibold text-slate-500">
                        {formatBalance(log.balance, log.base_unit)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate" title={log.notes}>
                        {log.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No matching operational logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Native-Style Feed View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filtered.length > 0 ? (
            filtered.map(log => {
              return (
                <div key={log.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/20 transition">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10.5px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {log.created_at}
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      log.type === 'IN' ? 'bg-emerald-50 text-emerald-700' :
                      log.type === 'OUT' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {log.type === 'IN' && 'IN'}
                      {log.type === 'OUT' && 'OUT'}
                      {log.type === 'ADJUST' && 'OPNAME'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{log.ingredient_name}</h4>
                      {log.notes ? (
                        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2 leading-relaxed" title={log.notes}>
                          “{log.notes}”
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-300 mt-1 italic">No extra notes</p>
                      )}
                    </div>

                    <div className="text-right pl-4 flex-shrink-0">
                      <div className="text-sm font-semibold">{formatDelta(log.amount, log.base_unit)}</div>
                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5" title="Ending balance">
                        Bal: {formatBalance(log.balance, log.base_unit)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs text-slate-400">
              No matching operational logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
