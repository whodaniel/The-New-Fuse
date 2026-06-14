"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = void 0;
const faker_1 = require("@faker-js/faker");
class TestUtils {
    /**
     * Generate mock data based on a TypeScript type
     */
    static generateMockData(schema) {
        const metadata = Reflect.getMetadata('design:type', schema);
        return this.generateMockForType(metadata);
    }
    /**
     * Generate an array of mock data
     */
    static generateMockArray(schema, count = 3) {
        return Array.from({ length: count }, () => this.generateMockData(schema));
    }
    /**
     * Create mock API response
     */
    static createMockApiResponse(data) {
        return {
            success: true,
            data,
            message: 'Operation successful'
        };
    }
    static generateMockForType(type) {
        switch (type.name) {
            case 'String':
                return faker_1.faker.lorem.words();
            case 'Number':
                return faker_1.faker.number.int();
            case 'Boolean':
                return faker_1.faker.datatype.boolean();
            case 'Date':
                return faker_1.faker.date.recent();
            case 'Array':
                return Array.from({ length: 3 }, () => this.generateMockForType(type.elementType));
            default:
                if (typeof type === 'object') {
                    const mock = {};
                    for (const key of Object.keys(type)) {
                        mock[key] = this.generateMockForType(Reflect.getMetadata('design:type', type, key));
                    }
                    return mock;
                }
                return null;
        }
    }
}
exports.TestUtils = TestUtils;
//# sourceMappingURL=testUtils.js.map