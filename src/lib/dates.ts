// Date formatting helpers for display.

/** Formats an ISO date or timestamp as e.g. "15 Jan 2026". Returns "—" for null. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formats a date range such as "1 Jan 2026 – 31 Mar 2026". */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return "—";
  return `${formatDate(start)} – ${formatDate(end)}`;
}
