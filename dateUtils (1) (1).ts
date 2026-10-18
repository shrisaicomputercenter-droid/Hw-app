/**
 * Date utilities for KVS School Calendar
 * Rules:
 * - Sundays are holidays (never show homework dates for Sundays)
 * - 2nd Saturdays of every month are holidays (never show homework dates for 2nd Saturdays)
 * - All homework history must be sorted latest to oldest
 */

export function isSundayOrSecondSaturday(dateInput: Date | string): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;

  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0) {
    return true; // Sunday is holiday
  }

  if (dayOfWeek === 6) {
    // 2nd Saturday falls strictly between 8th and 14th of the month
    const dayOfMonth = date.getDate();
    if (dayOfMonth >= 8 && dayOfMonth <= 14) {
      return true; // 2nd Saturday is holiday
    }
  }

  return false;
}

export function isValidSchoolDate(dateInput: Date | string): boolean {
  return !isSundayOrSecondSaturday(dateInput);
}

export function formatSchoolDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }); // e.g. "29 Sep 2026"
}

export function getTodaySchoolDate(): string {
  const now = new Date();
  // If today happens to be Sunday or 2nd Saturday, move to previous valid working school day
  let d = new Date(now);
  while (isSundayOrSecondSaturday(d)) {
    d.setDate(d.getDate() - 1);
  }
  return formatSchoolDate(d);
}

/**
 * Returns a list of valid working school dates (excluding Sundays and 2nd Saturdays),
 * ordered strictly from latest to oldest.
 */
export function getValidSchoolDates(count: number = 30, startDate?: Date): string[] {
  const dates: string[] = [];
  const current = startDate ? new Date(startDate) : new Date();

  // Ensure current time does not affect date calculations
  current.setHours(12, 0, 0, 0);

  let iterations = 0;
  while (dates.length < count && iterations < 120) {
    iterations++;
    if (!isSundayOrSecondSaturday(current)) {
      dates.push(formatSchoolDate(current));
    }
    current.setDate(current.getDate() - 1);
  }

  return dates;
}

/**
 * Parses date string like "29 Sep 2026" or ISO string into Date object
 */
export function parseDateString(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  // Fallback parsing for "DD Mon YYYY"
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames.indexOf(parts[1].toLowerCase().slice(0, 3));
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      return new Date(year, month, day, 12, 0, 0);
    }
  }
  return new Date();
}
