/**
 * Recurring Task Utilities
 * RRULE-based recurrence for scheduled task generation
 */

// ============================================================================
// Types
// ============================================================================

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every N days/weeks/months
  byDay?: string[]; // ["MO", "TU", "WE", "TH", "FR"] for weekly
  byMonthDay?: number; // 1-31 for monthly
  count?: number; // Max occurrences
  until?: Date; // End date
}

export interface ParsedRRule {
  frequency: RecurrenceFrequency;
  interval: number;
  byDay: string[];
  byMonthDay: number | null;
  count: number | null;
  until: Date | null;
}

// Day name mappings
const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

const DAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// ============================================================================
// RRULE Parsing & Generation
// ============================================================================

/**
 * Generate an RRULE string from structured recurrence options
 */
export function createRRule(rule: RecurrenceRule): string {
  const parts: string[] = [`FREQ=${rule.frequency}`];

  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }

  if (rule.byDay && rule.byDay.length > 0) {
    parts.push(`BYDAY=${rule.byDay.join(",")}`);
  }

  if (rule.byMonthDay) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay}`);
  }

  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }

  if (rule.until) {
    parts.push(`UNTIL=${formatRRuleDate(rule.until)}`);
  }

  return parts.join(";");
}

/**
 * Parse an RRULE string into structured options
 */
export function parseRRule(rrule: string): ParsedRRule {
  const result: ParsedRRule = {
    frequency: "DAILY",
    interval: 1,
    byDay: [],
    byMonthDay: null,
    count: null,
    until: null,
  };

  const parts = rrule.split(";");
  for (const part of parts) {
    const [key, value] = part.split("=");
    switch (key) {
      case "FREQ":
        result.frequency = value as RecurrenceFrequency;
        break;
      case "INTERVAL":
        result.interval = parseInt(value, 10);
        break;
      case "BYDAY":
        result.byDay = value.split(",");
        break;
      case "BYMONTHDAY":
        result.byMonthDay = parseInt(value, 10);
        break;
      case "COUNT":
        result.count = parseInt(value, 10);
        break;
      case "UNTIL":
        result.until = parseRRuleDate(value);
        break;
    }
  }

  return result;
}

/**
 * Format date for RRULE (YYYYMMDDTHHMMSSZ)
 */
function formatRRuleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Parse RRULE date format
 */
function parseRRuleDate(dateStr: string): Date {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hour = dateStr.substring(9, 11) || "00";
  const minute = dateStr.substring(11, 13) || "00";
  const second = dateStr.substring(13, 15) || "00";
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

// ============================================================================
// Next Occurrence Calculation
// ============================================================================

/**
 * Calculate the next occurrence date based on RRULE
 */
export function getNextOccurrence(
  rrule: string,
  fromDate: Date = new Date()
): Date {
  const parsed = parseRRule(rrule);
  const next = new Date(fromDate);

  switch (parsed.frequency) {
    case "DAILY":
      next.setDate(next.getDate() + parsed.interval);
      break;

    case "WEEKLY":
      if (parsed.byDay.length > 0) {
        // Find next matching day
        const currentDay = next.getDay();
        const targetDays = parsed.byDay
          .map((d) => DAY_MAP[d])
          .sort((a, b) => a - b);

        // Find next day in this week
        let foundNextDay = false;
        for (const targetDay of targetDays) {
          if (targetDay > currentDay) {
            next.setDate(next.getDate() + (targetDay - currentDay));
            foundNextDay = true;
            break;
          }
        }

        // If no day found in current week, go to first day of next week
        if (!foundNextDay) {
          const daysUntilFirstTarget = 7 - currentDay + targetDays[0];
          next.setDate(
            next.getDate() + daysUntilFirstTarget + (parsed.interval - 1) * 7
          );
        }
      } else {
        next.setDate(next.getDate() + 7 * parsed.interval);
      }
      break;

    case "MONTHLY":
      if (parsed.byMonthDay) {
        next.setMonth(next.getMonth() + parsed.interval);
        next.setDate(parsed.byMonthDay);
      } else {
        next.setMonth(next.getMonth() + parsed.interval);
      }
      break;

    case "YEARLY":
      next.setFullYear(next.getFullYear() + parsed.interval);
      break;
  }

  // Check if past end date
  if (parsed.until && next > parsed.until) {
    return parsed.until; // Return until date, caller should check and stop
  }

  return next;
}

// ============================================================================
// Preset Rules
// ============================================================================

export const RECURRENCE_PRESETS = {
  daily: "FREQ=DAILY",
  weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  weekly: "FREQ=WEEKLY",
  biweekly: "FREQ=WEEKLY;INTERVAL=2",
  monthly: "FREQ=MONTHLY",
  quarterly: "FREQ=MONTHLY;INTERVAL=3",
  yearly: "FREQ=YEARLY",
} as const;

/**
 * Get human-readable description of recurrence rule
 */
export function describeRecurrence(rrule: string): string {
  const parsed = parseRRule(rrule);

  if (parsed.interval === 1) {
    switch (parsed.frequency) {
      case "DAILY":
        return "Daily";
      case "WEEKLY":
        if (parsed.byDay.length > 0) {
          if (
            parsed.byDay.length === 5 &&
            !parsed.byDay.includes("SA") &&
            !parsed.byDay.includes("SU")
          ) {
            return "Every weekday";
          }
          return `Weekly on ${parsed.byDay.map((d) => d.charAt(0) + d.charAt(1).toLowerCase()).join(", ")}`;
        }
        return "Weekly";
      case "MONTHLY":
        if (parsed.byMonthDay) {
          return `Monthly on the ${ordinal(parsed.byMonthDay)}`;
        }
        return "Monthly";
      case "YEARLY":
        return "Yearly";
    }
  }

  switch (parsed.frequency) {
    case "DAILY":
      return `Every ${parsed.interval} days`;
    case "WEEKLY":
      return `Every ${parsed.interval} weeks`;
    case "MONTHLY":
      return `Every ${parsed.interval} months`;
    case "YEARLY":
      return `Every ${parsed.interval} years`;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
