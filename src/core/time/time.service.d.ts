export declare class TimeService {
  /**
   * Returns the current date and time
   */
  now(): Date;
  /**
   * Subtracts a specified amount of time from a date
   * @param date The base date
   * @param amount The amount of time to subtract
   * @param unit The unit of time (milliseconds, seconds, minutes, hours, days)
   */
  subtractFromDate(
    date: Date,
    amount: number,
    unit?: "milliseconds" | "seconds" | "minutes" | "hours" | "days",
  ): Date;
}
