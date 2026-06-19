'use client';

import { useState } from 'react';
import { api, SimulationResponse } from '../lib/api';
import { Zap, Play, Info, AlertTriangle, ShieldAlert } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'none', label: 'No event (baseline)', multiplier: 1.0 },
  { value: 'public_event', label: 'Public event / festival', multiplier: 1.35 },
  { value: 'procession', label: 'Procession / rally', multiplier: 1.28 },
  { value: 'vip_movement', label: 'VIP movement', multiplier: 1.20 },
  { value: 'protest', label: 'Protest / gathering', multiplier: 1.15 },
  { value: 'construction', label: 'Road construction', multiplier: 1.10 },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SimulatorForm() {
  const [eventType, setEventType] = useState('public_event');
  const [hour, setHour] = useState(21);
  const [day, setDay] = useState(6);
  const [topN, setTopN] = useState(10);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulation() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateEvent(eventType, hour, day, topN);
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'An error occurred during simulation');
    } finally {
      setLoading(false);
    }
  }

  const formatJunctionName = (name: string) => {
    return name.replace(/^BTP\d+\s*-\s*/, '');
  };

  const selectedEvent = EVENT_TYPES.find((e) => e.value === eventType);

  return (
    <div className="space-y-8">
      {/* Simulation Inputs Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Event Type */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-red-500 transition-colors"
            >
              {EVENT_TYPES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day of Week</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-red-500 transition-colors"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Hour */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hour: {String(hour).padStart(2, '0')}:00
            </label>
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="mt-2 cursor-pointer h-2 bg-slate-850 rounded-lg appearance-none accent-red-500"
            />
          </div>

          {/* Top Hotspots Count */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hotspots Count: {topN}</label>
            <input
              type="range"
              min={5}
              max={25}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="mt-2 cursor-pointer h-2 bg-slate-850 rounded-lg appearance-none accent-red-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>
              Applying <b>{selectedEvent?.multiplier}x</b> multiplier to baseline severity.
            </span>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Simulation Results Table */}
      {results && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Simulated Congestion Hotspots</h4>
              <p className="text-xs text-slate-400">
                Sorted by adjusted severity under {selectedEvent?.label} event conditions.
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>+{Math.round((results.multiplier - 1) * 100)}% Spike Projected</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-3">Rank</th>
                  <th className="py-4 px-3">Junction</th>
                  <th className="py-4 px-3 text-right">Adjusted Severity</th>
                  <th className="py-4 px-3 text-right">Officer Deployments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {results.results.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-4 px-3 font-extrabold text-slate-500">#{i + 1}</td>
                    <td className="py-4 px-3 font-semibold text-white">{formatJunctionName(r.junction_name)}</td>
                    <td className="py-4 px-3 text-right font-mono text-slate-300 font-bold">
                      {r.adjusted_severity.toLocaleString()}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold px-3 py-1 rounded-lg text-xs">
                        {r.recommended_officers} {r.recommended_officers === 1 ? 'Officer' : 'Officers'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
