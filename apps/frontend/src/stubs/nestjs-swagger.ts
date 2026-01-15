/**
 * NestJS Swagger stub for browser builds
 *
 * This file stubs out @nestjs/swagger which is a Node.js-only module
 * that is often imported in shared DTOs.
 */

// Decorators
export const ApiProperty = () => (target: unknown, key: string | symbol) => {};
export const ApiPropertyOptional = () => (target: unknown, key: string | symbol) => {};
export const ApiTags = () => (target: unknown) => {};
export const ApiOperation =
  () => (target: unknown, key: string | symbol, descriptor: PropertyDescriptor) => {};
export const ApiResponse =
  () => (target: unknown, key: string | symbol, descriptor: PropertyDescriptor) => {};
export const ApiBearerAuth = () => (target: unknown) => {};
export const ApiHeader = () => (target: unknown) => {};
export const ApiParam =
  () => (target: unknown, key: string | symbol, descriptor: PropertyDescriptor) => {};
export const ApiQuery =
  () => (target: unknown, key: string | symbol, descriptor: PropertyDescriptor) => {};
export const ApiBody =
  () => (target: unknown, key: string | symbol, descriptor: PropertyDescriptor) => {};
export const ApiConsumes = () => (target: unknown) => {};
export const ApiProduces = () => (target: unknown) => {};
export const ApiExtraModels = () => (target: unknown) => {};

// Mapped types (often used in DTOs)
export class PartialType {}
export class PickType {}
export class OmitType {}
export class IntersectionType {}

// Enums/Constants
export const ApiParamType = {};

export class DocumentBuilder {
  setTitle() {
    return this;
  }
  setDescription() {
    return this;
  }
  setVersion() {
    return this;
  }
  addTag() {
    return this;
  }
  addBearerAuth() {
    return this;
  }
  build() {
    return {};
  }
}

export class SwaggerModule {
  static createDocument() {
    return {};
  }
  static setup() {}
}

export default {};
