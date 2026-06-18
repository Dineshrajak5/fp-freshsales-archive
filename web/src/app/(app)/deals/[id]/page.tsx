import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { Tabs } from "@/components/tabs";

type PageProps = { params: Promise<{ id: string }> };

// Curated set of fields to show prominently in the Overview tab.
// Everything else is available in the "All fields" tab.
const HIGHLIGHT_FIELDS: { key: string; label: string; formatter?: "money" | "date" | "datetime" }[] = [
  { key: "opportunity_stage", label: "Stage" },
  { key: "net_bv_value", label: "Net BV value", formatter: "money" },
  { key: "expected_opportunity_value", label: "Expected value", formatter: "money" },
  { key: "expected_close_date_of_the_deal", label: "Expected close", formatter: "date" },
  { key: "closed_date", label: "Closed date", formatter: "date" },
  { key: "owner", label: "Owner" },
  { key: "client_name", label: "Client" },
  { key: "product", label: "Product" },
  { key: "payment_status", label: "Payment status" },
  { key: "collection_outstanding", label: "Collection outstanding" },
  { key: "lost_reason", label: "Lost reason" },
  { key: "training_start_date", label: "Training start", formatter: "date" },
  { key: "training_end_date", label: "Training end", formatter: "date" },
  { key: "number_of_students_registered", label: "Students registered" },
  { key: "number_of_batches", label: "Batches" },
  { key: "mode_of_training", label: "Mode" },
  { key: "territory", label: "Territory" },
  { key: "financial_year", label: "FY" },
  { key: "proforma_invoice", label: "Proforma invoice #" },
  { key: "tax_invoice", label: "Tax invoice #" },
  { key: "created_at", label: "Created", formatter: "datetime" },
];

export default async function DealDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !deal) notFound();

  const { data: contactLinks } = await supabase
    .from("opportunity_contacts")
    .select("contact_id")
    .eq("deal_id", id);
  const contactIds = (contactLinks ?? []).map((r) => r.contact_id).filter(Boolean);

  const { data: contacts } = contactIds.length
    ? await supabase
        .from("contacts")
        .select("id, first_name, full_name, disignation, mobile")
        .in("id", contactIds)
    : { data: [] };

  const linkedFor = async (
    targetsTable: string,
    idColumn: string,
    mainTable: string,
    fields: string
  ) => {
    const { data: links } = await supabase
      .from(targetsTable)
      .select(idColumn)
      .eq("related_to_id", id)
      .eq("related_to_type", "Deal");
    const ids = ((links ?? []) as unknown as Array<Record<string, string>>).map((r) => r[idColumn]).filter(Boolean);
    if (!ids.length) return [];
    const { data } = await supabase.from(mainTable).select(fields).in("id", ids);
    return data ?? [];
  };

  const [linkedNotes, linkedTasks, linkedMeetings] = await Promise.all([
    linkedFor("note_targets", "note_id", "notes", "id, description, created_at"),
    linkedFor("task_targets", "task_id", "tasks", "id, title, description, status, task_type, created_at, completed_date"),
    linkedFor("meeting_targets", "appointment_id", "meetings", "id, title, description, from_date, location, created_at"),
  ]);

  type TimelineItem = {
    id: string;
    kind: "note" | "task" | "meeting";
    title: string;
    body?: string | null;
    date: string | null;
    meta?: string | null;
  };

  const timeline: TimelineItem[] = [
    ...(linkedNotes as Array<{ id: string; description: string; created_at: string }>).map((n) => ({
      id: `note-${n.id}`,
      kind: "note" as const,
      title: "Note",
      body: n.description,
      date: n.created_at,
    })),
    ...(linkedTasks as Array<{ id: string; title: string; description: string; status: string; task_type: string; created_at: string; completed_date: string }>).map((t) => ({
      id: `task-${t.id}`,
      kind: "task" as const,
      title: t.title || "Task",
      body: t.description,
      date: t.completed_date || t.created_at,
      meta: `${t.task_type || "Task"} - ${t.status || ""}`,
    })),
    ...(linkedMeetings as Array<{ id: string; title: string; description: string; location: string; from_date: string; created_at: string }>).map((m) => ({
      id: `meeting-${m.id}`,
      kind: "meeting" as const,
      title: m.title || "Meeting",
      body: m.description,
      date: m.from_date || m.created_at,
      meta: m.location || null,
    })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const formatValue = (val: string | null | undefined, formatter?: string) => {
    if (!val) return null;
    if (formatter === "money") return formatMoney(val);
    if (formatter === "date") return formatDate(val);
    if (formatter === "datetime") return formatDate(val, true);
    return val;
  };

  const highlights = HIGHLIGHT_FIELDS
    .map((f) => ({ label: f.label, value: formatValue(deal[f.key], f.formatter) }))
    .filter((r) => r.value);

  // All other non-empty fields (for "All fields" tab)
  const allRows = Object.entries(deal)
    .filter(([k, v]) => v && k !== "id" && !HIGHLIGHT_FIELDS.some((f) => f.key === k))
    .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link href="/deals" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        All deals
      </Link>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 break-words">
              {deal.opportunity_title || "(untitled deal)"}
            </h1>
            {deal.client_name_id && (
              <Link href={`/colleges/${deal.client_name_id}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                {deal.client_name || "View college"}
              </Link>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
              {deal.opportunity_stage && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-gray-500">Stage:</span>
                  <span className="font-medium text-gray-900">{deal.opportunity_stage}</span>
                </span>
              )}
              {deal.net_bv_value && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-gray-500">Value:</span>
                  <span className="font-medium text-gray-900">{formatMoney(deal.net_bv_value)}</span>
                </span>
              )}
              {deal.owner && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-gray-500">Owner:</span>
                  <span className="text-gray-900">{deal.owner}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="bg-white border rounded-lg p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {highlights.map((row) => (
                    <div key={row.label} className="flex justify-between sm:block">
                      <dt className="text-xs text-gray-500 uppercase font-medium">{row.label}</dt>
                      <dd className="text-sm text-gray-900 sm:mt-1">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                {deal.tags && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {deal.tags.split(";").map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "contacts",
            label: "Contacts",
            count: contacts?.length ?? 0,
            content: (
              <div className="bg-white border rounded-lg overflow-hidden">
                {!contacts?.length ? (
                  <div className="p-6 text-sm text-gray-500">No contacts linked.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium hidden md:table-cell">Designation</th>
                        <th className="px-4 py-2 font-medium hidden md:table-cell">Mobile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr key={c.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <Link href={`/contacts/${c.id}`} className="text-blue-600 hover:underline">
                              {[c.first_name, c.full_name].filter(Boolean).join(" ") || "(unnamed)"}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{c.disignation || "-"}</td>
                          <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{c.mobile || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ),
          },
          {
            id: "activity",
            label: "Activity",
            count: timeline.length,
            content: (
              <div className="space-y-3">
                {!timeline.length ? (
                  <div className="bg-white border rounded-lg p-6 text-sm text-gray-500">No activity recorded.</div>
                ) : (
                  timeline.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-500 uppercase font-medium">{item.kind}</div>
                          <div className="text-sm font-medium text-gray-900 mt-0.5">{item.title}</div>
                          {item.body && (
                            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.body}</div>
                          )}
                          {item.meta && <div className="text-xs text-gray-500 mt-1">{item.meta}</div>}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(item.date)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          },
          {
            id: "all",
            label: "All fields",
            count: allRows.length,
            content: (
              <div className="bg-white border rounded-lg p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {allRows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-gray-500 uppercase font-medium capitalize">{row.label}</dt>
                      <dd className="text-sm text-gray-900 mt-0.5 break-words whitespace-pre-wrap">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}