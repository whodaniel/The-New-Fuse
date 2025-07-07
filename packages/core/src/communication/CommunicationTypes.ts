import { z } from 'zod';
    COMMAND = 'COMMAND'';
    QUERY = 'QUERY'';
    RESPONSE = 'RESPONSE'';
    EVENT = 'EVENT'';
    ERROR = 'ERROR'';
    HEARTBEAT = 'HEARTBEAT'';
    PENDING = 'PENDING'';
    SENT = 'SENT'';
    DELIVERED = 'DELIVERED'';
    READ = 'READ'';
    FAILED = 'FAILED'';
    type: 'DIRECT' | 'BROADCAST' | 'TOPIC'
    type: z.enum(['DIRECT', 'BROADCAST', 'TOPIC'