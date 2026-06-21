'use client';

import { useState, useEffect } from 'react';
import { api, Hotspot } from '../lib/api';
import { Info, ChevronRight } from 'lucide-react';

const PEAK_WINDOWS = [
  { startHour: 2,  endHour: 6,  label: 'Night commercial vehicle peak',  liftNote: 'Commercial vehicle restrictions lift' },
  { startHour: 19, endHour: 23, label: 'Evening two-wheeler peak',        liftNote: 'Evening congestion window begins' },
];

const pad = (n: number) => String(n).padStart(2, '0');

function format12(hour: number) {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${pad(h)}:00 ${period}`;
}

function statusSentence(h: number) {
  if (h >= 2  && h <= 6)  return 'Commercial vehicle violation peak in progress';
  if (h >= 19 && h <= 23) return 'Evening violation peak in progress';
  if (h === 0 || h === 1) return 'Entering peak commercial violation window';
  if (h >= 16 && h < 19)  return 'Approaching evening peak - stage units now';
  return 'Between peak windows - routine monitoring';
}

export default function LiveNowPanel() {
  const [systemNow, setSystemNow] = useState<Date | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simHour, setSimHour] = useState(13);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  useEffect(() => {
    setSystemNow(new Date());
    const id = setInterval(() => setSystemNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  let now: Date | null = null;
  if (isSimulated) {
    const d = new Date();
    d.setHours(simHour, 0, 0, 0);
    now = d;
  } else {
    now = systemNow;
  }

  const currentHour = now?.getHours();
  useEffect(() => {
    if (currentHour === undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getHotspots(currentHour, 5);
        if (!cancelled) setHotspots(res.hotspots);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [currentHour]);

  const formatJunctionName = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');

  if (!now) return <div className="rounded border border-edge-strong bg-navy-900 h-[150px]" />;

  const nextCandidates = PEAK_WINDOWS.map((w) => {
    const d = new Date(now);
    d.setHours(w.startHour, 0, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return { window: w, date: d };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  const next = nextCandidates[0];
  const diffSec = Math.max(0, Math.floor((next.date.getTime() - now.getTime()) / 1000));
  const cd = `${pad(Math.floor(diffSec / 3600))}:${pad(Math.floor((diffSec % 3600) / 60))}:${pad(diffSec % 60)}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())} IST`;

  return (
    <div className="rounded border border-edge-strong bg-navy-900 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8">
        <div className="flex flex-col gap-1.5 justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3">Current status</span>
              <button
                type="button"
                onClick={() => {
                  if (!isSimulated) {
                    setSimHour(systemNow?.getHours() ?? 13);
                  }
                  setIsSimulated(!isSimulated);
                }}
                className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded border cursor-pointer select-none transition-all flex items-center gap-1 ${
                  isSimulated
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber hover:bg-amber-500/20'
                    : 'bg-navy-800 border-edge text-ink-3 hover:text-ink hover:border-edge-strong'
                }`}
              >
                {isSimulated ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber"></span>
                    </span>
                    Simulated Time
                  </>
                ) : (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Live Time
                  </>
                )}
              </button>
            </div>
            <span className="font-mono text-[32px] leading-none font-medium text-ink block mt-1">{clock}</span>
            <p className="text-[14px] text-ink mt-1.5">{statusSentence(now.getHours())}</p>
            <div className="flex items-center gap-1.5 text-ink-3 mt-1">
              <Info className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
              <span className="text-[12px]">Based on 5 months of historical patterns at this hour</span>
            </div>
          </div>

          {isSimulated && (
            <div className="mt-3 pt-3 border-t border-edge/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-3">
                <span>Drag to adjust simulated hour:</span>
                <span className="text-amber font-semibold text-[12px]">{pad(simHour)}:00 IST</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={simHour}
                onChange={(e) => setSimHour(parseInt(e.target.value))}
                className="w-full h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-amber"
              />
            </div>
          )}
        </div>

        <div className="hidden lg:block w-px bg-edge" />

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3">Next peak window</span>
          <span className="font-mono text-[32px] leading-none font-medium text-amber">{cd}</span>
          <p className="text-[12px] text-ink-2 mt-1">
            <span className="font-mono">{format12(next.window.startHour)}</span> - {next.window.liftNote}
          </p>
          {hotspots.length > 0 && (
            <div className="mt-2 pt-2 border-t border-edge/60 space-y-1">
              <span className="text-[10px] uppercase tracking-[0.08em] text-ink-3">Peaking now</span>
              {hotspots.slice(0, 2).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-ink-2 truncate">
                    <ChevronRight className="w-3 h-3 text-ink-3 flex-shrink-0" strokeWidth={2} />
                    <span className="truncate">{formatJunctionName(h.junction_name)}</span>
                  </span>
                  <span className="font-mono text-amber ml-2 flex-shrink-0">
                    {(h.violation_count || h.total_violations || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
