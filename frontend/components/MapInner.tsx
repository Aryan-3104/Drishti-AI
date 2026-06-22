'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api, AllHoursHotspot } from '../lib/api';
import { Clock, AlertTriangle, Train, Activity } from 'lucide-react';
import { toKannada } from '../lib/kannada';
import 'leaflet/dist/leaflet.css';

// Namma Metro stations — Purple Line (East-West) + Green Line (North-South)
const METRO_STATIONS = [
  // Purple Line
  { name: 'Baiyappanahalli',        lat: 12.9884, lon: 77.6521, line: 'purple' },
  { name: 'Indiranagar',            lat: 12.9784, lon: 77.6408, line: 'purple' },
  { name: 'Halasuru',               lat: 12.9769, lon: 77.6268, line: 'purple' },
  { name: 'Trinity',                lat: 12.9698, lon: 77.6218, line: 'purple' },
  { name: 'MG Road',                lat: 12.9759, lon: 77.6103, line: 'purple' },
  { name: 'Cubbon Park',            lat: 12.9762, lon: 77.5971, line: 'purple' },
  { name: 'Vidhana Soudha',         lat: 12.9773, lon: 77.5879, line: 'purple' },
  { name: 'Sir MV',                 lat: 12.9753, lon: 77.5785, line: 'purple' },
  { name: 'Majestic (Purple)',      lat: 12.9774, lon: 77.5717, line: 'purple' },
  { name: 'City Railway Station',   lat: 12.9778, lon: 77.5580, line: 'purple' },
  { name: 'Magadi Road',            lat: 12.9719, lon: 77.5562, line: 'purple' },
  { name: 'Vijayanagar',            lat: 12.9570, lon: 77.5261, line: 'purple' },
  { name: 'Attiguppe',              lat: 12.9576, lon: 77.5164, line: 'purple' },
  { name: 'Mysuru Road',            lat: 12.9579, lon: 77.4972, line: 'purple' },
  // Green Line
  { name: 'Nagasandra',             lat: 13.0578, lon: 77.5243, line: 'green' },
  { name: 'Dasarahalli',            lat: 13.0483, lon: 77.5244, line: 'green' },
  { name: 'Jalahalli',              lat: 13.0366, lon: 77.5246, line: 'green' },
  { name: 'Peenya Industry',        lat: 13.0253, lon: 77.5230, line: 'green' },
  { name: 'Peenya',                 lat: 13.0182, lon: 77.5230, line: 'green' },
  { name: 'Yeshwanthpur',           lat: 13.0218, lon: 77.5497, line: 'green' },
  { name: 'Rajajinagar',            lat: 12.9970, lon: 77.5540, line: 'green' },
  { name: 'Mahalakshmi',            lat: 13.0066, lon: 77.5605, line: 'green' },
  { name: 'Sampige Road',           lat: 12.9789, lon: 77.5717, line: 'green' },
  { name: 'Majestic (Green)',       lat: 12.9762, lon: 77.5710, line: 'green' },
  { name: 'Chickpete',              lat: 12.9694, lon: 77.5744, line: 'green' },
  { name: 'KR Market',              lat: 12.9621, lon: 77.5737, line: 'green' },
  { name: 'National College',       lat: 12.9514, lon: 77.5740, line: 'green' },
  { name: 'Lalbagh',                lat: 12.9483, lon: 77.5833, line: 'green' },
  { name: 'South End Circle',       lat: 12.9378, lon: 77.5912, line: 'green' },
  { name: 'Jayanagar',              lat: 12.9289, lon: 77.5912, line: 'green' },
  { name: 'Banashankari',           lat: 12.9178, lon: 77.5929, line: 'green' },
  { name: 'Yelachenahalli',         lat: 12.9011, lon: 77.5929, line: 'green' },
];

// Spillover radius in metres: commuters walking from metro create illegal parking pressure
const METRO_SPILLOVER_M = 400;

const VIOLATION_SCALE = [
  { min: 1500, color: '#b91c1c', label: '> 1,500 - critical' },
  { min: 800,  color: '#dc2626', label: '800-1,500 - high'   },
  { min: 400,  color: '#f97316', label: '400-800 - medium'   },
  { min: 150,  color: '#fb923c', label: '150-400 - low'      },
  { min: 0,    color: '#fbbf24', label: '< 150 - minimal'    },
];

// Congestion impact is violation_count × (1 + main_road_pct × 8) so thresholds are higher
const CONGESTION_SCALE = [
  { min: 6000, color: '#7c3aed', label: '> 6,000 - severe'   },
  { min: 3000, color: '#a855f7', label: '3,000-6,000 - high' },
  { min: 1500, color: '#c084fc', label: '1,500-3,000 - med'  },
  { min: 500,  color: '#e879f9', label: '500-1,500 - low'    },
  { min: 0,    color: '#fbbf24', label: '< 500 - minimal'    },
];

const TIME_BANDS = [
  { label: 'Late night', range: '00-06', from: 0,  to: 5  },
  { label: 'Morning',    range: '06-12', from: 6,  to: 11 },
  { label: 'Afternoon',  range: '12-17', from: 12, to: 16 },
  { label: 'Evening',    range: '17-21', from: 17, to: 20 },
  { label: 'Night',      range: '21-24', from: 21, to: 23 },
];

type ViewMode = 'violations' | 'congestion';

export default function MapInner({ initialHour }: { initialHour: number }) {
  const [hour, setHour] = useState(initialHour);
  const [allHotspots, setAllHotspots] = useState<AllHoursHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('violations');
  const [showMetro, setShowMetro] = useState(false);

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

  const junctions = useMemo(() => {
    if (!allHotspots.length) return [];
    const map: Record<string, {
      junction_name: string; lat: number; lon: number;
      hourlyCounts: Record<number, number>;
      hourlyCongestion: Record<number, number>;
    }> = {};
    allHotspots.forEach((h) => {
      if (!map[h.junction_name]) {
        map[h.junction_name] = {
          junction_name: h.junction_name,
          lat: h.lat,
          lon: h.lon,
          hourlyCounts: {},
          hourlyCongestion: {},
        };
      }
      const hr = Math.round(h.hour);
      map[h.junction_name].hourlyCounts[hr] = h.violation_count;
      map[h.junction_name].hourlyCongestion[hr] = h.congestion_impact ?? h.violation_count;
    });
    return Object.values(map);
  }, [allHotspots]);

  const activeHotspots = useMemo(() => {
    if (!junctions.length) return [];
    const h1 = Math.floor(hour) % 24;
    const h2 = (h1 + 1) % 24;
    const w = hour - Math.floor(hour);

    const list = junctions.map((j) => {
      const c1 = j.hourlyCounts[h1] || 0;
      const c2 = j.hourlyCounts[h2] || 0;
      const ci1 = j.hourlyCongestion[h1] || 0;
      const ci2 = j.hourlyCongestion[h2] || 0;
      return {
        junction_name: j.junction_name,
        lat: j.lat,
        lon: j.lon,
        violation_count: c1 * (1 - w) + c2 * w,
        congestion_impact: ci1 * (1 - w) + ci2 * w,
      };
    });

    const sortKey = viewMode === 'congestion' ? 'congestion_impact' : 'violation_count';
    return list
      .filter((h) => h.violation_count > 0)
      .sort((a, b) => b[sortKey] - a[sortKey])
      .slice(0, 50);
  }, [junctions, hour, viewMode]);

  const activeScale = viewMode === 'congestion' ? CONGESTION_SCALE : VIOLATION_SCALE;

  const getMarkerColor = (value: number) =>
    activeScale.find((s) => value > s.min)?.color ?? '#fbbf24';

  const getMarkerRadius = (value: number, mode: ViewMode) => {
    if (mode === 'congestion') return Math.max(5, Math.min(28, value / 300 + 5));
    return Math.max(5, Math.min(28, value / 80 + 5));
  };

  const fmt = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');
  const periodLabel = hour < 6 ? 'Late night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';

  const formatTime = (hVal: number) => {
    let displayHour = Math.floor(hVal);
    let displayMinute = Math.round((hVal - displayHour) * 60);
    if (displayMinute === 60) { displayMinute = 0; displayHour = (displayHour + 1) % 24; }
    return `${String(displayHour).padStart(2, '0')}:${String(displayMinute).padStart(2, '0')}`;
  };

  // Approx metres-per-degree latitude for Bengaluru
  const metroRadiusDeg = METRO_SPILLOVER_M / 111320;

  return (
    <div className="flex flex-col gap-4">

      {/* View mode + metro toggles */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-navy-900 border border-edge rounded">
        <div className="flex items-center gap-1.5 mr-2">
          <Activity className="w-3.5 h-3.5 text-ink-3" strokeWidth={2} />
          <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3">Map layer</span>
        </div>

        {/* Violation count mode */}
        <button
          onClick={() => setViewMode('violations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors cursor-pointer ${
            viewMode === 'violations'
              ? 'bg-amber/10 border-amber/40 text-amber'
              : 'bg-navy-800 border-edge text-ink-2 hover:border-edge-strong'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current opacity-80" />
          Violation count
        </button>

        {/* Congestion impact mode */}
        <button
          onClick={() => setViewMode('congestion')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors cursor-pointer ${
            viewMode === 'congestion'
              ? 'bg-purple-500/10 border-purple-400/40 text-purple-300'
              : 'bg-navy-800 border-edge text-ink-2 hover:border-edge-strong'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current opacity-80" />
          Congestion impact
        </button>

        <div className="h-4 w-px bg-edge mx-1 hidden sm:block" />

        {/* Metro overlay toggle */}
        <button
          onClick={() => setShowMetro((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors cursor-pointer ${
            showMetro
              ? 'bg-blue-500/10 border-blue-400/40 text-blue-300'
              : 'bg-navy-800 border-edge text-ink-2 hover:border-edge-strong'
          }`}
        >
          <Train className="w-3.5 h-3.5" strokeWidth={2} />
          Metro spillover zones
        </button>

        {viewMode === 'congestion' && (
          <p className="text-[11px] text-ink-3 ml-auto hidden lg:block">
            Weighted by carriageway blockage — main-road violations count 8× more than footpath
          </p>
        )}
      </div>

      {/* Slider controls */}
      <div className="flex flex-col gap-4 p-5 bg-navy-900 border border-edge rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-ink-3" strokeWidth={2} />
            <div>
              <h4 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Hour of day</h4>
              <p className="text-[12px] text-ink-3 mt-0.5">Drag to filter hotspots by time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[24px] font-medium text-ink leading-none">{formatTime(hour)}</span>
            <span className="text-[11px] text-amber border border-amber/30 bg-amber-bg rounded px-1.5 py-0.5">{periodLabel}</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative h-1.5 rounded-full bg-edge">
            <div className="absolute inset-y-0 left-0 rounded-full bg-amber" style={{ width: `${(hour / 23.95) * 100}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-amber rounded-full border-2 border-navy-900 pointer-events-none" style={{ left: `${(hour / 23.95) * 100}%` }} />
          </div>
          <input type="range" min={0} max={23.95} step={0.05} value={hour} onChange={(e) => setHour(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        </div>

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
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Metro spillover rings */}
          {showMetro && METRO_STATIONS.map((station) => (
            <CircleMarker
              key={`metro-${station.name}`}
              center={[station.lat, station.lon]}
              radius={metroRadiusDeg * 111320 / 8}
              pathOptions={{
                color: station.line === 'purple' ? '#a855f7' : '#22c55e',
                weight: 1.5,
                fillColor: station.line === 'purple' ? '#a855f7' : '#22c55e',
                fillOpacity: 0.10,
                opacity: 0.6,
                dashArray: '4 3',
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-1 min-w-[150px]">
                  <div className="flex items-center gap-1.5">
                    <Train className="w-3.5 h-3.5" style={{ color: station.line === 'purple' ? '#a855f7' : '#22c55e' }} strokeWidth={2} />
                    <p className="text-[13px] font-medium text-ink">{station.name}</p>
                  </div>
                  <p className="text-[11px] text-ink-3">Namma Metro · {station.line === 'purple' ? 'Purple Line' : 'Green Line'}</p>
                  <p className="text-[11px] text-ink-2">400 m spillover zone — commuter parking pressure area</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Junction hotspot markers */}
          {activeHotspots.map((h) => {
            const displayValue = viewMode === 'congestion' ? h.congestion_impact : h.violation_count;
            return (
              <CircleMarker
                key={h.junction_name}
                center={[h.lat, h.lon]}
                radius={getMarkerRadius(displayValue, viewMode)}
                pathOptions={{
                  color: '#ffffff',
                  weight: 1.5,
                  fillColor: getMarkerColor(displayValue),
                  fillOpacity: 0.82,
                  opacity: 0.9,
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 min-w-[175px]">
                    <p className="text-[13px] font-medium text-ink">{fmt(h.junction_name)}</p>
                    {toKannada(h.junction_name) && (
                      <p className="text-[11px] text-ink-3 border-b border-edge pb-1.5 mt-0.5 text-kannada">{toKannada(h.junction_name)}</p>
                    )}
                    {!toKannada(h.junction_name) && <div className="border-b border-edge pb-1.5" />}
                    <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber flex-shrink-0" strokeWidth={2} />
                      <span>Violations: <b className="font-mono text-ink">{Math.round(h.violation_count).toLocaleString()}</b></span>
                    </div>
                    {viewMode === 'congestion' && (
                      <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                        <Activity className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" strokeWidth={2} />
                        <span>Congestion impact: <b className="font-mono text-purple-300">{Math.round(h.congestion_impact).toLocaleString()}</b></span>
                      </div>
                    )}
                    <p className="font-mono text-[11px] text-ink-3">Time: {formatTime(hour)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-navy-900 border border-edge rounded px-3 py-2.5 text-[11px] text-ink-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.08em] text-ink-3 border-b border-edge pb-1">
            {viewMode === 'congestion' ? 'Congestion impact' : 'Violations / hr'}
          </p>
          {activeScale.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white/40 flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-mono text-[11px]">{label}</span>
            </div>
          ))}
          {showMetro && (
            <>
              <p className="text-[10px] uppercase tracking-[0.08em] text-ink-3 border-t border-edge pt-1.5 mt-1">Metro spillover</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-purple-400/60 flex-shrink-0" style={{ backgroundColor: '#a855f720' }} />
                <span className="font-mono text-[11px]">Purple line</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-green-400/60 flex-shrink-0" style={{ backgroundColor: '#22c55e20' }} />
                <span className="font-mono text-[11px]">Green line</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
