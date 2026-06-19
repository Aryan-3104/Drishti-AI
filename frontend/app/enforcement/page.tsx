'use client';

import { useState, useEffect } from 'react';
import { api, PlanItem } from '@/lib/api';
import { Calendar, UserCheck, MapPin, Sparkles, Map } from 'lucide-react';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EnforcementPlanner() {
  const [day, setDay] = useState(0); // 0 = Monday
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlan() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPlan(day, 12);
        setPlan(res.plan || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load enforcement plan.');
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [day]);

  // Calculate total officers required for this plan
  const totalOfficers = plan.reduce((acc, curr) => acc + curr.recommended_officers, 0);

  const formatJunctionName = (name: string) => {
    return name.replace(/^BTP\d+\s*-\s*/, '');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-emerald-500">
          <Calendar className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-tight text-white">Predictive Enforcement Planner</h2>
        </div>
        <p className="text-sm text-slate-400">
          Weekly deployment calendar recommended by AI based on historical and predicted hotspot densities.
        </p>
      </div>

      {/* Week Day Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAY_NAMES.map((name, i) => {
          const isActive = day === i;
          return (
            <button
              key={i}
              onClick={() => setDay(i)}
              className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wider text-center transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-500 shadow-[0_4px_12px_rgba(1,169,130,0.2)] scale-[1.03]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Deployment summary widget */}
      {!loading && !error && plan.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/15 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Deployment Overview for {DAY_NAMES[day]}</h4>
              <p className="text-xs text-slate-400">Targeting the top {plan.length} high-severity hotspot intersections</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shadow-inner text-right self-start sm:self-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Recommended Force</span>
            <span className="text-lg font-extrabold text-white">{totalOfficers} Police Officers</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Deployment Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800/60">
          <h3 className="text-sm font-bold text-white tracking-tight">Active Deployment Force Schedule</h3>
          <p className="text-xs text-slate-400">Police allocation schedule for peak junction hotspots.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plan.length === 0 ? (
          <div className="text-center py-20 text-sm text-slate-500">
            No enforcement calendar recommendations available for this day.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Intersection</th>
                  <th className="py-4 px-6">Peak hour</th>
                  <th className="py-4 px-6">Target vehicle</th>
                  <th className="py-4 px-6 text-right">Predicted severity</th>
                  <th className="py-4 px-6 text-right">Deployment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {plan.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-slate-500">#{idx + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{formatJunctionName(item.junction_name)}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Map className="w-3 h-3" />
                        <span>GPS: {item.lat.toFixed(4)}, {item.lon.toFixed(4)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-300">
                      {String(item.peak_hour).padStart(2, '0')}:00
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                        {item.top_vehicle || 'SCOOTER'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-300 font-bold">
                      {item.predicted_severity.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold px-3 py-1 rounded-lg text-xs">
                        {item.recommended_officers} {item.recommended_officers === 1 ? 'Officer' : 'Officers'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
