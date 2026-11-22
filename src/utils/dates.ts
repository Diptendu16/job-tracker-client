import { format } from "date-fns";

// Date-only fields (applied date, deadline, ...) are stored as midnight UTC of the calendar
// date the user picked. Reading the UTC parts returns that calendar date in ANY timezone;
// formatting the instant in local time would show the previous day west of UTC.
export function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  return format(
    new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    "MMM d, yyyy",
  );
}

// Today's date in the user's LOCAL timezone as YYYY-MM-DD, which is what <input type="date"> uses.
// (new Date().toISOString() would give the UTC date instead.)
export function todayLocalInputValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Stored date -> <input type="date"> value: the stored calendar date, no timezone conversion
export function toDateInputValue(iso?: string): string {
  return iso ? iso.slice(0, 10) : "";
}
