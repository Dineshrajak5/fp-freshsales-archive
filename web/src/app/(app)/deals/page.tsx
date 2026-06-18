import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ q?: string; stage?: string; page?: string }>;

const STAGES = ["Won", "Lost", "Open", "Negotiation", "Proposal", "Qualified"];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const stage = params.stage?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select(
      "id, opportunity_title, opportunity_stage, net_bv_value, closed_date, expected_close_date_of_the_deal, client_name, client_name_id, owner, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`opportunity_title.ilike.%${q}%,client_name.ilike.%${q}%`);
  }
  if (stage) {
    query = query.eq("opportunity_stage", stage);
  }

  const { data: deals, count, error } = await query;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-red-600">Error loading deals: {error.message}</p>
      </div>
    );
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged = { ...(q ? { q } : {}), ...(stage ? { stage } : {}), ...overrides };
    const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v));
    return `/deals?${new URLSearchParams(clean as Record<string, string>)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Deals</h1>
        <div className="text-sm text-gray-500">
          {count?.toLocaleString()} {count === 1 ? "result" : "results"}
        </div>
      </div>

      <form className="mb-4 flex flex-col sm:flex-row gap-2" action="/deals">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search title or college..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="stage"
          defaultValue={stage}
          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Apply
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">College</th>
              <th className="px-4 py-2 font-medium">Stage</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Value</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">Closed</th>
            </tr>
          </thead>
          <tbody>
            {deals?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No deals found.
                </td>
              </tr>
            ) : (
              deals?.map((d) => (
                <tr key={d.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/deals/${d.id}`} className="text-blue-600 hover:underline font-medium">
                      {d.opportunity_title || "(untitled)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden lg:table-cell">
                    {d.client_name_id ? (
                      <Link href={`/colleges/${d.client_name_id}`} className="text-blue-600 hover:underline">
                        {d.client_name || "-"}
                      </Link>
                    ) : (
                      d.client_name || "-"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{d.opportunity_stage || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{formatMoney(d.net_bv_value)}</td>
                  <td className="px-4 py-2.5 text-gray-600 hidden lg:table-cell">
                    {d.closed_date ? formatDate(d.closed_date) : "-"}
                  </td>
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
              <Link href={buildHref({ page: String(page - 1) })} className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildHref({ page: String(page + 1) })} className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}