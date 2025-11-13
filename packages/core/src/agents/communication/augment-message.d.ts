import { LoggingService } from '../../services/LoggingService';
import { FullAgentMessage } from './agent-message';
export interface MessageAugmentation {
    id: string;
    original_message_id: string;
    augmentation_type: AugmentationType;
    data: any;
    metadata: Record<string, any>;
    created_at: Date;
    applied_at?: Date;
    status: 'pending' | 'applied' | 'failed' | 'expired';
}
export type AugmentationType = 'priority_boost' | 'content_enhancement' | 'route_optimization' | 'security_upgrade' | 'compression' | 'encryption' | 'translation' | 'formatting' | 'validation' | 'analytics_tracking';
export interface AugmentationRule {
    id: string;
    name: string;
    description: string;
    trigger_conditions: AugmentationTrigger[];
    augmentation_type: AugmentationType;
    configuration: Record<string, any>;
    priority: number;
    enabled: boolean;
    created_at: Date;
    last_applied: Date;
    success_count: number;
    failure_count: number;
}
export interface AugmentationTrigger {
    type: 'message_type' | 'sender_pattern' | 'recipient_pattern' | 'content_pattern' | 'priority_level' | 'time_window' | 'size_threshold';
    operator: 'equals' | 'contains' | 'regex' | 'greater_than' | 'less_than' | 'between';
    value: any;
    additional_params?: Record<string, any>;
}
export interface AugmentationResult {
    success: boolean;
    augmentation_id: string;
    original_message: FullAgentMessage;
    augmented_message: FullAgentMessage;
    applied_augmentations: MessageAugmentation[];
    processing_time: number;
    errors?: string[];
    warnings?: string[];
}
export interface AugmentationStats {
    total_processed: number;
    total_augmented: number;
    augmentation_rate: number;
    augmentations_by_type: Record<AugmentationType, number>;
    average_processing_time: number;
    success_rate: number;
    active_rules: number;
    pending_augmentations: number;
}
export declare class MessageAugmentationService {
    private readonly logger;
    private augmentations;
    private rules;
    private processing_queue;
    private stats;
    private processing_times;
    constructor(logger: LoggingService);
    /**
     * Initialize augmentation statistics
     */
    private initializeStats;
    /**
     * Initialize default augmentation rules
     */
    private initializeDefaultRules;
    /**
     * Find rules that match a message
     */
    private findMatchingRules;
    /**
     * Evaluate a trigger condition against a message
     */
    private evaluateTriggerCondition;
    /**
     * Evaluate a condition with operator
     */
    private evaluateCondition;
    /**
     * Create an augmentation for a message
     */
    private createAugmentation;
}
//# sourceMappingURL=augment-message.d.ts.map