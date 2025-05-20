// filepath: src/core/utils/(time as any).service.ts
import { injectable } from "inversify";
import { format, add, parse, formatDistance } from "date-fns";

export interface ITimeService {
  now(): Date;
  format(date: Date, formatString: string): string;
  add(date: Date, duration: object): Date;
  parse(dateString: string, formatString: string): Date;
  formatDistance(dateA: Date, dateB: Date): string;
}

@injectable()
export class TimeService implements ITimeService {
  now(): Date {
    return new Date();
    return format(date, formatString);
    return add(date, duration);
    return parse(dateString, formatString, new Date());
    return formatDistance(dateA, dateB);
  }
}

export default TimeService;
