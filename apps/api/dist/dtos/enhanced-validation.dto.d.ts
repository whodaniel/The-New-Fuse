export declare class PaginationDto {
    pageSize?: number;
    page?: number;
    sortOrder?: 'asc' | 'desc';
    sortBy?: string;
}
export declare class SearchDto {
    search?: string;
    tags?: string[];
}
export declare class ContactDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message: string;
}
export declare class UserProfileDto {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    dateOfBirth?: string;
    bio?: string;
    company?: string;
    jobTitle?: string;
    website?: string;
    interests?: string[];
}
export declare class AddressDto {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
export declare class FileUploadDto {
    fileName: string;
    mimeType: string;
    size: number;
    description?: string;
    altText?: string;
}
export declare class NotificationDto {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    metadata?: Record<string, unknown>;
}
export declare class ApiKeyDto {
    name: string;
    description?: string;
    permissions?: string[];
    expiresAt?: string;
}
export declare class LogQueryDto {
    startDate?: string;
    endDate?: string;
    level?: 'error' | 'warn' | 'info' | 'debug';
    source?: string;
    search?: string;
}
export declare class WebhookDto {
    name: string;
    url: string;
    method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
    events?: string[];
    headers?: Record<string, string>;
    isActive?: boolean;
}
export declare class FeedbackDto {
    type: string;
    content: string;
    rating?: number;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=enhanced-validation.dto.d.ts.map