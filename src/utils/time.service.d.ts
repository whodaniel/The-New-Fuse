interface TimeAddOptions {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  months?: number;
  years?: number;
}
export declare class TimeService {
  now(): Date;
  addToDate(date: Date, options: TimeAddOptions): Date;
  subtractFromDate(date: Date, options: TimeAddOptions): Date;
  add(date: Date, value: number, unit: string): Date;
}
export {};
