import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
};

export interface TimestampOptions {
  past?: boolean;
  future?: boolean;
  daysRange?: number;
}

export const generateTimestamp = (options: TimestampOptions = {}): Date => {
  const now = new Date();
  const daysRange = options.daysRange || 30;
  
  if (options.past) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * daysRange));
    return pastDate;
  }
  
  if (options.future) {
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + Math.floor(Math.random() * daysRange));
    return futureDate;
  }
  
  return now;
};

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateEnum<T extends string>(values: T[]): T {
  return pickRandom(values);
}

export const generateBoolean = (likelihood: number = 0.5): boolean => {
  return Math.random() < likelihood;
};

export const generateNumber = (min: number = 0, max: number = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function generateArray<T>(
  generator: () => T,
  length: number = 3
): T[] {
  return Array.from({ length }, () => generator());
}

export function generateObject<T extends Record<string, any>>(
  template: T
): T {
  const result: any = {};
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'function') {
      result[key] = value();
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export const generateEmail = (username: string): string => {
  const domains = ['example.com', 'test.com', 'fakemail.com'];
  return `${username.toLowerCase().replace(/\s+/g, '.')}@${pickRandom(domains)}`;
};
