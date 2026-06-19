'use client';

import { useState, useEffect } from 'react';
import { api, Hotspot, HourlyStat } from '@/lib/api';
import StatCard from '@/components/StatCard';
import ViolationChart from '@/components/ViolationChart';
import {
  ShieldAlert,
  MapPin,
  TrendingUp,
  Clock,
  Car,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';

export default function Dashboard() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedJunction, setSelectedJunction] = useState<string>('BTP051 - Safina Plaza Junction');
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Load top hotspots
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await api.getHotspots(undefined, 10);
        setHotspots(res.hotspots);
        if (res.hotspots.length > 0) {
          setSelectedJunction(res.hotspots[0].junction_name);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Load hourly stats when selected junction changes
  useEffect(() => {
    async function loadHourlyStats() {
      setChartLoading(true);
      try {
        const res = await api.getHourlyStats(selectedJunction);
        setHourlyStats(res.stats);
      } catch (err) {
        console.error('Failed to load hourly stats:', err);
      } finally {
        setChartLoading(false);
      }
    }
    if (selectedJunction) {
      loadHourlyStats();
    }
  }, [selectedJunction]);

  const formatJunctionName = (name: string) => {
    return name.replace(/^BTP\d+\s*-\s*/, '');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Command Control Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          Real-time parking violation analytics and predictive enforcement planning.
        </p>
      </div>

      {/* Grid of StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Violations Analyzed"
          value="298,450"
          subtitle="Collected across 5 months"
          trend="100% GPS Coverage"
          trendType="neutral"
          icon={Car}
          variant="blue"
        />
        <StatCard
          title="Top Hotspot Zone"
          value="Safina Plaza"
          subtitle="5.2% of all violations citywide"
          trend="8,785 violations"
          trendType="negative"
          icon={AlertOctagon}
          variant="red"
        />
        <StatCard
          title="Peak Violation Hours"
          value="2 AM – 6 AM"
          subtitle="Night commercial vehicle peaks"
          trend="Secondary peak: 7 PM - 11 PM"
          trendType="neutral"
          icon={Clock}
          variant="orange"
        />
        <StatCard
          title="Event Amplification"
          value="+35% Spike"
          subtitle="During public rallies / festivals"
          trend="Predictive Pre-deployment"
          trendType="positive"
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Double Column interactive panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hotspots list */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Top Hotspots</h3>
            <p className="text-xs text-slate-400">Select a junction to chart its hourly pattern</p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-slate-850 max-h-[350px] overflow-y-auto pr-1 space-y-1">
              {hotspots.map((item, idx) => {
                const isSelected = selectedJunction === item.junction_name;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedJunction(item.junction_name)}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800/80 border border-slate-700 text-white font-semibold shadow-inner'
                        : 'border border-transparent text-slate-300 hover:bg-slate-850/50 hover:text-slate-100'
                    }`}
                  >
                    <div className="truncate pr-3 space-y-0.5">
                      <p className="text-xs font-bold truncate">
                        {formatJunctionName(item.junction_name)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.top_vehicle || 'SCOOTER'} • Peak {item.peak_hour}:00
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/10">
                        {(item.total_violations || item.violation_count || 0).toLocaleString()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Charts pane */}
        <div className="lg:col-span-2 relative">
          {chartLoading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <ViolationChart data={hourlyStats} junctionName={selectedJunction} />
        </div>
      </div>
    </div>
  );
}
