export interface IsoDateParts {
  year: number;
  month: number;
  day: number;
}

export interface CalendarCell {
  isoDate: string;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MIN_SA_YEAR = 2000;
export const MAX_SA_YEAR = 2100;

export const ARABIC_WEEKDAYS_SHORT = [
  'أحد',
  'إثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
] as const;

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

export function parseIsoDateParts(value: string): IsoDateParts | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const match = ISO_DATE_REGEX.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < MIN_SA_YEAR ||
    year > MAX_SA_YEAR ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
}

export function isValidIsoCalendarDate(value: string): boolean {
  return parseIsoDateParts(value) !== null;
}

export function formatIsoDateParts(year: number, month: number, day: number): string {
  const safeMonth = Math.min(12, Math.max(1, Math.trunc(month)));
  const safeYear = Math.min(MAX_SA_YEAR, Math.max(MIN_SA_YEAR, Math.trunc(year)));
  const maxDay = getDaysInMonth(safeYear, safeMonth);
  const safeDay = Math.min(maxDay, Math.max(1, Math.trunc(day)));

  return `${safeYear}-${String(safeMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function buildCalendarMonthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  const daysInCurrent = getDaysInMonth(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const cells: CalendarCell[] = [];

  // Leading days from previous month
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    cells.push({
      isoDate: formatIsoDateParts(Math.max(MIN_SA_YEAR, prevYear), prevMonth, day),
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrent; day++) {
    cells.push({
      isoDate: formatIsoDateParts(year, month, day),
      day,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Trailing days to complete 42 cells (6 clean rows)
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    cells.push({
      isoDate: formatIsoDateParts(Math.min(MAX_SA_YEAR, nextYear), nextMonth, day),
      day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  return cells;
}
