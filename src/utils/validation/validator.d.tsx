export type ValidationRule<T> = (value: T) => boolean | string;
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
export declare class Validator<T extends Record<string, any>> {
  private rules;
  addRule<K extends keyof T>(field: K, rule: ValidationRule<T[K]>): this;
  validate(data: T): ValidationResult;
}
export default Validator;
