'use client';

import dynamic from 'next/dynamic';
import { PlanItem } from '../lib/api';
import { Map as MapIcon } from 'lucide-react';

const DeploymentMapInner = dynamic(() => import('./DeploymentMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center gap-3 bg-navy-950">
      <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      <span className="font-mono text-[12px] text-ink-2">Loading deployment map…</span>
    </div>
  ),
});

export default function DeploymentMap({ plan, dayName }: { plan: PlanItem[]; dayName: string }) {
  return (
    <div className="bg-navy-900 border border-edge rounded overflow-hidden">
      <div className="p-5 border-b border-edge flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-ink-3" strokeWidth={2} />
          <div>
            <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Deployment map - {dayName}</h3>
            <p className="text-[12px] text-ink-3 mt-0.5">Numbered pins mark each junction by deployment priority. Click a pin for officer count and peak hour.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="w-3 h-3 rounded-full border border-white/60" style={{ background: '#fbbf24' }} />Top 3
          </span>
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="w-3 h-3 rounded-full border border-white/60" style={{ background: '#dc2626' }} />Other
          </span>
          <span className="text-ink-3">· size = officers</span>
        </div>
      </div>
      <div className="relative h-[480px] bg-navy-950">
        {plan.length === 0
          ? <div className="h-full flex items-center justify-center text-[13px] text-ink-3">No junctions to map for this day.</div>
          : <DeploymentMapInner plan={plan} />
        }
      </div>
    </div>
  );
}
