'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, Hotspot, HourlyStat, CongestionSummary } from '@/lib/api';
import StatCard from '@/components/StatCard';
import ViolationChart from '@/components/ViolationChart';
import LiveNowPanel from '@/components/LiveNowPanel';
import PredictionConsole from '@/components/PredictionConsole';
import { Car, AlertOctagon, Clock, ChevronRight, Map, Calendar, Zap, Brain, ArrowRight, Eye, Target, Activity, Users, Gauge } from 'lucide-react';
import { toKannada } from '@/lib/kannada';

const CAPABILITIES = [
  { href: '/heatmap',     icon: Map,      tag: 'Spatial intelligence',    title: 'Live junction heatmap',       description: 'All 168 monitored junctions plotted on an interactive map. Scrub the hour slider to watch enforcement pressure shift across the city.',                                                                              metric: '168',      metricSub: 'junctions mapped' },
  { href: '/enforcement', icon: Calendar, tag: 'Predictive deployment',   title: 'Weekly enforcement planner',  description: 'An XGBoost model scores every junction across every hour of every weekday to produce a ranked deployment calendar with precise officer-count recommendations.',                                                   metric: '24×7×168', metricSub: 'pre-computed scores' },
  { href: '/simulate',    icon: Zap,      tag: 'Scenario engine',          title: 'Event impact simulator',      description: 'Model a festival, VIP transit, protest or road works and see where violations will spike, plus how many officers to pre-position before the event begins.',                                                   metric: '1.35×',    metricSub: 'peak festival multiplier' },
  { href: '/enforcement', icon: Brain,    tag: 'Machine learning core',    title: 'XGBoost prediction engine',  description: 'Trained on 298,450 GPS-tagged violations over 5 months, learning road type, vehicle mix, and peak-hour patterns to output severity scores and deployment counts.', metric: '298,450',  metricSub: 'violations in training set' },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export default function Dashboard() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedJunction, setSelectedJunction] = useState('BTP051 - Safina Plaza Junction');
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [congestionSummary, setCongestionSummary] = useState<CongestionSummary | null>(null);
  const aboutReveal = useReveal();
  const modulesReveal = useReveal();

  useEffect(() => {
    (async () => {
      try {
        const [hotspotsRes, congestionRes] = await Promise.all([
          api.getHotspots(undefined, 10),
          api.getCongestionSummary().catch(() => null),
        ]);
        setHotspots(hotspotsRes.hotspots);
        if (hotspotsRes.hotspots.length > 0) setSelectedJunction(hotspotsRes.hotspots[0].junction_name);
        if (congestionRes) setCongestionSummary(congestionRes);
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
        <div className="animate-diverge-left" style={{ animationDelay: '0ms' }}>
          <StatCard title="Total violations analysed" value="298,450" animateValue={298450} subtitle="Collected across 5 months" badge="100% GPS coverage" badgeTone="info" icon={Car} />
        </div>
        <div className="animate-diverge-up" style={{ animationDelay: '75ms' }}>
          <StatCard title="Top hotspot zone" value="Safina Plaza" animateValue={8785} animateSuffix=" violations" subtitle="5.2% of all violations citywide" badge="Critical zone" badgeTone="critical" icon={AlertOctagon} />
        </div>
        <div className="animate-diverge-up" style={{ animationDelay: '150ms' }}>
          <StatCard title="Peak violation hours" value="02:00-06:00" subtitle="Night commercial · 19:00-23:00 secondary" badge="Active window" badgeTone="amber" icon={Clock} />
        </div>
        <div className="animate-diverge-right" style={{ animationDelay: '225ms' }}>
          <StatCard
            title="Vehicle-hours lost per year"
            value={congestionSummary ? (congestionSummary.daily_vehicle_hours_lost * 365).toLocaleString() : '—'}
            animateValue={congestionSummary ? congestionSummary.daily_vehicle_hours_lost * 365 : undefined}
            subtitle={congestionSummary ? `~${congestionSummary.daily_vehicle_hours_lost} daily · parking-induced carriageway blockage` : 'To parking-induced carriageway blockage'}
            badge="Quantified congestion cost"
            badgeTone="critical"
            icon={Gauge}
            highlightBorder
          />
        </div>
      </div>

      {/* Live prediction console - real XGBoost inference + historical CSV */}
      <div className="animate-diverge-down" style={{ animationDelay: '300ms' }}>
        <PredictionConsole />
      </div>

      {/* Hotspots + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-navy-900 border border-edge rounded p-5 flex flex-col gap-3 animate-diverge-left" style={{ animationDelay: '375ms' }}>
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
                    className={`w-full text-left px-3 py-2.5 rounded flex items-center justify-between transition-colors cursor-pointer border-l-2 ${isSelected ? 'bg-navy-800 border-amber' : 'border-transparent hover:bg-navy-800'} ${idx === 0 ? 'hotspot-glow' : ''}`}>
                    <div className="truncate pr-3">
                      <p className={`text-[13px] truncate font-medium ${isSelected ? 'text-ink' : 'text-ink-2'}`}>{formatJunctionName(item.junction_name)}</p>
                      {toKannada(item.junction_name) && (
                        <p className="text-[11px] text-ink-3 truncate text-kannada">{toKannada(item.junction_name)}</p>
                      )}
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

        <div className="lg:col-span-2 relative animate-diverge-right" style={{ animationDelay: '375ms' }}>
          {chartLoading && (
            <div className="absolute inset-0 bg-navy-950/50 z-10 flex items-center justify-center rounded">
              <div className="w-7 h-7 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <ViolationChart data={hourlyStats} junctionName={selectedJunction} />
        </div>
      </div>

      {/* About Drishti AI */}
      <div ref={aboutReveal.ref} className={`space-y-3 ${aboutReveal.visible ? 'section-reveal' : 'section-reveal-hidden'}`}>
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">About Drishti AI</h2>
          <div className="flex-1 h-px bg-edge" />
        </div>

        <div className="bg-navy-900 border border-edge rounded p-6 md:p-8 space-y-8">
          {/* Hero blurb */}
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber flex-shrink-0" strokeWidth={2} />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber">What is Drishti AI?</span>
            </div>
            <h3 className="font-display text-[22px] md:text-[26px] font-semibold text-ink leading-snug">
              Turning five months of Bengaluru traffic data into<br className="hidden md:block" /> deployable enforcement intelligence
            </h3>
            <p className="text-[14px] text-ink-2 leading-relaxed">
              Drishti AI - <em className="text-ink not-italic font-medium">drishti</em> (दृष्टि) means <em className="text-ink not-italic font-medium">vision</em> in Sanskrit - is an AI-powered decision support system built for the Bengaluru Traffic Police. It transforms a raw archive of 298,450 GPS-tagged parking violations into a live, predictive intelligence layer: telling commanders exactly where to send officers, when, and how many - before violations happen, not after.
            </p>
          </div>

          {/* The problem / solution split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-navy-800 border border-crit/20 rounded p-5 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.08em] text-crit font-medium">The problem</p>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                Parking enforcement in Bengaluru has historically been <span className="text-ink">reactive</span>. Officers are dispatched to junctions where violations were reported yesterday, not where the model predicts they will be heaviest tomorrow morning at 3 AM. The result: overcrowded hotspots go unpatrolled during critical windows while officers wait at quiet intersections.
              </p>
            </div>
            <div className="bg-navy-800 border border-green-500/20 rounded p-5 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.08em] text-green-400 font-medium">The Drishti AI solution</p>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                An XGBoost model trained on 5 months of violation records learns the road type, vehicle mix, and hourly rhythm of all 168 monitored junctions. It pre-computes a 24 × 7 severity grid so that any day-and-hour combination instantly yields a ranked deployment schedule with <span className="text-ink">precise officer-count recommendations</span> - ready before a shift briefing begins.
              </p>
            </div>
          </div>

          {/* Three pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Target,
                title: 'Predictive deployment',
                body: 'Every junction is scored for every hour of the week. The weekly planner surfaces the top 12 junctions per day and tells you exactly how many officers each needs - no guesswork.',
              },
              {
                icon: Activity,
                title: 'Event scenario modelling',
                body: 'Public events, VIP movements, protests, and construction zones each carry a learned violation multiplier. The simulator shows how severity spikes and where to pre-position forces before an event starts.',
              },
              {
                icon: Users,
                title: 'Command-ready output',
                body: 'Every view - heatmap, planner, simulator - is designed to be read in a shift briefing, not a data-science meeting. Numbers are officer counts and junction names, not raw model scores.',
              },
            ].map((pillar) => (
              <div key={pillar.title} className="flex flex-col gap-3 p-5 bg-navy-800 border border-edge rounded interactive-card">
                <pillar.icon className="w-4 h-4 text-amber" strokeWidth={2} />
                <div className="space-y-1.5">
                  <p className="text-[14px] font-semibold text-ink">{pillar.title}</p>
                  <p className="text-[13px] text-ink-2 leading-relaxed">{pillar.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data provenance footer */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 border-t border-edge text-[12px] text-ink-3">
            <span><span className="text-ink font-medium">298,450</span> violations · 5 months of Bengaluru data</span>
            <span><span className="text-ink font-medium">168</span> junctions across the city</span>
            <span><span className="text-ink font-medium">XGBoost</span> severity model · joblib-served via FastAPI</span>
            <span><span className="text-ink font-medium">Flipkart Gridlock Hackathon 2.0</span> · Team submission</span>
          </div>
        </div>
      </div>

      {/* System modules */}
      <div ref={modulesReveal.ref} className="space-y-3">
        <div className={`flex items-center gap-3 ${modulesReveal.visible ? 'section-reveal' : 'section-reveal-hidden'}`}>
          <h2 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">System modules</h2>
          <div className="flex-1 h-px bg-edge" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAPABILITIES.map((cap, i) => (
            <Link key={cap.href + cap.title} href={cap.href}
              className="group flex flex-col gap-3 p-5 bg-navy-900 border border-edge rounded interactive-card"
              style={modulesReveal.visible ? { animation: `sectionReveal 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` } : { opacity: 0 }}>
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
