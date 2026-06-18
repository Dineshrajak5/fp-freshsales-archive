import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Building2, ExternalLink } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { Tabs } from "@/components/tabs";

type PageProps = { params: Promise<{ id: string }> };

export default async function CollegeDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account, error: accErr } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (accErr || !account) notFound();

  const { data: contactLinks } = await supabase
    .from("account_contacts")
    .select("contact_id")
    .eq("sales_account_id", id);
  const contactIds = (contactLinks ?? []).map((r) => r.contact_id).filter(Boolean);

  const { data: contacts } = contactIds.length
    ? await supabase
        .from("contacts")
        .select("id, full_name, first_name, disignation, department, work, mobile, emails, last_activity_date")
        .in("id", contactIds)
        .order("full_name", { ascending: true })
    : { data: [] };

  const { data: deals } = await supabase
    .from("opportunities")
    .select("id, opportunity_title, opportunity_stage, net_bv_value, expected_close_date_of_the_deal, closed_date, owner, created_at")
    .eq("client_name_id", id)
    .order("created_at", { ascending: false });

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
      .eq("related_to_type", "SalesAccount");
    const ids = (links ?? []).map((r: Record<string, string>) => r[idColumn]).filter(Boolean);
    if (!ids.length) return [];
    const { data } = await supabase.from(mainTable).select(fields).in("id", ids);
    return data ?? [];
  };

  const [linkedNotes, linkedTasks, linkedMeetings, linkedActivities] = await Promise.all([
    linkedFor("note_targets", "note_id", "notes", "id, description, created_by_id, created_at"),
    linkedFor("task_targets", "task_id", "tasks", "id, title, description, status, due_date, completed_date, task_type, created_at"),
    linkedFor("meeting_targets", "appointment_id", "meetings", "id, title, description, from_date, to_date, location, status, created_at"),
    linkedFor("salesactivity_targets", "salesactivity_id", "sales_activities", "id, title, description, start_date, end_date, sales_activity_type, status, created_at"),
  ]);

  const { data: calls } = await supabase
    .from("call_logs")
    .select("id, call_type, call_duration, notes, created_at, user_id")
    .eq("related_to_id", id)
    .eq("related_to_type", "SalesAccount")
    .order("created_at", { ascending: false });

  type TimelineItem = {
    id: string;
    kind: "note" | "task" | "meeting" | "activity" | "call";
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
    ...(linkedActivities as Array<{ id: string; title: string; description: string; sales_activity_type: string; status: string; start_date: string; created_at: string }>).map((a) => ({
      id: `activity-${a.id}`,
      kind: "activity" as const,
      title: a.title || "Sales activity",
      body: a.description,
      date: a.start_date || a.created_at,
      meta: `${a.sales_activity_type || "Activity"} - ${a.status || ""}`,
    })),
    ...((calls ?? []) as Array<{ id: string; call_type: string; notes: string; created_at: string }>).map((c) => ({
      id: `call-${c.id}`,
      kind: "call" as const,
      title: `Call (${c.call_type || "-"})`,
      body: c.notes,
      date: c.created_at,
    })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const overviewRows: { label: string; value: string | null | undefined }[] = [
    { label: "City", value: account.city },
    { label: "State", value: account.state },
    { label: "District", value: account.district },
    { label: "Territory", value: account.territory },
    { label: "Zone", value: account.zone },
    { label: "Cluster", value: account.cluster },
    { label: "Owner", value: account.owner },
    { label: "Client code", value: account.client_code },
    { label: "GSTIN", value: account.gstin },
    { label: "Last activity", value: account.last_activity_date ? formatDate(account.last_activity_date, true) : null },
    { label: "Created", value: account.created_at ? formatDate(account.created_at) : null },
  ].filter((r) => r.value);

  const cleanWebsite = account.website ? account.website.replace(/<\/?[a-z]+>/gi, "").trim() : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link href="/colleges" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        All colleges
      </Link>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 break-words">
              {account.college_name || "(unnamed college)"}
            </h1>
            {(account.city || account.state) && (
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {[account.city, account.state].filter(Boolean).join(", ")}
              </div>
            )}
            {cleanWebsite && (
              <a
                href={cleanWebsite}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
              >
                Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {account.recent_note && (
          <div className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <span className="text-xs text-gray-500 uppercase font-medium">Recent note: </span>
            {account.recent_note}
          </div>
        )}
      </div>

      <Tabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="bg-white border rounded-lg p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {overviewRows.map((row) => (
                    <div key={row.label} className="flex justify-between sm:block">
                      <dt className="text-xs text-gray-500 uppercase font-medium">{row.label}</dt>
                      <dd className="text-sm text-gray-900 sm:mt-1">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {account.tags && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {account.tags.split(";").map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
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
            id: "deals",
            label: "Deals",
            count: deals?.length ?? 0,
            content: (
              <div className="bg-white border rounded-lg overflow-hidden">
                {!deals?.length ? (
                  <div className="p-6 text-sm text-gray-500">No deals.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 font-medium">Title</th>
                        <th className="px-4 py-2 font-medium">Stage</th>
                        <th className="px-4 py-2 font-medium hidden md:table-cell">Value</th>
                        <th className="px-4 py-2 font-medium hidden lg:table-cell">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((d) => (
                        <tr key={d.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <Link href={`/deals/${d.id}`} className="text-blue-600 hover:underline">
                              {d.opportunity_title || "(untitled)"}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{d.opportunity_stage || "-"}</td>
                          <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{formatMoney(d.net_bv_value)}</td>
                          <td className="px-4 py-2.5 text-gray-600 hidden lg:table-cell">{d.closed_date ? formatDate(d.closed_date) : "-"}</td>
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
        ]}
      />
    </div>
  );
}