'use client';

import { useState, useEffect, useRef } from 'react';
import { api, SimulationResponse } from '../lib/api';
import { Info, AlertTriangle, Minus, Music, Flag, Navigation, Megaphone, HardHat } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'none',         label: 'No event',    sublabel: 'baseline', multiplier: 1.00, icon: Minus      },
  { value: 'public_event', label: 'Festival',    sublabel: '+35%',     multiplier: 1.35, icon: Music      },
  { value: 'procession',   label: 'Procession',  sublabel: '+28%',     multiplier: 1.28, icon: Flag       },
  { value: 'vip_movement', label: 'VIP transit', sublabel: '+20%',     multiplier: 1.20, icon: Navigation },
  { value: 'protest',      label: 'Protest',     sublabel: '+15%',     multiplier: 1.15, icon: Megaphone  },
  { value: 'construction', label: 'Road works',  sublabel: '+10%',     multiplier: 1.10, icon: HardHat    },
];
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function SliderTrack({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative">
      <div className="relative h-1.5 rounded-full bg-edge">
        <div className="absolute inset-y-0 left-0 rounded-full bg-amber" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-amber rounded-full border-2 border-navy-900 pointer-events-none" style={{ left: `${pct}%` }} />
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
    </div>
  );
}

export default function SimulatorForm() {
  const [eventType, setEventType] = useState('public_event');
  const [hour, setHour] = useState(21);
  const [day, setDay]   = useState(6);
  const [topN, setTopN] = useState(10);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSimulation(evt: string, h: number, d: number, n: number) {
    setLoading(true); setError(null);
    try { const res = await api.simulateEvent(evt, h, d, n); setResults(res); }
    catch (err: any) { setError(err.message || 'An error occurred'); }
    finally { setLoading(false); }
  }

  // Auto-run with 400ms debounce whenever any param changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSimulation(eventType, hour, day, topN), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [eventType, hour, day, topN]);

  const fmt = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');
  const selectedEvent = EVENT_TYPES.find((e) => e.value === eventType)!;
  const maxSeverity = results ? Math.max(...results.results.map((r) => r.adjusted_severity)) : 1;
  const periodLabel = hour < 6 ? 'Late night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';

  return (
    <div className="space-y-6">
      <div className="bg-navy-900 border border-edge rounded p-5 space-y-6">

        {/* Event type cards */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Event type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {EVENT_TYPES.map((evt) => {
              const isActive = eventType === evt.value;
              const Icon = evt.icon;
              return (
                <button key={evt.value} onClick={() => setEventType(evt.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded border text-center transition-colors cursor-pointer ${
                    isActive ? 'border-amber bg-amber-bg' : 'border-edge bg-navy-800 hover:border-edge-strong'
                  }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber' : 'text-ink-3'}`} strokeWidth={2} />
                  <div>
                    <p className={`text-[12px] font-medium ${isActive ? 'text-ink' : 'text-ink-2'}`}>{evt.label}</p>
                    <p className={`font-mono text-[11px] mt-0.5 ${isActive ? 'text-amber' : 'text-ink-3'}`}>{evt.sublabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Day of week</label>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}
            className="w-full h-10 bg-navy-800 border border-edge rounded px-3 text-[14px] text-ink focus:outline-none focus:border-edge-strong">
            {DAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
          </select>
        </div>

        {/* Hour slider */}
        <div className="flex flex-col gap-3 bg-navy-800 border border-edge rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Hour of day</label>
              <p className="text-[12px] text-ink-3 mt-0.5">Time when the event occurs</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[18px] font-medium text-ink leading-none">{String(hour).padStart(2,'0')}:00</span>
              <span className="text-[11px] text-amber border border-amber/30 bg-amber-bg rounded px-1.5 py-0.5">{periodLabel}</span>
            </div>
          </div>
          <SliderTrack value={hour} min={0} max={23} onChange={setHour} />
          <div className="flex justify-between">
            {Array.from({ length: 24 }, (_, i) => i).map((h) => {
              const isActive = h === hour;
              return (
                <div key={h} className="flex flex-col items-center gap-0.5" style={{ width: `${100/24}%` }}>
                  <div className={`w-px ${isActive ? 'h-2.5 bg-amber' : h % 6 === 0 ? 'h-2 bg-ink-3' : 'h-1.5 bg-edge'}`} />
                  {h % 4 === 0 && (
                    <span className={`font-mono text-[9px] ${isActive ? 'text-amber' : 'text-ink-3'}`}>
                      {h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h-12}p`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TopN slider */}
        <div className="flex flex-col gap-3 bg-navy-800 border border-edge rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Hotspots to analyse</label>
              <p className="text-[12px] text-ink-3 mt-0.5">Top junctions included in the output</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[18px] font-medium text-ink leading-none">{topN}</span>
              <span className="text-[11px] text-amber border border-amber/30 bg-amber-bg rounded px-1.5 py-0.5">
                {topN <= 8 ? 'Focused' : topN <= 15 ? 'Broad' : 'Max'}
              </span>
            </div>
          </div>
          <SliderTrack value={topN} min={5} max={25} onChange={setTopN} />
          <div className="flex justify-between">
            {Array.from({ length: 21 }, (_, i) => i + 5).map((v) => {
              const isActive = v === topN;
              return (
                <div key={v} className="flex flex-col items-center gap-0.5" style={{ width: `${100/21}%` }}>
                  <div className={`w-px ${isActive ? 'h-2.5 bg-amber' : v % 5 === 0 ? 'h-2 bg-ink-3' : 'h-1.5 bg-edge'}`} />
                  {v % 5 === 0 && <span className={`font-mono text-[9px] ${isActive ? 'text-amber' : 'text-ink-3'}`}>{v}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-edge">
          <div className="flex items-center gap-2 text-[13px] text-ink-2">
            <Info className="w-4 h-4 text-info flex-shrink-0" strokeWidth={2} />
            <span>Applying <span className="font-mono text-ink">{selectedEvent.multiplier}×</span> multiplier to baseline severity.</span>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-ink-3">
              <div className="w-3.5 h-3.5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
              <span>Updating…</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-crit-bg border border-crit/30 text-crit rounded p-4 flex items-center gap-3 text-[13px]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {results && (
        <div className="bg-navy-900 border border-edge rounded overflow-hidden">
          <div className="p-4 border-b border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Simulation active — {selectedEvent.label}</h4>
              <p className="text-[12px] text-ink-3 mt-0.5">Multiplier applied across all {results.results.length} junctions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-navy-800 border border-edge rounded px-4 py-2 text-center">
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3 block">Multiplier</span>
                <span className="font-mono text-[20px] font-medium text-amber">{results.multiplier}×</span>
              </div>
              <div className="bg-amber-bg border border-amber/30 rounded px-4 py-2 text-center">
                <span className="text-[11px] uppercase tracking-[0.08em] text-amber block">Total officers</span>
                <span className="font-mono text-[20px] font-medium text-amber">
                  {results.results.reduce((sum, r) => sum + r.recommended_officers, 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-edge">
            <h4 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Simulated congestion hotspots</h4>
            <p className="text-[12px] text-ink-3 mt-0.5">Sorted by adjusted severity under {selectedEvent.label} conditions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-edge text-ink-3 text-[11px] uppercase tracking-[0.08em]">
                  {['Rank','Junction','Adjusted severity','Officers'].map((h, i) => (
                    <th key={h} className={`py-3 px-4 font-medium ${i >= 2 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <tr key={i} className="border-b border-edge/50 hover:bg-navy-800 transition-colors row-animate" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="py-3 px-4 font-mono text-[13px] text-ink-2">#{i + 1}</td>
                    <td className="py-3 px-4">
                      <p className="text-[14px] font-medium text-ink">{fmt(r.junction_name)}</p>
                      <div className="mt-1.5 h-1 w-full max-w-[200px] rounded-full bg-edge/60">
                        <div className="h-full rounded-full bg-amber" style={{ width: `${(r.adjusted_severity / maxSeverity) * 100}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[13px] text-ink">{r.adjusted_severity.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 bg-amber-bg border border-amber/30 rounded px-2.5 py-1">
                        <span className="font-mono text-[13px] font-medium text-amber">{r.recommended_officers}</span>
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
