'use client';

import dynamic from 'next/dynamic';
import { MapPin, Info, Circle, Move, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="rounded border border-edge h-[550px] bg-navy-950 flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      <span className="font-mono text-[12px] text-ink-2">Loading map components…</span>
    </div>
  ),
});

const COLOR_SCALE = [
  { color: '#b91c1c', label: 'Critical', range: '> 1,500 / hr'  },
  { color: '#dc2626', label: 'High',     range: '800-1,500 / hr' },
  { color: '#f97316', label: 'Medium',   range: '400-800 / hr'   },
  { color: '#fb923c', label: 'Low',      range: '150-400 / hr'   },
  { color: '#fbbf24', label: 'Minimal',  range: '< 150 / hr'     },
];

export default function HeatmapView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <MapPin className="w-5 h-5 text-amber" strokeWidth={2} />
        <div>
          <h2 className="text-[18px] font-display font-semibold text-ink">Junction hotspot heatmap</h2>
          <p className="text-[13px] text-ink-2">Parking-induced congestion hotspots across 168 Bengaluru junctions.</p>
        </div>
      </div>

      {/* How to read */}
      <div className="bg-navy-900 border border-edge rounded p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-info flex-shrink-0" strokeWidth={2} />
          <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">How to read this map</h3>
        </div>
        <p className="text-[14px] text-ink-2 leading-relaxed">
          Each circle represents one of Bengaluru's 168 monitored junctions. The <span className="text-ink font-medium">colour</span> shows violation severity at that junction for the selected hour, and the <span className="text-ink font-medium">size</span> scales with the same count. Drag the hour slider to watch enforcement pressure shift across the city.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-3 p-4 bg-navy-800 border border-edge rounded">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-ink-3" strokeWidth={2} />
              <p className="text-[13px] font-medium text-ink">Circle colour = severity</p>
            </div>
            <div className="space-y-1.5">
              {COLOR_SCALE.map((c) => (
                <div key={c.label} className="flex items-center gap-3 px-2 py-1">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white/30" style={{ backgroundColor: c.color }} />
                  <span className="text-[13px] text-ink w-16 flex-shrink-0">{c.label}</span>
                  <span className="font-mono text-[11px] text-ink-3">{c.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 p-4 bg-navy-800 border border-edge rounded">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-ink-3" strokeWidth={2} />
                <p className="text-[13px] font-medium text-ink">Circle size = relative count</p>
              </div>
              <div className="flex items-end gap-4 px-2 pt-1">
                {[{r:8,l:'Low',c:'#fbbf24'},{r:14,l:'Medium',c:'#f97316'},{r:20,l:'High',c:'#dc2626'},{r:26,l:'Critical',c:'#b91c1c'}].map((dot) => (
                  <div key={dot.l} className="flex flex-col items-center gap-1.5">
                    <div className="rounded-full border border-white/30 flex-shrink-0" style={{ width: dot.r, height: dot.r, backgroundColor: dot.c }} />
                    <span className="text-[10px] text-ink-3">{dot.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4 bg-navy-800 border border-edge rounded">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-3" strokeWidth={2} />
                <p className="text-[13px] font-medium text-ink">Click any circle for details</p>
              </div>
              <p className="text-[12px] text-ink-2 leading-relaxed">A popup shows the junction name, exact violation count at that hour, and the time you're viewing.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-2">What to look for at different hours</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: TrendingUp,    label: 'Late night (00:00-06:00)',    desc: 'Highest overall counts. Commercial trucks and delivery vehicles dominate near markets and freight routes.' },
              { icon: AlertTriangle, label: 'Evening peak (19:00-23:00)',  desc: 'Second major spike. Two-wheelers and cars park illegally near restaurants, malls and entertainment zones.' },
              { icon: Clock,         label: 'Daytime (09:00-17:00)',       desc: 'Comparatively calmer. Lower volume near commercial zones - ideal window for routine patrol redeployment.' },
            ].map((tip) => (
              <div key={tip.label} className="flex gap-3 p-4 border border-edge bg-navy-800 rounded">
                <tip.icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-ink-3" strokeWidth={2} />
                <div>
                  <p className="text-[13px] font-medium text-ink">{tip.label}</p>
                  <p className="text-[12px] text-ink-2 mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MapInner initialHour={5} />
    </div>
  );
}
