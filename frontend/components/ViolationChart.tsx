'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HourlyStat } from '../lib/api';

interface ViolationChartProps {
  data: HourlyStat[];
  junctionName: string;
}

export default function ViolationChart({ data, junctionName }: ViolationChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format data for chart display (convert 24h hours to readable formats)
  const formattedData = data.map((item) => ({
    hourStr: `${String(item.hour).padStart(2, '0')}:00`,
    'Violations Count': item.violation_count,
  }));

  const formatJunctionName = (name: string) => {
    return name.replace(/^BTP\d+\s*-\s*/, '');
  };

  if (!mounted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-[382px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div>
        <h4 className="text-base font-bold text-white tracking-tight">Hourly Violation Patterns</h4>
        <p className="text-xs text-slate-400">Junction: {formatJunctionName(junctionName)}</p>
      </div>

      <div className="h-[300px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No statistics available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300} debounce={1}>
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(1, 169, 130)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="rgb(1, 169, 130)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
              <XAxis
                dataKey="hourStr"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#f8fafc',
                }}
                labelStyle={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '12px', color: '#f8fafc' }}
              />
              <Area
                type="monotone"
                dataKey="Violations Count"
                stroke="rgb(1, 169, 130)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorViolations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
