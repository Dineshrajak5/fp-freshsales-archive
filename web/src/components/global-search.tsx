"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Building2, User, Briefcase, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Result = {
  kind: "college" | "contact" | "deal";
  id: string;
  title: string;
  subtitle?: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const supabase = createClient();
      const [collegesRes, contactsRes, dealsRes] = await Promise.all([
        supabase
          .from("accounts")
          .select("id, college_name, city, state")
          .ilike("college_name", `%${q}%`)
          .limit(5),
        supabase
          .from("contacts")
          .select("id, first_name, full_name, disignation, account")
          .or(`full_name.ilike.%${q}%,first_name.ilike.%${q}%`)
          .limit(5),
        supabase
          .from("opportunities")
          .select("id, opportunity_title, client_name, opportunity_stage")
          .ilike("opportunity_title", `%${q}%`)
          .limit(5),
      ]);

      const merged: Result[] = [
        ...(collegesRes.data ?? []).map((c) => ({
          kind: "college" as const,
          id: c.id,
          title: c.college_name || "(unnamed)",
          subtitle: [c.city, c.state].filter(Boolean).join(", "),
        })),
        ...(contactsRes.data ?? []).map((c) => ({
          kind: "contact" as const,
          id: c.id,
          title: [c.first_name, c.full_name].filter(Boolean).join(" ") || "(unnamed)",
          subtitle: [c.disignation, c.account].filter(Boolean).join(" - "),
        })),
        ...(dealsRes.data ?? []).map((d) => ({
          kind: "deal" as const,
          id: d.id,
          title: d.opportunity_title || "(untitled)",
          subtitle: [d.client_name, d.opportunity_stage].filter(Boolean).join(" - "),
        })),
      ];

      setResults(merged);
      setLoading(false);
    }, 250);

    return () => clearTimeout(handle);
  }, [query]);

  const iconFor = (kind: Result["kind"]) => {
    if (kind === "college") return <Building2 className="w-3.5 h-3.5 text-blue-500" />;
    if (kind === "contact") return <User className="w-3.5 h-3.5 text-purple-500" />;
    return <Briefcase className="w-3.5 h-3.5 text-emerald-500" />;
  };

  const hrefFor = (r: Result) => {
    if (r.kind === "college") return `/colleges/${r.id}`;
    if (r.kind === "contact") return `/contacts/${r.id}`;
    return `/deals/${r.id}`;
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/colleges?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search colleges, contacts, deals..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
          )}
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">No results.</div>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={hrefFor(r)}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="mt-0.5">{iconFor(r.kind)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-900 truncate">{r.title}</div>
                      {r.subtitle && (
                        <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">{r.kind}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}