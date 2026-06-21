import SimulatorForm from '@/components/SimulatorForm';
import { Zap, Brain, TrendingUp, Shield, AlertTriangle, Info } from 'lucide-react';

export default function SimulatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Zap className="w-5 h-5 text-amber" strokeWidth={2} />
        <div>
          <h2 className="text-[18px] font-display font-semibold text-ink">What-if event simulator</h2>
          <p className="text-[13px] text-ink-2">Evaluate expected violation spikes and deployment requirements for scheduled events.</p>
        </div>
      </div>

      {/* Explainer */}
      <div className="bg-navy-900 border border-edge rounded p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-info flex-shrink-0" strokeWidth={2} />
          <h3 className="text-[13px] uppercase tracking-[0.05em] text-ink-2">How this simulator works</h3>
        </div>
        <p className="text-[14px] text-ink-2 leading-relaxed">
          Real-world events - festivals, VIP movements, protests, road works - cause parking violations to spike beyond their normal baseline. This simulator predicts <span className="text-ink font-medium">where that pressure will hit hardest</span> and tells you exactly how many officers to deploy there, before the event happens.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Brain,      step: 'Step 1 - Baseline prediction',     body: 'The XGBoost model predicts normal violation severity at every junction for your chosen day and hour, using 5 months of historical data.' },
            { icon: TrendingUp, step: 'Step 2 - Multiplier applied',       body: 'A calibrated spike multiplier (e.g. 1.35× for festivals) is applied to every junction\'s baseline, simulating the event\'s congestion impact.' },
            { icon: Shield,     step: 'Step 3 - Deployment recommended',   body: 'The top N affected junctions are ranked and each gets an officer count so teams can be pre-positioned before the event starts.' },
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

        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-2">Event spike multipliers</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: 'No event',    m: '1.00×' },
              { label: 'Festival',    m: '1.35×' },
              { label: 'Procession',  m: '1.28×' },
              { label: 'VIP transit', m: '1.20×' },
              { label: 'Protest',     m: '1.15×' },
              { label: 'Road works',  m: '1.10×' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center py-2 px-2 rounded border border-edge bg-navy-800 text-center">
                <span className="font-mono text-[15px] font-medium text-amber">{item.m}</span>
                <span className="text-[11px] text-ink-3 mt-0.5">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 bg-navy-800 border border-edge rounded p-4">
          <AlertTriangle className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13px] text-ink-2 leading-relaxed">
            <span className="text-amber font-medium">Pre-deployment tip:</span> Run the simulation at least 2-3 hours before an event starts. The model is most accurate for known scheduled events (concerts, state visits, religious processions) where similar historical patterns exist in the training data.
          </p>
        </div>
      </div>

      <SimulatorForm />
    </div>
  );
}
