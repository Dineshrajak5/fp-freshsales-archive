"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { GlobalSearch } from "./global-search";

const NAV = [
  { href: "/colleges", label: "Colleges" },
  { href: "/contacts", label: "Contacts" },
  { href: "/deals", label: "Deals" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-navy sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
          <span className="w-6 h-6 rounded-md bg-coral flex items-center justify-center text-white text-[13px] font-bold">
            F
          </span>
          <span className="text-white font-bold text-[15px] tracking-tight">
            FACE Prep <span className="text-coral font-semibold">Archive</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-5 text-[13px] font-semibold h-full">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-full flex items-center border-b-2 transition ${
                  active
                    ? "text-white border-coral"
                    : "text-[#a7b0c0] border-transparent hover:text-white"
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
