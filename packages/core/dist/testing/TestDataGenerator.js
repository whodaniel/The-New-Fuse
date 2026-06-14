var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
let TestDataGenerator = class TestDataGenerator {
    /**
     * Generates test data based on a schema.
     * The schema can be a simple string (e.g., 'email'),
     * an array (e.g., ['string']), or a schema object
     * (e.g., { type: 'object', properties: { ... } })
     */
    generate(schema) {
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
    generateMany(schema, count) {
        return Array.from({ length: count }, () => this.generate(schema));
    }
    // --- Private Helper Methods (Merged) ---
    generateString(schema) {
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
    generateNumber(schema) {
        // From 'Current' (faker-based)
        return faker.number.int({
            min: schema.minimum || schema.min || 0,
            max: schema.maximum || schema.max || 100,
        });
    }
    generateBoolean() {
        // From 'Current' (faker-based)
        return faker.datatype.boolean();
    }
    generateArray(schema) {
        // From 'Current' (faker-based)
        const count = faker.number.int({ min: schema.minItems || 1, max: schema.maxItems || 5 });
        const itemsSchema = schema.items || {}; // Get item schema
        return Array.from({ length: count }, () => this.generate(itemsSchema));
    }
    generateObject(schema) {
        // From 'Incoming' (structure is good)
        const obj = {};
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                obj[key] = this.generate(propSchema);
            }
        }
        return obj;
    }
};
TestDataGenerator = __decorate([
    Injectable()
], TestDataGenerator);
export { TestDataGenerator };
//# sourceMappingURL=TestDataGenerator.js.map