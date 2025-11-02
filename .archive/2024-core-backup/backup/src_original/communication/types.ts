export enum MessageType { COMMAND = 'command,'';
 STATE_UPDATE= 'state_update'';
 SENT= 'sent'';
READ= 'read,'';
 PROCESSED= 'processed'';
 name:string;type direct|broadcast'
  qos?: number'
    maxRetries: 'number;'
   typefixed'
export typeMessageValidationErrorCode= '';
|SIZE_EXCEEDED'
  | SCHEMA_VALIDATION_ERROR'
|FUTURE_TIMESTAMP'
  | INVALID_RETRIES'
|MAX_RETRIES_EXCEEDED'
  | CORRELATION_DEPTH_EXCEEDED'
 |MISSING_SIGNATURE'
|INVALID_SIGNATURE'
|UNKNOWN_ERROR'