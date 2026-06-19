'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Dynamically import the MapInner component with SSR disabled
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-800 h-[550px] bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-sm font-semibold text-slate-400">Loading map components...</span>
    </div>
  ),
});

export default function HeatmapView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-emerald-500">
          <MapPin className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-tight text-white">Junction Hotspot Heatmap</h2>
        </div>
        <p className="text-xs text-slate-400">
          Visualizing parking-induced congestion hotspots across 168 Bengaluru junctions.
        </p>
      </div>

      <MapInner initialHour={5} />
    </div>
  );
}
