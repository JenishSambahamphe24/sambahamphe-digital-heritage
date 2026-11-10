import { ORG_TIMEZONE } from "../organization.constants.js";

export class OrgDateHelper {
  // Today's date in Nepal as YYYY-MM-DD.
  static today(now: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: ORG_TIMEZONE }).format(now);
  }

  // Half-open [start, end): the end date is the first day no longer covered.
  static covers(range: { startsOn: string; endsOn: string | null }, day: string): boolean {
    return range.startsOn <= day && (range.endsOn === null || day < range.endsOn);
  }
}
