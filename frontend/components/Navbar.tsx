'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Map, Calendar, Zap } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/heatmap', label: 'Live Heatmap', icon: Map },
    { href: '/enforcement', label: 'Enforcement Plan', icon: Calendar },
    { href: '/simulate', label: 'What-If Simulator', icon: Zap },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600/10 p-2 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Shield className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            ParkGuard
          </span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            AI Engine
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
