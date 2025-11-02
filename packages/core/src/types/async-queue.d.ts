declare module 'async-queue' {
  // Implementation needed
}
  export interface AsyncQueue<T> {
  // Implementation needed
}
    push(task: T): Promise<void>;
    length(): number;
    isEmpty(): boolean;
    clear(): void;
  }

  export default function createQueue<T>(): AsyncQueue<T>;
}
