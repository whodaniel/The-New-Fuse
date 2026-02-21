import { Injectable } from "@nestjs/common";

interface TimeAddOptions {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  months?: number;
  years?: number;
}

@Injectable()
export class TimeService {
  now(): Date {
    return new Date();
  }
  
  addToDate(date: Date, options: TimeAddOptions): Date {
    const result = new Date(date);

    if (options.seconds)
      result.setSeconds(result.getSeconds() + options.seconds);
    if (options.minutes)
      result.setMinutes(result.getMinutes() + options.minutes);
    if (options.hours) result.setHours(result.getHours() + options.hours);
    if (options.days) result.setDate(result.getDate() + options.days);
    if (options.months) result.setMonth(result.getMonth() + options.months);
    if (options.years) result.setFullYear(result.getFullYear() + options.years);

    return result;
  }

  subtractFromDate(date: Date, options: TimeAddOptions): Date {
    const negativeOptions: TimeAddOptions = {};

    if (options.seconds) negativeOptions.seconds = -options.seconds;
    if (options.minutes) negativeOptions.minutes = -options.minutes;
    if (options.hours) negativeOptions.hours = -options.hours;
    if (options.days) negativeOptions.days = -options.days;
    if (options.months) negativeOptions.months = -options.months;
    if (options.years) negativeOptions.years = -options.years;

    return this.addToDate(date, negativeOptions);
  }

  addTimeUnit(date: Date, value: number, unit: string): Date {
    const options: TimeAddOptions = {};

    switch(unit) {
      case "seconds":
        options.seconds = value;
        break;
      case "minutes":
        options.minutes = value;
        break;
      case "hours":
        options.hours = value;
        break;
      case "days":
        options.days = value;
        break;
      case "months":
        options.months = value;
        break;
      case "years":
        options.years = value;
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    return this.addToDate(date, options);
  }
}
