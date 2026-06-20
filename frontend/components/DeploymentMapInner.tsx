'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PlanItem } from '../lib/api';
import { Users, Clock, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

function rankColor(idx: number) {
  if (idx === 0) return '#fbbf24';
  if (idx === 1) return '#fcd34d';
  if (idx === 2) return '#fde68a';
  return '#dc2626';
}

function numberedIcon(idx: number, officers: number) {
  const color = rankColor(idx);
  const size = 26 + Math.min(officers, 5) * 3;
  const textColor = idx <= 2 ? '#0a1628' : '#ffffff';
  return L.divIcon({
    className: 'deployment-pin',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #ffffff;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:${textColor};font-weight:700;font-size:${size > 32 ? 13 : 11}px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">${idx + 1}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ plan }: { plan: PlanItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (plan.length === 0) return;
    const pts = plan.map((p) => [p.lat, p.lon]) as [number, number][];
    if (pts.length === 1) map.setView(pts[0], 14);
    else map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
  }, [plan, map]);
  return null;
}

const fmt = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');

export default function DeploymentMapInner({ plan }: { plan: PlanItem[] }) {
  return (
    <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={true}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds plan={plan} />
      {plan.map((item, idx) => (
        <Marker key={idx} position={[item.lat, item.lon]} icon={numberedIcon(idx, item.recommended_officers)}>
          <Popup className="custom-leaflet-popup">
            <div className="p-1 space-y-1.5 min-w-[170px]">
              <div className="flex items-center gap-1.5 border-b border-edge pb-1.5">
                <span className="font-mono text-[11px] font-medium text-navy-950 bg-amber rounded px-1.5 py-0.5">#{idx + 1}</span>
                <p className="text-[13px] font-medium text-ink truncate">{fmt(item.junction_name)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                <Users className="w-3.5 h-3.5 text-amber flex-shrink-0" strokeWidth={2} />
                <span>Deploy <b className="font-mono text-ink">{item.recommended_officers}</b> officer{item.recommended_officers > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                <Clock className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" strokeWidth={2} />
                <span>Peak hour: <b className="font-mono text-ink">{String(item.peak_hour).padStart(2,'0')}:00</b></span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                <MapPin className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
                <span>{item.lat.toFixed(4)}, {item.lon.toFixed(4)}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
