export interface BaseEntity {
  // Implementation needed
}
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  // Implementation needed
}
  message: string;
  code: string;
  details?: unknown;
}

export interface ServiceResponse<T> {
  // Implementation needed
}
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}
