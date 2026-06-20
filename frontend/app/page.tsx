'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Hotspot, HourlyStat } from '@/lib/api';
import StatCard from '@/components/StatCard';
import ViolationChart from '@/components/ViolationChart';
import LiveNowPanel from '@/components/LiveNowPanel';
import { Car, AlertOctagon, Clock, TrendingUp, ChevronRight, Map, Calendar, Zap, Brain, ArrowRight } from 'lucide-react';

const CAPABILITIES = [
  { href: '/heatmap',     icon: Map,      tag: 'Spatial intelligence',    title: 'Live junction heatmap',       description: 'All 168 monitored junctions plotted on an interactive map. Scrub the hour slider to watch enforcement pressure shift across the city.',                                                                              metric: '168',      metricSub: 'junctions mapped' },
  { href: '/enforcement', icon: Calendar, tag: 'Predictive deployment',   title: 'Weekly enforcement planner',  description: 'An XGBoost model scores every junction across every hour of every weekday to produce a ranked deployment calendar with precise officer-count recommendations.',                                                   metric: '24×7×168', metricSub: 'pre-computed scores' },
  { href: '/simulate',    icon: Zap,      tag: 'Scenario engine',          title: 'Event impact simulator',      description: 'Model a festival, VIP transit, protest or road works and see where violations will spike, plus how many officers to pre-position before the event begins.',                                                   metric: '1.35×',    metricSub: 'peak festival multiplier' },
  { href: '/enforcement', icon: Brain,    tag: 'Machine learning core',    title: 'XGBoost prediction engine',  description: 'Trained on 298,450 GPS-tagged violations over 5 months, learning road type, vehicle mix, and peak-hour patterns to output severity scores and deployment counts.', metric: '298,450',  metricSub: 'violations in training set' },
];

export default function Dashboard() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedJunction, setSelectedJunction] = useState('BTP051 - Safina Plaza Junction');
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getHotspots(undefined, 10);
        setHotspots(res.hotspots);
        if (res.hotspots.length > 0) setSelectedJunction(res.hotspots[0].junction_name);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedJunction) return;
    setChartLoading(true);
    (async () => {
      try {
        const res = await api.getHourlyStats(selectedJunction);
        setHourlyStats(res.stats);
      } catch (err) { console.error(err); }
      finally { setChartLoading(false); }
    })();
  }, [selectedJunction]);

  const formatJunctionName = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');

  return (
    <div className="space-y-6">
      <LiveNowPanel />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total violations analysed" value="298,450" animateValue={298450} subtitle="Collected across 5 months" badge="100% GPS coverage" badgeTone="info" icon={Car} />
        <StatCard title="Top hotspot zone" value="Safina Plaza" animateValue={8785} animateSuffix=" violations" subtitle="5.2% of all violations citywide" badge="Critical zone" badgeTone="critical" icon={AlertOctagon} />
        <StatCard title="Peak violation hours" value="02:00–06:00" subtitle="Night commercial · 19:00–23:00 secondary" badge="Active window" badgeTone="amber" icon={Clock} />
        <StatCard title="Event amplification" value="+35%" animateValue={35} animatePrefix="+" animateSuffix="%" subtitle="During public rallies / festivals" badge="Predictive pre-deployment" badgeTone="healthy" icon={TrendingUp} />
      </div>

      {/* Hotspots + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-navy-900 border border-edge rounded p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Top hotspots</h3>
            <p className="text-[12px] text-ink-3 mt-0.5">Select a junction to chart its hourly pattern</p>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-7 h-7 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto -mr-2 pr-2 flex flex-col">
              {hotspots.map((item, idx) => {
                const isSelected = selectedJunction === item.junction_name;
                const count = item.total_violations || item.violation_count || 0;
                return (
                  <button key={idx} onClick={() => setSelectedJunction(item.junction_name)}
                    className={`w-full text-left px-3 py-2.5 rounded flex items-center justify-between transition-colors cursor-pointer border-l-2 ${isSelected ? 'bg-navy-800 border-amber' : 'border-transparent hover:bg-navy-800'}`}>
                    <div className="truncate pr-3">
                      <p className={`text-[13px] truncate font-medium ${isSelected ? 'text-ink' : 'text-ink-2'}`}>{formatJunctionName(item.junction_name)}</p>
                      <p className="font-mono text-[11px] text-ink-3 mt-0.5">{item.top_vehicle || 'SCOOTER'} · peak {String(item.peak_hour).padStart(2, '0')}:00</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`font-mono text-[13px] font-medium ${count > 800 ? 'text-crit' : 'text-amber'}`}>{count.toLocaleString()}</span>
                      <ChevronRight className="w-4 h-4 text-ink-3" strokeWidth={2} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 relative">
          {chartLoading && (
            <div className="absolute inset-0 bg-navy-950/50 z-10 flex items-center justify-center rounded">
              <div className="w-7 h-7 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <ViolationChart data={hourlyStats} junctionName={selectedJunction} />
        </div>
      </div>

      {/* System modules */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">System modules</h2>
          <div className="flex-1 h-px bg-edge" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAPABILITIES.map((cap) => (
            <Link key={cap.href + cap.title} href={cap.href}
              className="group flex flex-col gap-3 p-5 bg-navy-900 border border-edge rounded transition-colors hover:border-edge-strong">
              <div className="flex items-start justify-between gap-3">
                <cap.icon className="w-4 h-4 text-ink-3" strokeWidth={2} />
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3">{cap.tag}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-[15px] font-display font-semibold text-ink">{cap.title}</h3>
                <p className="text-[13px] text-ink-2 leading-relaxed">{cap.description}</p>
              </div>
              <div className="flex items-end justify-between pt-3 mt-auto border-t border-edge">
                <div>
                  <p className="font-mono text-[18px] font-medium text-amber">{cap.metric}</p>
                  <p className="text-[11px] text-ink-3">{cap.metricSub}</p>
                </div>
                <span className="flex items-center gap-1 text-[12px] font-medium text-amber">
                  Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
