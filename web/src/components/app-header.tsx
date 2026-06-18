"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { GlobalSearch } from "./global-search";
import { CoBrandLockup } from "./cobrand-lockup";

const NAV = [
  { href: "/colleges", label: "Colleges" },
  { href: "/contacts", label: "Contacts" },
  { href: "/deals", label: "Deals" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-navy sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center bg-white rounded-lg px-3 py-1.5 shrink-0"
        >
          <CoBrandLockup height={22} />
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-[13px] font-semibold">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 transition ${
                  active
                    ? "bg-coral text-white"
                    : "text-[#9aa3b2] hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <GlobalSearch />
        <SignOutButton />
      </div>
    </header>
  );
}
