import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getDay,
  getDate,
  setDate,
  format,
} from "date-fns";

export type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byDayOfWeek?: number[];    // 0=Sun..6=Sat
  byMonthDay?: number[];     // 1-31
  bySetPos?: number;         // -1=last, 1=first, 2=second, 3=third, 4=fourth
  endType: "never" | "on_date" | "after_count";
  endDate?: string;
  endCount?: number;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINALS = ["", "first", "second", "third", "fourth"];

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const { frequency, interval, byDayOfWeek, byMonthDay, bySetPos, endType, endDate, endCount } = rule;

  let base = "";

  if (interval === 1) {
    switch (frequency) {
      case "daily": base = "Every day"; break;
      case "weekly": base = "Every week"; break;
      case "monthly": base = "Every month"; break;
      case "yearly": base = "Every year"; break;
    }
  } else {
    const units: Record<string, string> = { daily: "days", weekly: "weeks", monthly: "months", yearly: "years" };
    base = `Every ${interval} ${units[frequency]}`;
  }

  if (frequency === "weekly" && byDayOfWeek && byDayOfWeek.length > 0) {
    const dayStr = byDayOfWeek.map((d) => DAY_NAMES[d]).join(", ");
    base += ` on ${dayStr}`;
  }

  if (frequency === "monthly") {
    if (bySetPos != null && byDayOfWeek && byDayOfWeek.length === 1) {
      const pos = bySetPos === -1 ? "last" : ORDINALS[bySetPos] ?? `${bySetPos}th`;
      base += ` on the ${pos} ${DAY_NAMES_FULL[byDayOfWeek[0]]}`;
    } else if (byMonthDay && byMonthDay.length > 0) {
      const dayStr = byMonthDay.map(ordinalSuffix).join(" and ");
      base += ` on the ${dayStr}`;
    }
  }

  if (endType === "on_date" && endDate) {
    base += `, until ${endDate}`;
  } else if (endType === "after_count" && endCount) {
    base += `, ${endCount} time${endCount === 1 ? "" : "s"}`;
  }

  return base;
}

export function generatePresets(dateStr: string): { label: string; rule: RecurrenceRule }[] {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = getDay(date);
  const dayOfMonth = getDate(date);
  const monthName = format(date, "MMMM");
  const dayName = DAY_NAMES_FULL[dayOfWeek];

  return [
    {
      label: `Every week on ${dayName}`,
      rule: { frequency: "weekly", interval: 1, byDayOfWeek: [dayOfWeek], endType: "never" },
    },
    {
      label: `Every 2 weeks on ${dayName}`,
      rule: { frequency: "weekly", interval: 2, byDayOfWeek: [dayOfWeek], endType: "never" },
    },
    {
      label: `Every month on the ${ordinalSuffix(dayOfMonth)}`,
      rule: { frequency: "monthly", interval: 1, byMonthDay: [dayOfMonth], endType: "never" },
    },
    {
      label: `Every year on ${monthName} ${dayOfMonth}`,
      rule: { frequency: "yearly", interval: 1, endType: "never" },
    },
  ];
}

export function calculateNextDate(
  currentDateStr: string,
  rule: RecurrenceRule,
  occurrenceCount?: number
): string | null {
  if (rule.endType === "after_count" && rule.endCount != null && occurrenceCount != null) {
    if (occurrenceCount >= rule.endCount) return null;
  }

  const current = new Date(currentDateStr + "T00:00:00");
  let next: Date;

  switch (rule.frequency) {
    case "daily":
      next = addDays(current, rule.interval);
      break;
    case "weekly":
      if (rule.byDayOfWeek && rule.byDayOfWeek.length > 0) {
        next = findNextMatchingDayOfWeek(current, rule.byDayOfWeek, rule.interval);
      } else {
        next = addWeeks(current, rule.interval);
      }
      break;
    case "monthly":
      if (rule.bySetPos != null && rule.byDayOfWeek && rule.byDayOfWeek.length === 1) {
        next = findNthWeekdayOfMonth(current, rule.byDayOfWeek[0], rule.bySetPos, rule.interval);
      } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        next = findNextMonthDay(current, rule.byMonthDay, rule.interval);
      } else {
        next = addMonths(current, rule.interval);
      }
      break;
    case "yearly":
      next = addYears(current, rule.interval);
      break;
    default:
      next = addMonths(current, rule.interval);
  }

  const nextStr = next.toISOString().split("T")[0];

  if (rule.endType === "on_date" && rule.endDate && nextStr > rule.endDate) {
    return null;
  }

  return nextStr;
}

function findNextMatchingDayOfWeek(current: Date, days: number[], weekInterval: number): Date {
  const sorted = [...days].sort((a, b) => a - b);
  const currentDay = getDay(current);

  for (const d of sorted) {
    if (d > currentDay) {
      return addDays(current, d - currentDay);
    }
  }

  const daysUntilEndOfWeek = 6 - currentDay;
  const startOfNextWeek = addDays(current, daysUntilEndOfWeek + 1 + (weekInterval - 1) * 7);
  const nextWeekDay = getDay(startOfNextWeek);
  return addDays(startOfNextWeek, sorted[0] - nextWeekDay);
}

function findNthWeekdayOfMonth(current: Date, targetDay: number, setPos: number, monthInterval: number): Date {
  const nextMonth = addMonths(current, monthInterval);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth();

  if (setPos === -1) {
    const lastDay = new Date(year, month + 1, 0);
    let d = lastDay;
    while (getDay(d) !== targetDay) {
      d = addDays(d, -1);
    }
    return d;
  }

  let first = new Date(year, month, 1);
  while (getDay(first) !== targetDay) {
    first = addDays(first, 1);
  }
  return addDays(first, (setPos - 1) * 7);
}

function findNextMonthDay(current: Date, monthDays: number[], monthInterval: number): Date {
  const sorted = [...monthDays].sort((a, b) => a - b);
  const currentDayOfMonth = getDate(current);

  for (const d of sorted) {
    if (d > currentDayOfMonth) {
      const candidate = setDate(current, d);
      if (getDate(candidate) === d) return candidate;
    }
  }

  const nextMonth = addMonths(current, monthInterval);
  for (const d of sorted) {
    const candidate = setDate(nextMonth, d);
    if (getDate(candidate) === d) return candidate;
  }

  return addMonths(current, monthInterval);
}

export function ruleToDbColumns(rule: RecurrenceRule) {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    by_day_of_week: rule.byDayOfWeek ? JSON.stringify(rule.byDayOfWeek) : null,
    by_month_day: rule.byMonthDay ? JSON.stringify(rule.byMonthDay) : null,
    by_set_pos: rule.bySetPos ?? null,
    end_type: rule.endType,
    end_date: rule.endDate ?? null,
    end_count: rule.endCount ?? null,
  };
}

export function dbColumnsToRule(row: {
  frequency: string;
  interval: number;
  by_day_of_week: string | null;
  by_month_day: string | null;
  by_set_pos: number | null;
  end_type: string | null;
  end_date: string | null;
  end_count: number | null;
}): RecurrenceRule {
  return {
    frequency: row.frequency as RecurrenceRule["frequency"],
    interval: row.interval || 1,
    byDayOfWeek: row.by_day_of_week ? JSON.parse(row.by_day_of_week) : undefined,
    byMonthDay: row.by_month_day ? JSON.parse(row.by_month_day) : undefined,
    bySetPos: row.by_set_pos ?? undefined,
    endType: (row.end_type as RecurrenceRule["endType"]) ?? "never",
    endDate: row.end_date ?? undefined,
    endCount: row.end_count ?? undefined,
  };
}
