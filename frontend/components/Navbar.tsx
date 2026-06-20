'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Map, Calendar, Zap } from 'lucide-react';

const links = [
  { href: '/',            label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/heatmap',     label: 'Live heatmap',  icon: Map             },
  { href: '/enforcement', label: 'Enforcement',   icon: Calendar        },
  { href: '/simulate',    label: 'Simulator',     icon: Zap             },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 h-14 bg-navy-900 border-b border-edge">
      <div className="h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-amber" strokeWidth={2} />
          <span className="text-[17px] font-display font-semibold tracking-tight text-ink">ParkGuard</span>
          <span className="hidden sm:inline font-mono text-[10px] text-ink-3 border-l border-edge pl-2.5">BTP / OPS</span>
        </Link>
        <div className="flex items-stretch h-full">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={`relative flex items-center gap-2 px-3 sm:px-4 text-[13px] font-medium transition-colors border-b-2 ${
                  isActive ? 'text-amber border-amber' : 'text-ink-2 border-transparent hover:text-ink'
                }`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
