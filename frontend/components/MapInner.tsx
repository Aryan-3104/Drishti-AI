'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api, Hotspot } from '../lib/api';
import { Clock, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapInnerProps {
  initialHour: number;
}

export default function MapInner({ initialHour }: MapInnerProps) {
  const [hour, setHour] = useState(initialHour);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHotspots() {
      setLoading(true);
      try {
        const res = await api.getHotspots(hour, 50);
        setHotspots(res.hotspots);
      } catch (err) {
        console.error('Failed to load hotspots:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHotspots();
  }, [hour]);

  // Determine marker colors based on violation density
  const getMarkerColor = (count: number) => {
    if (count > 1000) return '#ef4444'; // Red for high risk
    if (count > 500) return '#f97316';  // Orange for medium risk
    return '#eab308';                   // Yellow for lower risk
  };

  const getMarkerRadius = (count: number) => {
    return Math.max(6, Math.min(24, Math.round(count / 100) + 4));
  };

  const formatJunctionName = (name: string) => {
    return name.replace(/^BTP\d+\s*-\s*/, '');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Slider Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-red-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Hour Slider</h4>
            <p className="text-xs text-slate-400">Drag to adjust the time of day</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="flex-1 accent-red-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 min-w-[90px] text-center shadow-inner">
            <span className="text-sm font-extrabold text-white">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-[550px] bg-slate-950">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[1000] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-400">Updating hotspots...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          {/* CartoDB Dark Matter Tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {hotspots.map((h, i) => {
            const count = h.violation_count || 0;
            const color = getMarkerColor(count);
            const radius = getMarkerRadius(count);

            return (
              <CircleMarker
                key={i}
                center={[h.lat, h.lon]}
                radius={radius}
                pathOptions={{
                  color: '#ffffff',
                  weight: 1,
                  fillColor: color,
                  fillOpacity: 0.85,
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 min-w-[150px]">
                    <p className="text-xs font-extrabold text-slate-900 border-b pb-1">
                      {formatJunctionName(h.junction_name)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span>Violations: <b>{count.toLocaleString()}</b></span>
                    </div>
                    <p className="text-[10px] text-slate-500">Hour: {hour}:00</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
