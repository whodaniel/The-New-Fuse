import { Injectable } from '@nestjs/common';

@Injectable()
export class TestDataGenerator {
  generate(schema: any): any {
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
        return null;
    }
  }

  private generateString(schema: any): string {
    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[Math.floor(Math.random() * schema.enum.length)];
    }
    return 'test-string-' + Math.random().toString(36).substring(7);
  }

  private generateNumber(schema: any): number {
    const min = schema.minimum || 0;
    const max = schema.maximum || 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateBoolean(): boolean {
    return Math.random() < 0.5;
  }

  private generateArray(schema: any): any[] {
    const length = schema.minItems || 3;
    const items: any[] = [];
    for (let i = 0; i < length; i++) {
      if (schema.items) {
        items.push(this.generate(schema.items));
      }
    }
    return items;
  }

  private generateObject(schema: any): any {
    const obj: any = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = this.generate(propSchema);
      }
    }
    return obj;
  }
}
