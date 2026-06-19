import SimulatorForm from '@/components/SimulatorForm';
import { Zap } from 'lucide-react';

export default function SimulatePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-emerald-500">
          <Zap className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-tight text-white">What-If Event Simulator</h2>
        </div>
        <p className="text-sm text-slate-400">
          Evaluate expected violation spikes and determine police deployment requirements for scheduled events (festivals, VIP transits, road works).
        </p>
      </div>

      <SimulatorForm />
    </div>
  );
}
