import { addWeeks, addMonths, addYears } from "date-fns";

export type Frequency = "weekly" | "biweekly" | "monthly" | "yearly";

export function calculateNextOccurrence(
  currentDate: string,
  frequency: Frequency,
  interval: number = 1
): string {
  const date = new Date(currentDate + "T00:00:00");

  let next: Date;
  switch (frequency) {
    case "weekly":
      next = addWeeks(date, interval);
      break;
    case "biweekly":
      next = addWeeks(date, 2 * interval);
      break;
    case "monthly":
      next = addMonths(date, interval);
      break;
    case "yearly":
      next = addYears(date, interval);
      break;
    default:
      next = addMonths(date, interval);
  }

  return next.toISOString().split("T")[0];
}

export function isDue(nextOccurrenceDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return nextOccurrenceDate <= today;
}
