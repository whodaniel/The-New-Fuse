/**
 * class-validator stub for browser builds
 *
 * This file stubs out class-validator which is a Node.js-only module
 * that is often imported in shared DTOs for validation decorators.
 */

// Property decorators - return no-op functions
export const IsString = () => (target: unknown, key: string | symbol) => {};
export const IsNumber = () => (target: unknown, key: string | symbol) => {};
export const IsInt = () => (target: unknown, key: string | symbol) => {};
export const IsBoolean = () => (target: unknown, key: string | symbol) => {};
export const IsArray = () => (target: unknown, key: string | symbol) => {};
export const IsEnum = () => (target: unknown, key: string | symbol) => {};
export const IsOptional = () => (target: unknown, key: string | symbol) => {};
export const IsNotEmpty = () => (target: unknown, key: string | symbol) => {};
export const IsEmpty = () => (target: unknown, key: string | symbol) => {};
export const IsDefined = () => (target: unknown, key: string | symbol) => {};
export const IsDate = () => (target: unknown, key: string | symbol) => {};
export const IsEmail = () => (target: unknown, key: string | symbol) => {};
export const IsUrl = () => (target: unknown, key: string | symbol) => {};
export const IsUUID = () => (target: unknown, key: string | symbol) => {};
export const IsIn = () => (target: unknown, key: string | symbol) => {};
export const IsNotIn = () => (target: unknown, key: string | symbol) => {};
export const Length = () => (target: unknown, key: string | symbol) => {};
export const MinLength = () => (target: unknown, key: string | symbol) => {};
export const MaxLength = () => (target: unknown, key: string | symbol) => {};
export const Min = () => (target: unknown, key: string | symbol) => {};
export const Max = () => (target: unknown, key: string | symbol) => {};
export const Matches = () => (target: unknown, key: string | symbol) => {};
export const ValidateNested = () => (target: unknown, key: string | symbol) => {};
export const ValidateIf = () => (target: unknown, key: string | symbol) => {};
export const IsObject = () => (target: unknown, key: string | symbol) => {};
export const IsPositive = () => (target: unknown, key: string | symbol) => {};
export const IsNegative = () => (target: unknown, key: string | symbol) => {};
export const ArrayMinSize = () => (target: unknown, key: string | symbol) => {};
export const ArrayMaxSize = () => (target: unknown, key: string | symbol) => {};
export const ArrayUnique = () => (target: unknown, key: string | symbol) => {};
export const ArrayNotEmpty = () => (target: unknown, key: string | symbol) => {};
export const IsDateString = () => (target: unknown, key: string | symbol) => {};
export const IsNumberString = () => (target: unknown, key: string | symbol) => {};
export const IsBooleanString = () => (target: unknown, key: string | symbol) => {};

// Class decorators
export const ValidatorConstraint = () => (target: unknown) => {};

// Functions (no-op implementations)
export const validate = async () => [];
export const validateSync = () => [];
export const validateOrReject = async () => {};

// Types (empty exports for type compatibility)
export class ValidationError {}
export type ValidatorOptions = Record<string, unknown>;

export default {};
