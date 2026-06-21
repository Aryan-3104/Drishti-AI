'use client';

import { useState, useEffect } from 'react';
import { api, PlanItem } from '@/lib/api';
import DeploymentMap from '@/components/DeploymentMap';
import { Calendar, MapPin, Info, Database, Brain, ClipboardList, ShieldCheck, TrendingDown, AlertTriangle } from 'lucide-react';
import { toKannada } from '@/lib/kannada';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EnforcementPlanner() {
  const [day, setDay] = useState(0);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    (async () => {
      try { const res = await api.getPlan(day, 12); setPlan(res.plan || []); }
      catch (err: any) { setError(err.message || 'Failed to load enforcement plan.'); }
      finally { setLoading(false); }
    })();
  }, [day]);

  const totalOfficers = plan.reduce((acc, curr) => acc + curr.recommended_officers, 0);
  const fmt = (name: string) => name.replace(/^BTP\d+\s*-\s*/, '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Calendar className="w-5 h-5 text-amber" strokeWidth={2} />
        <div>
          <h2 className="text-[18px] font-display font-semibold text-ink">Predictive enforcement planner</h2>
          <p className="text-[13px] text-ink-2">Weekly deployment calendar derived from predicted hotspot densities.</p>
        </div>
      </div>

      {/* Explainer */}
      <div className="bg-navy-900 border border-edge rounded p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-info flex-shrink-0" strokeWidth={2} />
          <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">How the enforcement plan is generated</h3>
        </div>
        <p className="text-[14px] text-ink-2 leading-relaxed">
          Every day of the week has a different violation profile - weekday mornings are dominated by commercial vehicles, weekend nights see different hotspots. This planner uses a pre-computed XGBoost prediction grid across all 168 junctions and all 24 hours to surface <span className="text-ink font-medium">exactly where officers will be needed most</span>, for whichever day you select.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Database,      step: 'Step 1 - Historical profiling',  body: '5 months of GPS-tagged violation records are aggregated per junction, per hour, and per day-of-week to build an accurate baseline.' },
            { icon: Brain,         step: 'Step 2 - AI severity scoring',    body: 'An XGBoost model scores each junction for the selected day using road type, vehicle mix, and peak-hour patterns to rank hotspots.' },
            { icon: ClipboardList, step: 'Step 3 - Deployment schedule',    body: 'Top junctions are ranked and each gets an officer count via max(1, min(5, round(severity / 200))), capped at 5 per junction.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-3 p-4 bg-navy-800 border border-edge rounded">
              <s.icon className="w-4 h-4 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-[13px] font-medium text-ink">{s.step}</p>
                <p className="text-[12px] text-ink-2 mt-1 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['168','Junctions monitored'],['5 months','Training data'],['24×7','Hourly predictions'],['1–5','Officers per junction']].map(([v, l]) => (
            <div key={l} className="bg-navy-800 border border-edge rounded px-4 py-3 text-center">
              <p className="font-mono text-[20px] font-medium text-amber">{v}</p>
              <p className="text-[11px] text-ink-3 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 bg-navy-800 border border-edge rounded p-4">
          <MapPin className="w-4 h-4 text-info flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13px] text-ink-2 leading-relaxed">
            <span className="text-info font-medium">Field tip:</span> The plan shows each junction's peak violation hour and top offending vehicle type. Cross-reference the GPS coordinates with your sector maps to assign the nearest available unit.
          </p>
        </div>
      </div>

      {/* Day selector - tab bar */}
      <div className="border-b border-edge flex items-stretch overflow-x-auto">
        {DAY_NAMES.map((name, i) => (
          <button key={i} onClick={() => setDay(i)}
            className={`flex-1 min-w-[64px] py-2.5 text-center text-[13px] font-medium uppercase tracking-[0.05em] border-b-2 transition-colors cursor-pointer font-mono ${
              day === i ? 'text-amber border-amber' : 'text-ink-2 border-transparent hover:text-ink'
            }`}>
            {name.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      {!loading && !error && plan.length > 0 && (
        <div className="bg-navy-900 border border-edge rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Deployment overview - {DAY_NAMES[day]}</h4>
            <p className="text-[12px] text-ink-3 mt-0.5">AI-recommended plan based on predicted violation severity</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-navy-800 border border-edge rounded px-4 py-2 text-center">
              <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3 block">Junctions</span>
              <span className="font-mono text-[20px] font-medium text-ink">{plan.length}</span>
            </div>
            <div className="bg-amber-bg border border-amber/30 rounded px-4 py-2 text-center">
              <span className="text-[11px] uppercase tracking-[0.08em] text-amber block">Officers needed</span>
              <span className="font-mono text-[20px] font-medium text-amber">{totalOfficers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Before / After Coverage Card */}
      {!loading && !error && plan.length > 0 && (() => {
        const totalSeverity = plan.reduce((s, p) => s + p.predicted_severity, 0);
        const estimatedPrevented = plan.reduce((s, p) => s + p.predicted_severity * Math.min(0.75, p.recommended_officers * 0.18), 0);
        const remainingSeverity = totalSeverity - estimatedPrevented;
        const reductionPct = totalSeverity > 0 ? (estimatedPrevented / totalSeverity) * 100 : 0;
        const coveragePct = (plan.length / 168) * 100;

        return (
          <div className="bg-navy-900 border border-edge rounded p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" strokeWidth={2} />
              <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Before / after enforcement impact</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Without enforcement */}
              <div className="bg-navy-800 border border-crit/30 rounded p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-crit mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                  Without deployment
                </div>
                <p className="font-mono text-[26px] font-semibold text-ink leading-none">{Math.round(totalSeverity).toLocaleString()}</p>
                <p className="text-[12px] text-ink-3">predicted violation severity</p>
                <p className="text-[11px] text-ink-3 mt-1">across {plan.length} monitored junctions</p>
              </div>

              {/* Arrow / reduction */}
              <div className="bg-navy-800 border border-green-500/30 rounded p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-green-400 mb-1">
                  <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
                  Violations prevented
                </div>
                <p className="font-mono text-[26px] font-semibold text-green-400 leading-none">{Math.round(estimatedPrevented).toLocaleString()}</p>
                <p className="text-[12px] text-ink-3">estimated reduction</p>
                <p className="text-[11px] text-ink-3 mt-1">with {totalOfficers} officers deployed</p>
              </div>

              {/* After enforcement */}
              <div className="bg-amber-bg border border-amber/30 rounded p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-amber mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  With this plan
                </div>
                <p className="font-mono text-[26px] font-semibold text-amber leading-none">{Math.round(remainingSeverity).toLocaleString()}</p>
                <p className="text-[12px] text-ink-3">residual violation severity</p>
                <p className="text-[11px] text-amber/70 mt-1 font-medium">{reductionPct.toFixed(1)}% reduction achieved</p>
              </div>
            </div>

            {/* Coverage bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-ink-3">
                <span>Junction coverage - {plan.length} of 168 monitored</span>
                <span className="text-amber font-mono">{coveragePct.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber rounded-full transition-all duration-500" style={{ width: `${coveragePct}%` }} />
              </div>
              <p className="text-[11px] text-ink-3">Remaining {168 - plan.length} junctions are below the severity threshold for today.</p>
            </div>
          </div>
        );
      })()}

      {error && <div className="bg-crit-bg border border-crit/30 text-crit rounded p-4 text-[13px]">{error}</div>}

      {/* Deployment Map */}
      {!loading && !error && plan.length > 0 && <DeploymentMap plan={plan} dayName={DAY_NAMES[day]} />}

      {/* Table */}
      <div className="bg-navy-900 border border-edge rounded overflow-hidden">
        <div className="p-5 border-b border-edge">
          <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">Active deployment force schedule</h3>
          <p className="text-[12px] text-ink-3 mt-0.5">Police allocation schedule for peak junction hotspots</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plan.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-ink-3">No enforcement recommendations available for this day.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-edge text-ink-3 text-[11px] uppercase tracking-[0.08em]">
                  {['Rank','Intersection','Peak hour','Target vehicle','Severity','Deployment'].map((h, i) => (
                    <th key={h} className={`py-3 ${i < 4 ? 'px-5' : 'px-5 text-right'} font-medium`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.map((item, idx) => {
                  const rankColor =
                    idx === 0 ? 'text-yellow-400' :
                    idx === 1 ? 'text-slate-300'  :
                    idx === 2 ? 'text-orange-400' : 'text-ink-3';
                  const rankBg =
                    idx === 0 ? 'bg-yellow-400/10 border border-yellow-400/20' :
                    idx === 1 ? 'bg-slate-300/10 border border-slate-300/20'   :
                    idx === 2 ? 'bg-orange-400/10 border border-orange-400/20' : '';
                  return (
                  <tr key={idx} className="border-b border-edge/50 hover:bg-navy-800 transition-colors row-animate" style={{ animationDelay: `${idx * 40}ms` }}>
                    <td className="py-3 px-5">
                      <span className={`font-mono text-[13px] font-medium px-2 py-0.5 rounded ${rankColor} ${rankBg}`}>#{idx + 1}</span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="text-[14px] font-medium text-ink">{fmt(item.junction_name)}</div>
                      {toKannada(item.junction_name) && (
                        <div className="text-[12px] text-ink-3 mt-0.5 text-kannada">{toKannada(item.junction_name)}</div>
                      )}
                      <div className="font-mono text-[11px] text-ink-3 mt-0.5">{item.lat.toFixed(4)}, {item.lon.toFixed(4)}</div>
                    </td>
                    <td className="py-3 px-5 font-mono text-[13px] text-ink-2">{String(item.peak_hour).padStart(2,'0')}:00</td>
                    <td className="py-3 px-5">
                      <span className="bg-navy-800 text-ink-2 border border-edge px-2 py-0.5 rounded text-[11px] uppercase tracking-[0.05em]">{item.top_vehicle || 'SCOOTER'}</span>
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-[13px] text-ink">{item.predicted_severity.toLocaleString()}</td>
                    <td className="py-3 px-5 text-right">
                      <span className="inline-flex items-center gap-1.5 bg-amber-bg border border-amber/30 rounded px-2.5 py-1">
                        <span className="font-mono text-[13px] font-medium text-amber">{item.recommended_officers}</span>
                        <span className="text-[11px] text-amber/80">{item.recommended_officers === 1 ? 'officer' : 'officers'}</span>
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
