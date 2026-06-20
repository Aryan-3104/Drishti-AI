'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HourlyStat } from '../lib/api';

const ACCENT = '#FF6600';

function MinimalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e0d8cc', borderRadius: 4, padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <p style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#9a8c7a' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 13, color: ACCENT, fontWeight: 500 }}>
        {payload[0].value.toLocaleString()} violations
      </p>
    </div>
  );
}

export default function ViolationChart({ data, junctionName }: { data: HourlyStat[]; junctionName: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const formattedData = data.map((item) => ({
    hourStr: `${String(item.hour).padStart(2, '0')}:00`,
    'Violations Count': item.violation_count,
  }));

  const formatJunctionName = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');

  if (!mounted) {
    return (
      <div className="bg-navy-900 border border-edge rounded p-5 h-[378px] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-navy-900 border border-edge rounded p-5 space-y-3">
      <div>
        <h4 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Hourly violation pattern</h4>
        <p className="text-[12px] text-ink-3 mt-0.5">Junction: {formatJunctionName(junctionName)}</p>
      </div>
      <div className="h-[300px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[13px] text-ink-3">No statistics available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300} debounce={1}>
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="amberFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(30,58,95,0.4)" vertical={false} />
              <XAxis dataKey="hourStr" stroke="#5a7290" fontSize={11} fontFamily="var(--font-jetbrains)" tickLine={false} axisLine={false} interval={2} />
              <YAxis stroke="#5a7290" fontSize={11} fontFamily="var(--font-jetbrains)" tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip content={<MinimalTooltip />} cursor={{ stroke: '#2d4f7a', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="Violations Count" stroke={ACCENT} strokeWidth={1.5} fillOpacity={1} fill="url(#amberFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
