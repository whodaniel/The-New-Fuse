export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
export declare class MessageValidator {
  validate(message: AgentMessage): ValidationResult;
  private isValidMessageType;
  private isValidPriority;
}
