// Message related enums
export enum MessageRole {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  ASSISTANT = 'ASSISTANT',
  TOOL = 'TOOL',
  FUNCTION = 'FUNCTION'
}

export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  COMMAND = 'COMMAND',
  STREAM = 'STREAM',
  CODE = 'CODE',
  MARKDOWN = 'MARKDOWN'
}

export enum MessageStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  ERROR = 'ERROR',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED'
}

// Verification levels
export enum VerificationLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE'
}