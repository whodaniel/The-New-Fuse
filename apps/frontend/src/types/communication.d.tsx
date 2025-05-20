export interface CommunicationOptions {
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
}
export interface PublishOptions {
    priority?: 'high' | 'normal' | 'low';
    expiration?: number;
    metadata?: Record<string, unknown>;
}
export interface Publication {
    id: string;
    topic: string;
    message: unknown;
    timestamp: string;
    priority: 'high' | 'normal' | 'low';
    metadata?: Record<string, unknown>;
}
export interface PublicationError {
    publication: Publication;
    error: string;
}
export interface PublicationTimeout {
    publicationId: string;
}
export interface CommunicationEvents {
    'published': (publication: Publication) => void;
    'error': (error: PublicationError) => void;
    'timeout': (timeout: PublicationTimeout) => void;
}
