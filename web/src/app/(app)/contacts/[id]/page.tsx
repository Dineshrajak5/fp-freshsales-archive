import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Tabs } from "@/components/tabs";

type PageProps = { params: Promise<{ id: string }> };

export default async function ContactDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !contact) notFound();

  const { data: emails } = await supabase
    .from("contact_emails")
    .select("email, primary, email_status, label")
    .eq("contact_id", id);

  const { data: dealLinks } = await supabase
    .from("opportunity_contacts")
    .select("deal_id")
    .eq("contact_id", id);
  const dealIds = (dealLinks ?? []).map((r) => r.deal_id).filter(Boolean);

  const { data: deals } = dealIds.length
    ? await supabase
        .from("opportunities")
        .select("id, opportunity_title, opportunity_stage, net_bv_value, closed_date, created_at")
        .in("id", dealIds)
        .order("created_at", { ascending: false })
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
      .eq("related_to_type", "Contact");
    const ids = (links ?? []).map((r: Record<string, string>) => r[idColumn]).filter(Boolean);
    if (!ids.length) return [];
    const { data } = await supabase.from(mainTable).select(fields).in("id", ids);
    return data ?? [];
  };

  const [linkedNotes, linkedTasks, linkedMeetings] = await Promise.all([
    linkedFor("note_targets", "note_id", "notes", "id, description, created_at"),
    linkedFor("task_targets", "task_id", "tasks", "id, title, description, status, task_type, created_at, completed_date"),
    linkedFor("meeting_targets", "appointment_id", "meetings", "id, title, description, from_date, location, created_at"),
  ]);

  const { data: calls } = await supabase
    .from("call_logs")
    .select("id, call_type, notes, created_at")
    .eq("related_to_id", id)
    .eq("related_to_type", "Contact")
    .order("created_at", { ascending: false });

  type TimelineItem = {
    id: string;
    kind: "note" | "task" | "meeting" | "call";
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
    ...((calls ?? []) as Array<{ id: string; call_type: string; notes: string; created_at: string }>).map((c) => ({
      id: `call-${c.id}`,
      kind: "call" as const,
      title: `Call (${c.call_type || "-"})`,
      body: c.notes,
      date: c.created_at,
    })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const fullName = [contact.first_name, contact.full_name].filter(Boolean).join(" ") || "(unnamed)";

  const overviewRows: { label: string; value: string | null | undefined }[] = [
    { label: "Designation", value: contact.disignation },
    { label: "Department", value: contact.department },
    { label: "Mobile", value: contact.mobile },
    { label: "Work", value: contact.work },
    { label: "City", value: contact.city },
    { label: "State", value: contact.state },
    { label: "Role type", value: contact.role_type },
    { label: "Relationship status", value: contact.relationship_status },
    { label: "Last activity", value: contact.last_activity_date ? formatDate(contact.last_activity_date, true) : null },
    { label: "Last spoken", value: contact.last_spoken_date ? formatDate(contact.last_spoken_date, true) : null },
    { label: "Owner", value: contact.owner },
    { label: "Created", value: contact.created_at ? formatDate(contact.created_at) : null },
  ].filter((r) => r.value);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link href="/contacts" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        All contacts
      </Link>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 break-words">{fullName}</h1>
            {contact.disignation && (
              <div className="text-sm text-gray-600 mt-0.5">{contact.disignation}</div>
            )}
            {contact.account_id && (
              <Link
                href={`/colleges/${contact.account_id}`}
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
              >
                {contact.account || "View college"}
              </Link>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-700">
              {contact.mobile && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {contact.mobile}
                </span>
              )}
              {emails?.filter((e) => e.primary === "true").map((e) => (
                <span key={e.email} className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {e.email}
                </span>
              ))}
            </div>
          </div>
        </div>

        {contact.recent_note && (
          <div className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <span className="text-xs text-gray-500 uppercase font-medium">Recent note: </span>
            {contact.recent_note}
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

                {emails && emails.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-2">Emails</div>
                    <div className="space-y-1">
                      {emails.map((e) => (
                        <div key={e.email} className="text-sm text-gray-700">
                          {e.email}
                          {e.primary === "true" && (
                            <span className="ml-2 text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">primary</span>
                          )}
                          {e.email_status === "bounced" && (
                            <span className="ml-2 text-xs bg-red-50 text-red-700 rounded px-1.5 py-0.5">bounced</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
                        <th className="px-4 py-2 font-medium hidden md:table-cell">Closed</th>
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
                          <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                            {d.closed_date ? formatDate(d.closed_date) : "-"}
                          </td>
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