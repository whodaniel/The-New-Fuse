import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';

@Injectable()
export class TestDataGenerator {
  /**
   * Generates test data based on a schema.
   * The schema can be a simple string (e.g., 'email'),
   * an array (e.g., ['string']), or a schema object
   * (e.g., { type: 'object', properties: { ... } })
   */
  generate(schema: any): any {
    // Handle flexible inputs from 'Current' branch
    if (typeof schema === 'string') {
      return this.generateString({ type: 'string', format: schema });
    }
    if (Array.isArray(schema)) {
      return this.generateArray({ type: 'array', items: schema[0] || {} });
    }
    if (typeof schema === 'object' && schema !== null && !schema.type) {
      return this.generateObject({ type: 'object', properties: schema });
    }

    // Handle schema object from 'Incoming' branch
    if (!schema || !schema.type) {
      return null;
    }

    switch (schema.type) {
      case 'string':
        return this.generateString(schema);
      case 'number':
        return this.generateNumber(schema);
      case 'boolean':
        return this.generateBoolean();
      case 'array':
        return this.generateArray(schema);
      case 'object':
        return this.generateObject(schema);
      default:
        // Attempt to generate based on format string
        return this.generateString({ format: schema.type });
    }
  }

  /**
   * Generates multiple instances of data from a schema.
   */
  generateMany(schema: any, count: number): any[] {
    return Array.from({ length: count }, () => this.generate(schema));
  }

  // --- Private Helper Methods (Merged) ---

  private generateString(schema: any): string {
    // From 'Incoming'
    if (schema.enum && schema.enum.length > 0) {
      return faker.helpers.arrayElement(schema.enum);
    }
    // From 'Current' (faker-based)
    if (schema.format) {
      switch (schema.format) {
        case 'email': return faker.internet.email();
        case 'uuid': return faker.string.uuid();
        case 'firstName': return faker.person.firstName();
        case 'lastName': return faker.person.lastName();
        case 'fullName': return faker.person.fullName();
        case 'url': return faker.internet.url();
        case 'paragraph': return faker.lorem.paragraph();
        case 'sentence': return faker.lorem.sentence();
        case 'word': return faker.lorem.word();
      }
    }
    return faker.lorem.word();
  }

  private generateNumber(schema: any): number {
    // From 'Current' (faker-based)
    return faker.number.int({
      min: schema.minimum || schema.min || 0,
      max: schema.maximum || schema.max || 100,
    });
  }

  private generateBoolean(): boolean {
    // From 'Current' (faker-based)
    return faker.datatype.boolean();
  }

  private generateArray(schema: any): any[] {
    // From 'Current' (faker-based)
    const count = faker.number.int({ min: schema.minItems || 1, max: schema.maxItems || 5 });
    const itemsSchema = schema.items || {}; // Get item schema
    return Array.from({ length: count }, () => this.generate(itemsSchema));
  }

  private generateObject(schema: any): any {
    // From 'Incoming' (structure is good)
    const obj: any = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = this.generate(propSchema);
      }
    }
    return obj;
  }
}