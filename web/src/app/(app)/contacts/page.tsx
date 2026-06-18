import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search } from "lucide-react";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("id, first_name, full_name, disignation, mobile, account, account_id", { count: "exact" })
    .order("full_name", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,first_name.ilike.%${q}%,account.ilike.%${q}%`);
  }

  const { data: contacts, count, error } = await query;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-red-600">Error loading contacts: {error.message}</p>
      </div>
    );
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold text-ink">Contacts</h1>
        <div className="text-sm text-gray-500">
          {count?.toLocaleString()} {count === 1 ? "result" : "results"}
        </div>
      </div>

      <form className="mb-4" action="/contacts">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or college..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
      </form>

      <div className="bg-surface border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line-soft border-b border-line">
            <tr className="text-left text-[11px] tracking-wide text-ink-soft uppercase">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Designation</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">College</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Mobile</th>
            </tr>
          </thead>
          <tbody>
            {contacts?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No contacts found{q ? ` for "${q}"` : ""}.
                </td>
              </tr>
            ) : (
              contacts?.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0 hover:bg-coral-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/contacts/${c.id}`} className="text-coral-600 hover:underline font-medium">
                      {[c.first_name, c.full_name].filter(Boolean).join(" ") || "(unnamed)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{c.disignation || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-600 hidden lg:table-cell">
                    {c.account_id ? (
                      <Link href={`/colleges/${c.account_id}`} className="text-coral-600 hover:underline">
                        {c.account || "-"}
                      </Link>
                    ) : (
                      c.account || "-"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{c.mobile || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/contacts?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
                className="px-3 py-1.5 border rounded-md bg-surface hover:bg-coral-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/contacts?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
                className="px-3 py-1.5 border rounded-md bg-surface hover:bg-coral-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}