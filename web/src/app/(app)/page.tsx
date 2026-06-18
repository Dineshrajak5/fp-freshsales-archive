import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Building2, Users, Briefcase } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: accountCount }, { count: contactCount }, { count: dealCount }] =
    await Promise.all([
      supabase.from("accounts").select("*", { count: "exact", head: true }),
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("opportunities").select("*", { count: "exact", head: true }),
    ]);

  const tiles = [
    {
      href: "/colleges",
      label: "Colleges",
      count: accountCount,
      icon: Building2,
    },
    {
      href: "/contacts",
      label: "Contacts",
      count: contactCount,
      icon: Users,
    },
    {
      href: "/deals",
      label: "Deals",
      count: dealCount,
      icon: Briefcase,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Archive overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Signed in as {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="bg-surface rounded-lg border border-line p-6 hover:border-coral hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink-muted">{tile.label}</div>
                <Icon className="w-4 h-4 text-coral" />
              </div>
              <div className="text-3xl font-bold text-ink mt-2">
                {tile.count?.toLocaleString()}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-gray-400 mt-8">
        Click a tile to start browsing.
      </p>
    </div>
  );
}