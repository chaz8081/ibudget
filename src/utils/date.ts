import { format } from "date-fns";

export function getCurrentBudgetMonth(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getPreviousMonth(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export function getNextMonth(month: number, year: number) {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1);
  return format(date, "MMMM yyyy");
}

export function formatTransactionDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy");
}
