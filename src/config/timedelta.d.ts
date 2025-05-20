export declare class TimeSpan {
  private milliseconds;
  constructor(milliseconds: number);
  static fromMilliseconds(value: number): TimeSpan;
  static fromSeconds(value: number): TimeSpan;
  static fromMinutes(value: number): TimeSpan;
  static fromHours(value: number): TimeSpan;
  static fromDays(value: number): TimeSpan;
  getMilliseconds(): number;
  getSeconds(): number;
  getMinutes(): number;
  getHours(): number;
  getDays(): number;
  add(other: TimeSpan): TimeSpan;
  subtract(other: TimeSpan): TimeSpan;
}
export declare const MINUTE = 60;
export declare const HOUR: number;
export declare const DAY: number;
export declare const WEEK: number;
export declare function getTimeDelta(seconds: number): any string;
