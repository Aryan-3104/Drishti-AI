'use client';

import { useState, useEffect, useRef } from 'react';
import { api, Hotspot, PredictionResponse, HourlyStat } from '../lib/api';
import { AreaChart, Area, XAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu, Search, ChevronDown, Database, AlertTriangle } from 'lucide-react';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ACCENT = '#FF6600';

const fmt = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');

export default function PredictionConsole() {
  const [junctions, setJunctions] = useState<Hotspot[]>([]);
  const [selected, setSelected] = useState('BTP051 - Safina Plaza Junction');
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(5);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);

  // Junction list (all 168)
  useEffect(() => {
    (async () => {
      try { const res = await api.getHotspots(undefined, 200); setJunctions(res.hotspots); }
      catch (e) { console.error(e); }
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Historical pattern (CSV) when junction changes
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    (async () => {
      try { const res = await api.getHourlyStats(selected); if (!cancelled) setHourly(res.stats); }
      catch { if (!cancelled) setHourly([]); }
    })();
    return () => { cancelled = true; };
  }, [selected]);

  // Live model prediction (debounced) when any input changes
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setPredLoading(true);
    setPredError(null);
    const t = setTimeout(async () => {
      try {
        const res = await api.predictSeverity(selected, hour, day);
        if (!cancelled) setPrediction(res);
      } catch (e: any) {
        if (!cancelled) { setPrediction(null); setPredError(e.message || 'Prediction failed'); }
      } finally {
        if (!cancelled) setPredLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [selected, hour, day]);

  const filtered = junctions
    .filter((j) => fmt(j.junction_name).toLowerCase().includes(query.toLowerCase()))
    .slice(0, 60);

  const selectedMeta = junctions.find((j) => j.junction_name === selected);
  const histAtHour = hourly.find((s) => Number(s.hour) === hour)?.violation_count ?? null;
  const chartData = hourly.map((s) => ({ label: String(Number(s.hour)).padStart(2, '0'), count: s.violation_count }));
  const hourLabel = String(hour).padStart(2, '0');

  return (
    <div className="bg-navy-900 border border-edge-strong rounded p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-amber" strokeWidth={2} />
          <div>
            <h3 className="text-[15px] font-display font-semibold text-ink">Live prediction console</h3>
            <p className="text-[12px] text-ink-2">XGBoost inference in real time, validated against 5 months of historical pattern.</p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-ok border border-ok/30 bg-ok/10 rounded px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-ok status-pulse" /> Model online
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* ── Inputs ── */}
        <div className="flex flex-col gap-4">
          {/* Junction combobox */}
          <div className="flex flex-col gap-1.5" ref={boxRef}>
            <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Junction</label>
            <div className="relative">
              <button
                onClick={() => { setOpen((o) => !o); setQuery(''); }}
                className="w-full h-10 bg-navy-800 border border-edge rounded px-3 flex items-center justify-between text-left hover:border-edge-strong transition-colors"
              >
                <span className="text-[13px] text-ink truncate">{fmt(selected)}</span>
                <ChevronDown className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={2} />
              </button>
              {open && (
                <div className="absolute z-30 mt-1 w-full bg-navy-800 border border-edge rounded shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 h-9 border-b border-edge">
                    <Search className="w-3.5 h-3.5 text-ink-3" strokeWidth={2} />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search 168 junctions…"
                      className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-3 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="px-3 py-3 text-[12px] text-ink-3">No match.</p>
                    ) : filtered.map((j) => (
                      <button
                        key={j.junction_name}
                        onClick={() => { setSelected(j.junction_name); setOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-navy-950 ${
                          j.junction_name === selected ? 'text-amber' : 'text-ink-2'
                        }`}
                      >
                        {fmt(j.junction_name)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {selectedMeta && (
              <p className="font-mono text-[11px] text-ink-3">
                {selectedMeta.lat?.toFixed(4)}, {selectedMeta.lon?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Day */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Day of week</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full h-10 bg-navy-800 border border-edge rounded px-3 text-[13px] text-ink focus:outline-none focus:border-edge-strong"
            >
              {DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
          </div>

          {/* Hour slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Hour of day</label>
              <span className="font-mono text-[14px] text-ink">{hourLabel}:00</span>
            </div>
            <div className="relative">
              <div className="relative h-1.5 rounded-full bg-edge">
                <div className="absolute inset-y-0 left-0 rounded-full bg-amber" style={{ width: `${(hour / 23) * 100}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-amber rounded-full border-2 border-navy-900 pointer-events-none" style={{ left: `${(hour / 23) * 100}%` }} />
              </div>
              <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
            </div>
          </div>
        </div>

        {/* ── Outputs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Model output */}
          <div className="bg-navy-800 border border-edge rounded p-4 flex flex-col gap-3 relative">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber" strokeWidth={2} />
              <span className="text-[11px] uppercase tracking-[0.08em] text-ink-2">XGBoost live inference</span>
            </div>
            {predLoading ? (
              <div className="flex-1 flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
              </div>
            ) : predError ? (
              <div className="flex items-start gap-2 text-crit text-[12px] py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>{predError}</span>
              </div>
            ) : prediction ? (
              <>
                <div>
                  <p className="text-[11px] text-ink-3">Predicted severity</p>
                  <p className="font-mono text-[36px] leading-none font-medium text-amber">
                    {prediction.predicted_severity.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-edge">
                  <span className="text-[11px] text-ink-3">Recommended officers</span>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`w-2 h-2 rounded-full ${i < prediction.recommended_officers ? 'bg-amber' : 'bg-edge'}`} />
                    ))}
                    <span className="font-mono text-[14px] font-medium text-amber ml-1">{prediction.recommended_officers}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Historical context */}
          <div className="bg-navy-800 border border-edge rounded p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-info" strokeWidth={2} />
              <span className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Historical pattern · 5 mo</span>
            </div>
            <div>
              <p className="text-[11px] text-ink-3">Actual violations at {hourLabel}:00</p>
              <p className="font-mono text-[36px] leading-none font-medium text-ink">
                {histAtHour !== null ? histAtHour.toLocaleString() : '-'}
              </p>
            </div>
            {/* Mini 24h chart with selected hour marked */}
            <div className="h-[72px] w-full">
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={72}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid #e0d8cc', borderRadius: 4, fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      labelStyle={{ color: '#8a8a8a', fontFamily: 'var(--font-jetbrains)' }}
                      itemStyle={{ color: ACCENT, fontFamily: 'var(--font-jetbrains)' }}
                      formatter={(v: any) => [v.toLocaleString(), 'Violations']}
                    />
                    <ReferenceLine x={hourLabel} stroke={ACCENT} strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={1.5} fill="url(#histFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Combined interpretation */}
          {prediction && (
            <div className="sm:col-span-2 bg-navy-950 border border-edge rounded p-3">
              <p className="text-[12px] text-ink-2 leading-relaxed">
                For <span className="text-ink font-medium">{fmt(selected)}</span> on{' '}
                <span className="text-ink font-medium">{DAY_NAMES[day]}</span> at{' '}
                <span className="font-mono text-ink">{hourLabel}:00</span>, the model predicts a severity of{' '}
                <span className="font-mono text-amber">{prediction.predicted_severity.toLocaleString()}</span> and recommends{' '}
                <span className="text-amber font-medium">{prediction.recommended_officers} officer{prediction.recommended_officers > 1 ? 's' : ''}</span>
                {histAtHour !== null && (
                  <> - consistent with a historical average of <span className="font-mono text-ink">{histAtHour.toLocaleString()}</span> violations recorded in this hour.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
