import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search } from "lucide-react";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function CollegesPage({
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
    .from("accounts")
    .select("id, college_name, city, state, territory", { count: "exact" })
    .order("college_name", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.ilike("college_name", `%${q}%`);
  }

  const { data: colleges, count, error } = await query;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-red-600">Error loading colleges: {error.message}</p>
      </div>
    );
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Colleges</h1>
        <div className="text-sm text-gray-500">
          {count?.toLocaleString()} {count === 1 ? "result" : "results"}
        </div>
      </div>

      <form className="mb-4" action="/colleges">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by college name..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-2 font-medium">College</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">City</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">State</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">Territory</th>
            </tr>
          </thead>
          <tbody>
            {colleges?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No colleges found{q ? ` for "${q}"` : ""}.
                </td>
              </tr>
            ) : (
              colleges?.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/colleges/${c.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {c.college_name || "(unnamed)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                    {c.city || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                    {c.state || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden lg:table-cell">
                    {c.territory || "—"}
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
              <Link
                href={`/colleges?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  page: String(page - 1),
                })}`}
                className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/colleges?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  page: String(page + 1),
                })}`}
                className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50"
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
