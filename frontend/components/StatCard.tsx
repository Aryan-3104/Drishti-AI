import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'red' | 'blue' | 'purple' | 'orange' | 'green';
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  icon: Icon,
  variant = 'blue',
}: StatCardProps) {
  const gradients = {
    red: 'from-emerald-500/10 to-emerald-600/5 hover:border-emerald-500/30 border-emerald-500/10 text-emerald-400',
    blue: 'from-blue-500/10 to-blue-600/5 hover:border-blue-500/30 border-blue-500/10 text-blue-400',
    purple: 'from-purple-500/10 to-purple-600/5 hover:border-purple-500/30 border-purple-500/10 text-purple-400',
    orange: 'from-orange-500/10 to-orange-600/5 hover:border-orange-500/30 border-orange-500/10 text-orange-400',
    green: 'from-green-500/10 to-green-600/5 hover:border-green-500/30 border-green-500/10 text-green-400',
  };

  const glowCircles = {
    red: 'bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-500',
    blue: 'bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-500',
    purple: 'bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-500',
    orange: 'bg-orange-500/10 group-hover:bg-orange-500/20 text-orange-500',
    green: 'bg-green-500/10 group-hover:bg-green-500/20 text-green-500',
  };

  return (
    <div className={`group relative rounded-2xl bg-gradient-to-br ${gradients[variant]} border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold tracking-tight text-white">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl transition-colors duration-300 ${glowCircles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendType === 'positive'
                ? 'bg-green-500/10 text-green-400 border border-green-500/10'
                : trendType === 'negative'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                : 'bg-slate-500/10 text-slate-400 border border-slate-700/50'
            }`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
