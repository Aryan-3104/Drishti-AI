'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api, AllHoursHotspot } from '../lib/api';
import { Clock, AlertTriangle } from 'lucide-react';
import { toKannada } from '../lib/kannada';
import 'leaflet/dist/leaflet.css';

const COLOR_SCALE = [
  { min: 1500, color: '#b91c1c', label: '> 1,500 — critical' },
  { min: 800,  color: '#dc2626', label: '800–1,500 — high'   },
  { min: 400,  color: '#f97316', label: '400–800 — medium'   },
  { min: 150,  color: '#fb923c', label: '150–400 — low'      },
  { min: 0,    color: '#fbbf24', label: '< 150 — minimal'    },
];

const TIME_BANDS = [
  { label: 'Late night', range: '00–06', from: 0,  to: 5  },
  { label: 'Morning',    range: '06–12', from: 6,  to: 11 },
  { label: 'Afternoon',  range: '12–17', from: 12, to: 16 },
  { label: 'Evening',    range: '17–21', from: 17, to: 20 },
  { label: 'Night',      range: '21–24', from: 21, to: 23 },
];

export default function MapInner({ initialHour }: { initialHour: number }) {
  const [hour, setHour] = useState(initialHour);
  const [allHotspots, setAllHotspots] = useState<AllHoursHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAllHoursHotspots();
        setAllHotspots(res.hotspots || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Process raw hourly stats into static junctions with hourly count maps
  const junctions = useMemo(() => {
    if (!allHotspots.length) return [];
    const map: Record<string, { junction_name: string; lat: number; lon: number; hourlyCounts: Record<number, number> }> = {};
    allHotspots.forEach((h) => {
      if (!map[h.junction_name]) {
        map[h.junction_name] = {
          junction_name: h.junction_name,
          lat: h.lat,
          lon: h.lon,
          hourlyCounts: {},
        };
      }
      const hrInt = Math.round(h.hour);
      map[h.junction_name].hourlyCounts[hrInt] = h.violation_count;
    });
    return Object.values(map);
  }, [allHotspots]);

  // Compute active hotspots at the current interpolated hour
  const activeHotspots = useMemo(() => {
    if (!junctions.length) return [];

    const h1 = Math.floor(hour) % 24;
    const h2 = (h1 + 1) % 24;
    const w = hour - Math.floor(hour);

    const list = junctions.map((j) => {
      const c1 = j.hourlyCounts[h1] || 0;
      const c2 = j.hourlyCounts[h2] || 0;
      const count = c1 * (1 - w) + c2 * w;
      return {
        junction_name: j.junction_name,
        lat: j.lat,
        lon: j.lon,
        violation_count: count,
      };
    });

    // Sort by count and filter out zeros, then get top 50 to match design specifications
    return list
      .filter((h) => h.violation_count > 0)
      .sort((a, b) => b.violation_count - a.violation_count)
      .slice(0, 50);
  }, [junctions, hour]);

  const getMarkerColor = (count: number) => COLOR_SCALE.find((s) => count > s.min)?.color ?? '#fbbf24';
  const getMarkerRadius = (count: number) => Math.max(5, Math.min(28, count / 80 + 5));
  const fmt = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');
  const periodLabel = hour < 6 ? 'Late night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';

  const formatTime = (hVal: number) => {
    let displayHour = Math.floor(hVal);
    let displayMinute = Math.round((hVal - displayHour) * 60);
    if (displayMinute === 60) {
      displayMinute = 0;
      displayHour = (displayHour + 1) % 24;
    }
    return `${String(displayHour).padStart(2, '0')}:${String(displayMinute).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Slider controls */}
      <div className="flex flex-col gap-4 p-5 bg-navy-900 border border-edge rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-ink-3" strokeWidth={2} />
            <div>
              <h4 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Hour of day</h4>
              <p className="text-[12px] text-ink-3 mt-0.5">Drag to filter hotspots by time (smooth transitions)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[24px] font-medium text-ink leading-none">{formatTime(hour)}</span>
            <span className="text-[11px] text-amber border border-amber/30 bg-amber-bg rounded px-1.5 py-0.5">{periodLabel}</span>
          </div>
        </div>

        {/* Track */}
        <div className="relative">
          <div className="relative h-1.5 rounded-full bg-edge">
            <div className="absolute inset-y-0 left-0 rounded-full bg-amber" style={{ width: `${(hour / 23.95) * 100}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-amber rounded-full border-2 border-navy-900 pointer-events-none" style={{ left: `${(hour / 23.95) * 100}%` }} />
          </div>
          <input type="range" min={0} max={23.95} step={0.05} value={hour} onChange={(e) => setHour(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        </div>

        {/* Tick marks */}
        <div className="flex justify-between">
          {Array.from({ length: 24 }, (_, i) => i).map((h) => {
            const isActive = h === Math.floor(hour);
            return (
              <div key={h} className="flex flex-col items-center gap-0.5" style={{ width: `${100/24}%` }}>
                <div className={`w-px ${isActive ? 'h-2.5 bg-amber' : h % 6 === 0 ? 'h-2 bg-ink-3' : 'h-1.5 bg-edge'}`} />
                {h % 3 === 0 && (
                  <span className={`font-mono text-[9px] ${isActive ? 'text-amber' : 'text-ink-3'}`}>
                    {String(h).padStart(2,'0')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Time-of-day bands */}
        <div className="grid grid-cols-5 gap-1.5">
          {TIME_BANDS.map((band) => {
            const isActive = Math.floor(hour) >= band.from && Math.floor(hour) <= band.to;
            return (
              <div key={band.label} className={`text-center px-2 py-1.5 rounded border text-[11px] ${isActive ? 'border-amber/30 bg-amber-bg text-amber' : 'border-edge bg-navy-800 text-ink-2'}`}>
                <div className="font-medium">{band.label}</div>
                <div className="font-mono text-[10px] opacity-70">{band.range}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded overflow-hidden border border-edge h-[550px] bg-navy-950">
        {loading && (
          <div className="absolute inset-0 bg-navy-950/50 z-[1000] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-2 border-amber border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[12px] text-ink-2">Loading hotspots database…</span>
            </div>
          </div>
        )}

        <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={true}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {activeHotspots.map((h) => {
            const count = h.violation_count || 0;
            return (
              <CircleMarker key={h.junction_name} center={[h.lat, h.lon]} radius={getMarkerRadius(count)}
                pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: getMarkerColor(count), fillOpacity: 0.82, opacity: 0.9 }}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 min-w-[160px]">
                    <p className="text-[13px] font-medium text-ink">{fmt(h.junction_name)}</p>
                    {toKannada(h.junction_name) && (
                      <p className="text-[11px] text-ink-3 border-b border-edge pb-1.5 mt-0.5 text-kannada">{toKannada(h.junction_name)}</p>
                    )}
                    {!toKannada(h.junction_name) && <div className="border-b border-edge pb-1.5" />}
                    <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber flex-shrink-0" strokeWidth={2} />
                      <span>Violations: <b className="font-mono text-ink">{Math.round(count).toLocaleString()}</b></span>
                    </div>
                    <p className="font-mono text-[11px] text-ink-3">Time: {formatTime(hour)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-navy-900 border border-edge rounded px-3 py-2.5 text-[11px] text-ink-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.08em] text-ink-3 border-b border-edge pb-1">Violations / hr</p>
          {COLOR_SCALE.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white/40 flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-mono text-[11px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
