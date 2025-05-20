export interface ITimeService {
  now(): Date;
  format(date: Date, formatString: string): string;
  add(date: Date, duration: object): Date;
  parse(dateString: string, formatString: string): Date;
  formatDistance(dateA: Date, dateB: Date): string;
}
export declare class TimeService implements ITimeService {
  now(): Date;
  format(date: Date, formatString: string): string;
  add(date: Date, duration: object): Date;
  parse(dateString: string, formatString: string): Date;
  formatDistance(dateA: Date, dateB: Date): string;
}
export default TimeService;
