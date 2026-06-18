import { formatDistanceToNow, parseISO, format } from "date-fns";

// Freshsales timestamps look like "2019-12-24 10:34:51 UTC"
// We need to convert "YYYY-MM-DD HH:MM:SS UTC" to ISO before parsing.
export function parseFsDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  // Replace space with T, strip " UTC", append Z
  const iso = raw.replace(" ", "T").replace(" UTC", "Z");
  try {
    const d = parseISO(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatDate(raw: string | null | undefined, withTime = false) {
  const d = parseFsDate(raw);
  if (!d) return "—";
  return withTime ? format(d, "dd MMM yyyy, HH:mm") : format(d, "dd MMM yyyy");
}

export function formatRelative(raw: string | null | undefined) {
  const d = parseFsDate(raw);
  if (!d) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatMoney(raw: string | null | undefined) {
  if (!raw) return "—";
  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}