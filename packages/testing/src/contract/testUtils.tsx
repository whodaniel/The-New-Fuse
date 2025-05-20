import { Type } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { APIResponse } from '@the-new-fuse/types'; // Corrected import path (assuming type is here)

export class TestUtils {
  /**
   * Generate mock data based on a TypeScript type
   */
  static generateMockData<T>(schema: Type<T>): T {
    const metadata = Reflect.getMetadata('design:type', schema);
    return this.generateMockForType(metadata);
  }

  /**
   * Generate an array of mock data
   */
  static generateMockArray<T>(schema: Type<T>, count: number = 3): T[] {
    return Array.from({ length: count }, () => this.generateMockData(schema));
  }

  /**
   * Create mock API response
   */
  static createMockApiResponse<T>(data: T): APIResponse<T> {
    return {
      status: 'success',
      data,
      message: 'Operation successful'
    };
  }

  private static generateMockForType(type: any): any {
    switch (type.name) {
      case 'String':
        return faker.lorem.words();
      case 'Number':
        return faker.number.int();
      case 'Boolean':
        return faker.datatype.boolean();
      case 'Date':
        return faker.date.recent();
      case 'Array':
        return Array.from({ length: 3 }, () => this.generateMockForType(type.elementType));
      default:
        if (typeof type === 'object') {
          const mock: Record<string, any> = {};
          for (const key of Object.keys(type)) {
            mock[key] = this.generateMockForType(Reflect.getMetadata('design:type', type, key));
          }
          return mock;
        }
        return null;
    }
  }
}