export interface ApiModel {
  id: string;
  name: string;
  version: string;
  description?: string;
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
}
export interface ApiEndpoint {
  path: string;
  method: string;
  description?: string;
  parameters?: ApiParameter[];
  responses: Record<string, ApiResponse>;
}
export interface ApiParameter {
  name: string;
  in: "path" | "query" | "header" | "body";
  required: boolean;
  type: string;
  description?: string;
}
export interface ApiResponse {
  description: string;
  schema?: ApiSchema;
}
export interface ApiSchema {
  type: string;
  properties?: Record<string, ApiSchemaProperty>;
  required?: string[];
}
export interface ApiSchemaProperty {
  type: string;
  description?: string;
  format?: string;
}
export {};
export {};
export {};
export {};
