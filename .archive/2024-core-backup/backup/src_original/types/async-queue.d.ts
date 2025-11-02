declare module 'async-queue' {
  export interface AsyncQueue<T> {
    push(task: T): Promise<void>;
    length(): number;
    isEmpty(): boolean;
    clear(): void;
  }

  export default function createQueue<T>(): AsyncQueue<T>;
}
