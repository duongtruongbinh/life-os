import { format, parseISO, differenceInMinutes } from "date-fns";

/** Returns 'YYYY-MM-DD' in the user's local timezone (client-only). Use instead of toISOString().slice(0,10) to avoid UTC skew. */
export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Duration in hours between two ISO timestamps. Returns 0 if either is null. */
export function calculateDurationHours(startIso: string | null, endIso: string | null): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const minutes = differenceInMinutes(end, start);
  return Math.max(0, minutes / 60);
}

/** Last N days as ISO date strings (YYYY-MM-DD), ending today (local timezone). */
export function getLastNDateStrings(days: number): string[] {
  const end = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(getLocalDateKey(d));
  }
  return dates;
}

/** Dates centered on today: daysBack before + daysFwd after (local timezone). */
export function getDateStringsCenteredOnToday(daysBack: number, daysFwd: number): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = -daysBack; i <= daysFwd; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(getLocalDateKey(d));
  }
  return dates;
}

/** All dates in a given year (Jan 1 - Dec 31). Uses local dates to avoid timezone skew. */
export function getDateStringsForYear(year: number): string[] {
  const dates: string[] = [];
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= daysInMonth[m]; d++) {
      const pad = (n: number) => String(n).padStart(2, "0");
      dates.push(`${year}-${pad(m + 1)}-${pad(d)}`);
    }
  }
  return dates;
}

/** GitHub-style: weeks (Sun-Sat). Returns dates from Sun of week containing Jan 1 to Sat of week containing Dec 31. */
export function getDateStringsForYearByWeeks(year: number): string[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const startSun = new Date(jan1);
  startSun.setDate(jan1.getDate() - jan1.getDay());
  const endSat = new Date(dec31);
  endSat.setDate(dec31.getDate() + (6 - dec31.getDay()));
  const dates: string[] = [];
  for (let d = new Date(startSun); d <= endSat; d.setDate(d.getDate() + 1)) {
    dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return dates;
}


/** Format date for chart labels: "Mon d" or "Mon" for compact. */
export function formatChartLabel(dateStr: string, compact = false): string {
  return format(parseISO(dateStr), compact ? "EEE" : "EEE d");
}

export type ChartRange = "week" | "month" | "year";

/** Last N month keys (YYYY-MM), most recent last. */
export function getLastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

/** Format chart label by range. */
export function formatChartLabelByRange(
  dateStrOrMonthKey: string,
  range: ChartRange
): string {
  if (range === "year" && /^\d{4}-\d{2}$/.test(dateStrOrMonthKey)) {
    return format(new Date(dateStrOrMonthKey + "-01"), "MMM");
  }
  const d = parseISO(
    dateStrOrMonthKey.length === 10 ? dateStrOrMonthKey : dateStrOrMonthKey + "-01"
  );
  if (range === "week") return format(d, "EEE d");
  if (range === "month") return format(d, "d MMM");
  return format(d, "MMM");
}

/** Extract time as decimal hours from ISO string (e.g. 23:30 -> 23.5). */
export function isoToDecimalHours(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}
