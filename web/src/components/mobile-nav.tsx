"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Briefcase } from "lucide-react";

const NAV = [
  { href: "/colleges", label: "Colleges", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/deals", label: "Deals", icon: Briefcase },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
              active ? "text-coral" : "text-ink-muted"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
