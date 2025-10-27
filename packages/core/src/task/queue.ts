export interface QueueItem<T> {
  id: string;
  data: T;
  priority: number;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

export class TaskQueue<T> {
  private queue: QueueItem<T>[] = [];
  private processing = false;
  private maxConcurrent = 5;
  private activeCount = 0;

  enqueue(data: T, priority: number = 0, maxRetries: number = 3): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: QueueItem<T> = {
      id,
      data,
      priority,
      timestamp: new Date(),
      retries: 0,
      maxRetries
    };

    this.queue.push(item);
    this.queue.sort((a, b) => b.priority - a.priority || a.timestamp.getTime() - b.timestamp.getTime());

    this.processQueue();

    return id;
  }

  dequeue(): QueueItem<T> | undefined {
    return this.queue.shift();
  }

  peek(): QueueItem<T> | undefined {
    return this.queue[0];
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
  }

  getAll(): QueueItem<T>[] {
    return [...this.queue];
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeCount >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (!this.isEmpty() && this.activeCount < this.maxConcurrent) {
      const item = this.dequeue();
      if (item) {
        this.activeCount++;
        this.processItem(item).finally(() => {
          this.activeCount--;
          this.processQueue();
        });
      }
    }

    this.processing = false;
  }

  private async processItem(item: QueueItem<T>): Promise<void> {
    try {
      // Stub implementation - override this in subclass
      await this.handleItem(item.data);
    } catch (error) {
      if (item.retries < item.maxRetries) {
        item.retries++;
        this.queue.unshift(item);
      } else {
        await this.handleError(item, error);
      }
    }
  }

  protected async handleItem(data: T): Promise<void> {
    // Override this method in subclass
    console.log('Processing item:', data);
  }

  protected async handleError(item: QueueItem<T>, error: unknown): Promise<void> {
    // Override this method in subclass
    console.error('Item failed after max retries:', item, error);
  }

  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
  }
}
