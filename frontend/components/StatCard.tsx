'use client';

import { useEffect, useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

type BadgeTone = 'amber' | 'critical' | 'healthy' | 'info';

interface StatCardProps {
  title: string;
  value: string | number;
  animateValue?: number;
  animatePrefix?: string;
  animateSuffix?: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  icon: LucideIcon;
}

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return count;
}

const BADGE: Record<BadgeTone, string> = {
  amber:    'bg-amber-bg text-amber border border-amber/30',
  critical: 'bg-crit-bg text-crit border border-crit/30',
  healthy:  'bg-ok/10 text-ok border border-ok/30',
  info:     'bg-info/10 text-info border border-info/30',
};

export default function StatCard({ title, value, animateValue, animatePrefix = '', animateSuffix = '', subtitle, badge, badgeTone = 'amber', icon: Icon }: StatCardProps) {
  const count = useCountUp(animateValue ?? 0);
  const displayValue = animateValue !== undefined ? `${animatePrefix}${count.toLocaleString()}${animateSuffix}` : value;

  return (
    <div className="rounded border border-edge bg-navy-900 p-5 flex flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <span className="text-[11px] uppercase tracking-[0.08em] text-ink-2">{title}</span>
        <Icon className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
      </div>
      <div>
        <p className="font-mono text-[34px] leading-none font-medium text-ink">{displayValue}</p>
        {subtitle && <p className="text-[12px] text-ink-3 mt-1.5">{subtitle}</p>}
      </div>
      {badge && (
        <div className="mt-auto pt-1">
          <span className={`inline-block rounded text-[11px] font-medium px-2 py-0.5 ${BADGE[badgeTone]}`}>{badge}</span>
        </div>
      )}
    </div>
  );
}
