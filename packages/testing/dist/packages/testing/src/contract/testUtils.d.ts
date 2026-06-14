import { Type } from '@nestjs/common';
import { ApiResponse } from '@the-new-fuse/types';
export declare class TestUtils {
    /**
     * Generate mock data based on a TypeScript type
     */
    static generateMockData<T>(schema: Type<T>): T;
    /**
     * Generate an array of mock data
     */
    static generateMockArray<T>(schema: Type<T>, count?: number): T[];
    /**
     * Create mock API response
     */
    static createMockApiResponse<T>(data: T): ApiResponse<T>;
    private static generateMockForType;
}
//# sourceMappingURL=testUtils.d.ts.map