/**
 * NestJS Swagger stub for browser builds
 *
 * This file stubs out @nestjs/swagger which is a Node.js-only module
 * that is often imported in shared DTOs.
 */

// Decorators
export const ApiProperty = () => (_target: unknown, _key: string | symbol) => {};
export const ApiPropertyOptional = () => (_target: unknown, _key: string | symbol) => {};
export const ApiTags = () => (_target: unknown) => {};
export const ApiOperation =
  () => (_target: unknown, _key: string | symbol, _descriptor: PropertyDescriptor) => {};
export const ApiResponse =
  () => (_target: unknown, _key: string | symbol, _descriptor: PropertyDescriptor) => {};
export const ApiBearerAuth = () => (_target: unknown) => {};
export const ApiHeader = () => (_target: unknown) => {};
export const ApiParam =
  () => (_target: unknown, _key: string | symbol, _descriptor: PropertyDescriptor) => {};
export const ApiQuery =
  () => (_target: unknown, _key: string | symbol, _descriptor: PropertyDescriptor) => {};
export const ApiBody =
  () => (_target: unknown, _key: string | symbol, _descriptor: PropertyDescriptor) => {};
export const ApiConsumes = () => (_target: unknown) => {};
export const ApiProduces = () => (_target: unknown) => {};
export const ApiExtraModels = () => (_target: unknown) => {};

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
