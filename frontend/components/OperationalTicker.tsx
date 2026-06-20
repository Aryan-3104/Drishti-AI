'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const PEAK_START_HOURS = [2, 19];

function nextPeakCountdown(now: Date): string {
  const candidates = PEAK_START_HOURS.map((h) => {
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }).sort((a, b) => a - b);
  const totalMin = Math.floor((candidates[0] - now.getTime()) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

const officerEst = (count: number) => Math.max(1, Math.min(5, Math.round(count / 200)));

export default function OperationalTicker() {
  const [now, setNow] = useState<Date | null>(null);
  const [stats, setStats] = useState({ active: 0, critical: 0, officers: 0 });

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const currentHour = now?.getHours();
  useEffect(() => {
    if (currentHour === undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getHotspots(currentHour, 50);
        if (cancelled) return;
        const spots = res.hotspots || [];
        setStats({
          active:   spots.filter((s) => (s.violation_count || 0) > 150).length,
          critical: spots.filter((s) => (s.violation_count || 0) > 800).length,
          officers: spots.slice(0, 12).reduce((sum, s) => sum + officerEst(s.violation_count || 0), 0),
        });
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [currentHour]);

  const clock = now
    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`
    : '--:-- IST';

  const items = [
    { label: 'Active hotspots', value: String(stats.active) },
    { label: 'Critical zones',  value: String(stats.critical), crit: stats.critical > 0 },
    { label: 'Next peak window', value: now ? nextPeakCountdown(now) : '--', amber: true },
    { label: 'Officers deployed', value: String(stats.officers) },
  ];

  return (
    <div className="sticky top-14 z-40 h-9 bg-navy-900 border-b border-edge">
      <div className="h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center overflow-x-auto whitespace-nowrap text-[12px]">
        <span className="font-mono text-ink font-medium pr-4">{clock}</span>
        {items.map((it) => (
          <span key={it.label} className="flex items-center border-l border-edge pl-4 pr-4">
            <span className="text-ink-3 mr-1.5">{it.label}:</span>
            <span className={`font-mono font-medium ${it.crit ? 'text-crit' : it.amber ? 'text-amber' : 'text-ink'}`}>
              {it.value}
            </span>
          </span>
        ))}
        <span className="flex items-center border-l border-edge pl-4">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-ok status-pulse" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ok" />
          </span>
          <span className="text-ink-2">System nominal</span>
        </span>
      </div>
    </div>
  );
}
