import { injectable } from "inversify";

@injectable()
export class TimeService {
  /**
   * Returns the current date and time
   */
  now(): Date {
    return new Date();
  }

  /**
   * Add time to a date
   */
  addTime(
    date: Date = new Date(),
    amount: number,
    unit: "milliseconds" | "seconds" | "minutes" | "hours" | "days" = "milliseconds"
  ): Date {
    const result = new Date(date);
    
    switch (unit) {
      case "milliseconds":
        result.setTime(result.getTime() + amount);
        break;
      case "seconds":
        result.setTime(result.getTime() + amount * 1000);
        break;
      case "minutes":
        result.setTime(result.getTime() + amount * 60 * 1000);
        break;
      case "hours":
        result.setTime(result.getTime() + amount * 60 * 60 * 1000);
        break;
      case "days":
        result.setTime(result.getTime() + amount * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    return result;
  }

  /**
   * Subtract time from a date
   */
  subtractTime(
    date: Date = new Date(),
    amount: number,
    unit: "milliseconds" | "seconds" | "minutes" | "hours" | "days" = "milliseconds"
  ): Date {
    const result = new Date(date);
    
    switch (unit) {
      case "milliseconds":
        result.setTime(result.getTime() - amount);
        break;
      case "seconds":
        result.setTime(result.getTime() - amount * 1000);
        break;
      case "minutes":
        result.setTime(result.getTime() - amount * 60 * 1000);
        break;
      case "hours":
        result.setTime(result.getTime() - amount * 60 * 60 * 1000);
        break;
      case "days":
        result.setTime(result.getTime() - amount * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    return result;
  }
}
