const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Returns today's date as "YYYY-MM-DD" in the device's local timezone */
export function localDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns current month as "YYYY-MM" in the device's local timezone */
export function currentMonth(): string {
  return localDateString().slice(0, 7);
}

/** "2026-02" → "February 2026" */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** "2026-02" → "Feb 2026" */
export function formatMonthShort(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]} ${y}`;
}

/** "2026-02" → "2026-01" */
export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** "2026-02" → "2026-03" */
export function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** Returns true if month equals the current calendar month */
export function isCurrentMonth(month: string): boolean {
  return month === currentMonth();
}

/** Returns inclusive date range for a month */
export function monthToDateRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(days).padStart(2, '0')}`,
  };
}

/** Returns last N months as "YYYY-MM" strings, newest first */
export function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  let m = currentMonth();
  for (let i = 0; i < n; i++) {
    months.push(m);
    m = prevMonth(m);
  }
  return months;
}

/** "YYYY-MM-DD" → "15 Feb" */
export function formatDateShort(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}
