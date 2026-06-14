export declare const generateId: (prefix?: string) => string;
export interface TimestampOptions {
    past?: boolean;
    future?: boolean;
    daysRange?: number;
}
export declare const generateTimestamp: (options?: TimestampOptions) => Date;
export declare function pickRandom<T>(array: T[]): T;
export declare function generateEnum<T extends string>(values: T[]): T;
export declare const generateBoolean: (likelihood?: number) => boolean;
export declare const generateNumber: (min?: number, max?: number) => number;
export declare function generateArray<T>(generator: () => T, length?: number): T[];
export declare function generateObject<T extends Record<string, any>>(template: T): T;
export declare const generateEmail: (username: string) => string;
//# sourceMappingURL=utils.d.ts.map