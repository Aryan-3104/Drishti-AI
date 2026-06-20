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
    <nav className="sticky top-0 z-[1050] h-14 bg-navy-900 border-b border-edge" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)', zIndex: 1050 }}>
      <div className="h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-amber flex-shrink-0" strokeWidth={2} />
          <span className="font-display text-[18px] font-semibold tracking-tight text-ink">Drishti AI</span>
          <span className="hidden sm:inline font-mono text-[10px] text-ink-3 border-l border-edge pl-2.5 ml-0.5">BTP / OPS</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-stretch h-full">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 text-[13px] font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'text-amber border-amber'
                    : 'text-ink-2 border-transparent hover:text-info'
                }`}
              >
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
