import { faker } from '@faker-js/faker';

export class TestDataGenerator {
  generate(schema: any): any {
    if (typeof schema === 'string') {
      return this.generateFromString(schema);
    }
    
    if (Array.isArray(schema)) {
      return this.generateFromArray(schema);
    }
    
    if (typeof schema === 'object' && schema !== null) {
      return this.generateFromObject(schema);
    }
    
    return schema;
  }

  private generateFromString(type: string): any {
    switch (type.toLowerCase()) {
      case 'string':
        return faker.lorem.word();
      case 'number':
        return faker.number.int({ min: 1, max: 100 });
      case 'boolean':
        return faker.datatype.boolean();
      case 'email':
        return faker.internet.email();
      case 'url':
        return faker.internet.url();
      case 'date':
        return faker.date.recent();
      case 'uuid':
        return faker.string.uuid();
      case 'name':
        return faker.person.fullName();
      case 'address':
        return faker.location.streetAddress();
      case 'phone':
        return faker.phone.number();
      default:
        return faker.lorem.word();
    }
  }

  private generateFromArray(schema: any[]): any {
    if (schema.length === 0) {
      return [];
    }
    
    const count = faker.number.int({ min: 1, max: 5 });
    return Array.from({ length: count }, () => this.generate(schema[0]));
  }

  private generateFromObject(schema: any): any {
    const result: any = {};
    
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const config = value as any;
        
        if (config.type) {
          switch (config.type) {
            case 'string':
              result[key] = config.format 
                ? this.generateFromString(config.format)
                : faker.lorem.word();
              break;
            case 'number':
              result[key] = faker.number.int({ 
                min: config.min || 1, 
                max: config.max || 100 
              });
              break;
            case 'boolean':
              result[key] = faker.datatype.boolean();
              break;
            case 'array':
              result[key] = this.generateFromArray(config.items || [{}]);
              break;
            case 'object':
              result[key] = this.generateFromObject(config.properties || {});
              break;
            default:
              result[key] = this.generateFromString(config.type);
          }
        } else {
          result[key] = this.generate(value);
        }
      } else {
        result[key] = this.generate(value);
      }
    }
    
    return result;
  }

  generateMany(schema: any, count: number): any[] {
    return Array.from({ length: count }, () => this.generate(schema));
  }
}