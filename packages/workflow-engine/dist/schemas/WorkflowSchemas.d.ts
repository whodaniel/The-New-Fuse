import { z } from 'zod';
import { WorkflowStatus, WorkflowExecutionStatus, AgentType, WorkflowNodeType, VariableType, VariableScope, TriggerType, NodeExecutionStatus, WorkflowEventType, WorkflowSortField, ExecutionSortField } from '../types/WorkflowTypes.js';
export declare const WorkflowStatusSchema: z.ZodNativeEnum<typeof WorkflowStatus>;
export declare const WorkflowExecutionStatusSchema: z.ZodNativeEnum<typeof WorkflowExecutionStatus>;
export declare const AgentTypeSchema: z.ZodNativeEnum<typeof AgentType>;
export declare const WorkflowNodeTypeSchema: z.ZodNativeEnum<typeof WorkflowNodeType>;
export declare const VariableTypeSchema: z.ZodNativeEnum<typeof VariableType>;
export declare const VariableScopeSchema: z.ZodNativeEnum<typeof VariableScope>;
export declare const TriggerTypeSchema: z.ZodNativeEnum<typeof TriggerType>;
export declare const NodeExecutionStatusSchema: z.ZodNativeEnum<typeof NodeExecutionStatus>;
export declare const WorkflowEventTypeSchema: z.ZodNativeEnum<typeof WorkflowEventType>;
export declare const WorkflowSortFieldSchema: z.ZodNativeEnum<typeof WorkflowSortField>;
export declare const ExecutionSortFieldSchema: z.ZodNativeEnum<typeof ExecutionSortField>;
export declare const PositionSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export declare const NodeConfigurationSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const VariableValidationSchema: z.ZodObject<{
    pattern: z.ZodOptional<z.ZodString>;
    minLength: z.ZodOptional<z.ZodNumber>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    required: z.ZodOptional<z.ZodBoolean>;
    enum: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    pattern?: string | undefined;
    required?: boolean | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    min?: number | undefined;
    max?: number | undefined;
    enum?: any[] | undefined;
}, {
    pattern?: string | undefined;
    required?: boolean | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    min?: number | undefined;
    max?: number | undefined;
    enum?: any[] | undefined;
}>;
export declare const WorkflowVariableSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof VariableType>;
    defaultValue: z.ZodOptional<z.ZodAny>;
    description: z.ZodOptional<z.ZodString>;
    required: z.ZodBoolean;
    scope: z.ZodNativeEnum<typeof VariableScope>;
    validation: z.ZodOptional<z.ZodObject<{
        pattern: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        required: z.ZodOptional<z.ZodBoolean>;
        enum: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        pattern?: string | undefined;
        required?: boolean | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        enum?: any[] | undefined;
    }, {
        pattern?: string | undefined;
        required?: boolean | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        enum?: any[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    type: VariableType;
    required: boolean;
    scope: VariableScope;
    description?: string | undefined;
    defaultValue?: any;
    validation?: {
        pattern?: string | undefined;
        required?: boolean | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        enum?: any[] | undefined;
    } | undefined;
}, {
    name: string;
    id: string;
    type: VariableType;
    required: boolean;
    scope: VariableScope;
    description?: string | undefined;
    defaultValue?: any;
    validation?: {
        pattern?: string | undefined;
        required?: boolean | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        enum?: any[] | undefined;
    } | undefined;
}>;
export declare const NodeInputSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof VariableType>;
    required: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    defaultValue: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    type: VariableType;
    required: boolean;
    description?: string | undefined;
    defaultValue?: any;
}, {
    name: string;
    id: string;
    type: VariableType;
    required: boolean;
    description?: string | undefined;
    defaultValue?: any;
}>;
export declare const NodeOutputSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof VariableType>;
    description: z.ZodOptional<z.ZodString>;
    schema: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    type: VariableType;
    description?: string | undefined;
    schema?: any;
}, {
    name: string;
    id: string;
    type: VariableType;
    description?: string | undefined;
    schema?: any;
}>;
export declare const NodeConditionSchema: z.ZodObject<{
    id: z.ZodString;
    expression: z.ZodString;
    outputId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expression: string;
    id: string;
    outputId: string;
    description?: string | undefined;
}, {
    expression: string;
    id: string;
    outputId: string;
    description?: string | undefined;
}>;
export declare const RetryPolicySchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    maxAttempts: z.ZodNumber;
    delayMs: z.ZodNumber;
    backoffMultiplier: z.ZodNumber;
    maxDelayMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
    maxDelayMs: number;
}, {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
    maxDelayMs: number;
}>;
export declare const WorkflowNodeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof WorkflowNodeType>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    inputs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodNativeEnum<typeof VariableType>;
        required: z.ZodBoolean;
        description: z.ZodOptional<z.ZodString>;
        defaultValue: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        description?: string | undefined;
        defaultValue?: any;
    }, {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        description?: string | undefined;
        defaultValue?: any;
    }>, "many">;
    outputs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodNativeEnum<typeof VariableType>;
        description: z.ZodOptional<z.ZodString>;
        schema: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        type: VariableType;
        description?: string | undefined;
        schema?: any;
    }, {
        name: string;
        id: string;
        type: VariableType;
        description?: string | undefined;
        schema?: any;
    }>, "many">;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        expression: z.ZodString;
        outputId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        expression: string;
        id: string;
        outputId: string;
        description?: string | undefined;
    }, {
        expression: string;
        id: string;
        outputId: string;
        description?: string | undefined;
    }>, "many">>;
    retry: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        maxAttempts: z.ZodNumber;
        delayMs: z.ZodNumber;
        backoffMultiplier: z.ZodNumber;
        maxDelayMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    }, {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    type: WorkflowNodeType;
    metadata: Record<string, any>;
    position: {
        x: number;
        y: number;
    };
    config: Record<string, any>;
    inputs: {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        description?: string | undefined;
        defaultValue?: any;
    }[];
    outputs: {
        name: string;
        id: string;
        type: VariableType;
        description?: string | undefined;
        schema?: any;
    }[];
    retry?: {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    } | undefined;
    timeout?: number | undefined;
    description?: string | undefined;
    conditions?: {
        expression: string;
        id: string;
        outputId: string;
        description?: string | undefined;
    }[] | undefined;
}, {
    name: string;
    id: string;
    type: WorkflowNodeType;
    metadata: Record<string, any>;
    position: {
        x: number;
        y: number;
    };
    config: Record<string, any>;
    inputs: {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        description?: string | undefined;
        defaultValue?: any;
    }[];
    outputs: {
        name: string;
        id: string;
        type: VariableType;
        description?: string | undefined;
        schema?: any;
    }[];
    retry?: {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    } | undefined;
    timeout?: number | undefined;
    description?: string | undefined;
    conditions?: {
        expression: string;
        id: string;
        outputId: string;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const WorkflowConnectionSchema: z.ZodObject<{
    id: z.ZodString;
    sourceNodeId: z.ZodString;
    sourceOutputId: z.ZodString;
    targetNodeId: z.ZodString;
    targetInputId: z.ZodString;
    condition: z.ZodOptional<z.ZodString>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: Record<string, any>;
    sourceNodeId: string;
    sourceOutputId: string;
    targetNodeId: string;
    targetInputId: string;
    condition?: string | undefined;
}, {
    id: string;
    metadata: Record<string, any>;
    sourceNodeId: string;
    sourceOutputId: string;
    targetNodeId: string;
    targetInputId: string;
    condition?: string | undefined;
}>;
export declare const TriggerConfigurationSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const CronScheduleSchema: z.ZodObject<{
    expression: z.ZodString;
    timezone: z.ZodOptional<z.ZodString>;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    expression: string;
    enabled: boolean;
    timezone?: string | undefined;
}, {
    expression: string;
    enabled: boolean;
    timezone?: string | undefined;
}>;
export declare const TriggerConditionSchema: z.ZodObject<{
    field: z.ZodString;
    operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "regex"]>;
    value: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
    value?: any;
}, {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
    value?: any;
}>;
export declare const WorkflowTriggerSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof TriggerType>;
    name: z.ZodString;
    enabled: z.ZodBoolean;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    schedule: z.ZodOptional<z.ZodObject<{
        expression: z.ZodString;
        timezone: z.ZodOptional<z.ZodString>;
        enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        expression: string;
        enabled: boolean;
        timezone?: string | undefined;
    }, {
        expression: string;
        enabled: boolean;
        timezone?: string | undefined;
    }>>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "regex"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
        value?: any;
    }, {
        field: string;
        operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
        value?: any;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    enabled: boolean;
    type: TriggerType;
    config: Record<string, any>;
    conditions?: {
        field: string;
        operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
        value?: any;
    }[] | undefined;
    schedule?: {
        expression: string;
        enabled: boolean;
        timezone?: string | undefined;
    } | undefined;
}, {
    name: string;
    id: string;
    enabled: boolean;
    type: TriggerType;
    config: Record<string, any>;
    conditions?: {
        field: string;
        operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
        value?: any;
    }[] | undefined;
    schedule?: {
        expression: string;
        enabled: boolean;
        timezone?: string | undefined;
    } | undefined;
}>;
export declare const NotificationChannelSchema: z.ZodObject<{
    type: z.ZodEnum<["email", "slack", "webhook", "relay"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: "webhook" | "email" | "slack" | "relay";
    config: Record<string, any>;
}, {
    type: "webhook" | "email" | "slack" | "relay";
    config: Record<string, any>;
}>;
export declare const NotificationSettingsSchema: z.ZodObject<{
    onStart: z.ZodBoolean;
    onComplete: z.ZodBoolean;
    onError: z.ZodBoolean;
    channels: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["email", "slack", "webhook", "relay"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "webhook" | "email" | "slack" | "relay";
        config: Record<string, any>;
    }, {
        type: "webhook" | "email" | "slack" | "relay";
        config: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
    channels: {
        type: "webhook" | "email" | "slack" | "relay";
        config: Record<string, any>;
    }[];
}, {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
    channels: {
        type: "webhook" | "email" | "slack" | "relay";
        config: Record<string, any>;
    }[];
}>;
export declare const ErrorHandlingPolicySchema: z.ZodObject<{
    onError: z.ZodEnum<["stop", "continue", "retry", "skip"]>;
    captureErrors: z.ZodBoolean;
    notifyOnError: z.ZodBoolean;
    fallbackWorkflowId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    onError: "stop" | "continue" | "retry" | "skip";
    captureErrors: boolean;
    notifyOnError: boolean;
    fallbackWorkflowId?: string | undefined;
}, {
    onError: "stop" | "continue" | "retry" | "skip";
    captureErrors: boolean;
    notifyOnError: boolean;
    fallbackWorkflowId?: string | undefined;
}>;
export declare const LoggingSettingsSchema: z.ZodObject<{
    level: z.ZodEnum<["none", "error", "warn", "info", "debug"]>;
    includeInputs: z.ZodBoolean;
    includeOutputs: z.ZodBoolean;
    includeTiming: z.ZodBoolean;
    retentionDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    level: "none" | "error" | "warn" | "info" | "debug";
    includeInputs: boolean;
    includeOutputs: boolean;
    includeTiming: boolean;
    retentionDays: number;
}, {
    level: "none" | "error" | "warn" | "info" | "debug";
    includeInputs: boolean;
    includeOutputs: boolean;
    includeTiming: boolean;
    retentionDays: number;
}>;
export declare const WorkflowSettingsSchema: z.ZodObject<{
    parallel: z.ZodBoolean;
    maxConcurrentExecutions: z.ZodNumber;
    timeoutMs: z.ZodNumber;
    retryPolicy: z.ZodObject<{
        enabled: z.ZodBoolean;
        maxAttempts: z.ZodNumber;
        delayMs: z.ZodNumber;
        backoffMultiplier: z.ZodNumber;
        maxDelayMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    }, {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    }>;
    errorHandling: z.ZodObject<{
        onError: z.ZodEnum<["stop", "continue", "retry", "skip"]>;
        captureErrors: z.ZodBoolean;
        notifyOnError: z.ZodBoolean;
        fallbackWorkflowId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        onError: "stop" | "continue" | "retry" | "skip";
        captureErrors: boolean;
        notifyOnError: boolean;
        fallbackWorkflowId?: string | undefined;
    }, {
        onError: "stop" | "continue" | "retry" | "skip";
        captureErrors: boolean;
        notifyOnError: boolean;
        fallbackWorkflowId?: string | undefined;
    }>;
    logging: z.ZodObject<{
        level: z.ZodEnum<["none", "error", "warn", "info", "debug"]>;
        includeInputs: z.ZodBoolean;
        includeOutputs: z.ZodBoolean;
        includeTiming: z.ZodBoolean;
        retentionDays: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        level: "none" | "error" | "warn" | "info" | "debug";
        includeInputs: boolean;
        includeOutputs: boolean;
        includeTiming: boolean;
        retentionDays: number;
    }, {
        level: "none" | "error" | "warn" | "info" | "debug";
        includeInputs: boolean;
        includeOutputs: boolean;
        includeTiming: boolean;
        retentionDays: number;
    }>;
    notifications: z.ZodObject<{
        onStart: z.ZodBoolean;
        onComplete: z.ZodBoolean;
        onError: z.ZodBoolean;
        channels: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["email", "slack", "webhook", "relay"]>;
            config: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type: "webhook" | "email" | "slack" | "relay";
            config: Record<string, any>;
        }, {
            type: "webhook" | "email" | "slack" | "relay";
            config: Record<string, any>;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        onStart: boolean;
        onComplete: boolean;
        onError: boolean;
        channels: {
            type: "webhook" | "email" | "slack" | "relay";
            config: Record<string, any>;
        }[];
    }, {
        onStart: boolean;
        onComplete: boolean;
        onError: boolean;
        channels: {
            type: "webhook" | "email" | "slack" | "relay";
            config: Record<string, any>;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    parallel: boolean;
    timeoutMs: number;
    maxConcurrentExecutions: number;
    retryPolicy: {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    };
    errorHandling: {
        onError: "stop" | "continue" | "retry" | "skip";
        captureErrors: boolean;
        notifyOnError: boolean;
        fallbackWorkflowId?: string | undefined;
    };
    logging: {
        level: "none" | "error" | "warn" | "info" | "debug";
        includeInputs: boolean;
        includeOutputs: boolean;
        includeTiming: boolean;
        retentionDays: number;
    };
    notifications: {
        onStart: boolean;
        onComplete: boolean;
        onError: boolean;
        channels: {
            type: "webhook" | "email" | "slack" | "relay";
            config: Record<string, any>;
        }[];
    };
}, {
    parallel: boolean;
    timeoutMs: number;
    maxConcurrentExecutions: number;
    retryPolicy: {
        enabled: boolean;
        maxAttempts: number;
        delayMs: number;
        backoffMultiplier: number;
        maxDelayMs: number;
    };
    errorHandling: {
        onError: "stop" | "continue" | "retry" | "skip";
        captureErrors: boolean;
        notifyOnError: boolean;
        fallbackWorkflowId?: string | undefined;
    };
    logging: {
        level: "none" | "error" | "warn" | "info" | "debug";
        includeInputs: boolean;
        includeOutputs: boolean;
        includeTiming: boolean;
        retentionDays: number;
    };
    notifications: {
        onStart: boolean;
        onComplete: boolean;
        onError: boolean;
        channels: {
            type: "webhook" | "email" | "slack" | "relay";
            config: Record<string, any>;
        }[];
    };
}>;
export declare const WorkflowDefinitionSchema: z.ZodObject<{
    version: z.ZodString;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodNativeEnum<typeof WorkflowNodeType>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        inputs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodNativeEnum<typeof VariableType>;
            required: z.ZodBoolean;
            description: z.ZodOptional<z.ZodString>;
            defaultValue: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            description?: string | undefined;
            defaultValue?: any;
        }, {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            description?: string | undefined;
            defaultValue?: any;
        }>, "many">;
        outputs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodNativeEnum<typeof VariableType>;
            description: z.ZodOptional<z.ZodString>;
            schema: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            type: VariableType;
            description?: string | undefined;
            schema?: any;
        }, {
            name: string;
            id: string;
            type: VariableType;
            description?: string | undefined;
            schema?: any;
        }>, "many">;
        conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            expression: z.ZodString;
            outputId: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            expression: string;
            id: string;
            outputId: string;
            description?: string | undefined;
        }, {
            expression: string;
            id: string;
            outputId: string;
            description?: string | undefined;
        }>, "many">>;
        retry: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            maxAttempts: z.ZodNumber;
            delayMs: z.ZodNumber;
            backoffMultiplier: z.ZodNumber;
            maxDelayMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        }, {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        }>>;
        timeout: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        type: WorkflowNodeType;
        metadata: Record<string, any>;
        position: {
            x: number;
            y: number;
        };
        config: Record<string, any>;
        inputs: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            description?: string | undefined;
            defaultValue?: any;
        }[];
        outputs: {
            name: string;
            id: string;
            type: VariableType;
            description?: string | undefined;
            schema?: any;
        }[];
        retry?: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        } | undefined;
        timeout?: number | undefined;
        description?: string | undefined;
        conditions?: {
            expression: string;
            id: string;
            outputId: string;
            description?: string | undefined;
        }[] | undefined;
    }, {
        name: string;
        id: string;
        type: WorkflowNodeType;
        metadata: Record<string, any>;
        position: {
            x: number;
            y: number;
        };
        config: Record<string, any>;
        inputs: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            description?: string | undefined;
            defaultValue?: any;
        }[];
        outputs: {
            name: string;
            id: string;
            type: VariableType;
            description?: string | undefined;
            schema?: any;
        }[];
        retry?: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        } | undefined;
        timeout?: number | undefined;
        description?: string | undefined;
        conditions?: {
            expression: string;
            id: string;
            outputId: string;
            description?: string | undefined;
        }[] | undefined;
    }>, "many">;
    connections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sourceNodeId: z.ZodString;
        sourceOutputId: z.ZodString;
        targetNodeId: z.ZodString;
        targetInputId: z.ZodString;
        condition: z.ZodOptional<z.ZodString>;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        metadata: Record<string, any>;
        sourceNodeId: string;
        sourceOutputId: string;
        targetNodeId: string;
        targetInputId: string;
        condition?: string | undefined;
    }, {
        id: string;
        metadata: Record<string, any>;
        sourceNodeId: string;
        sourceOutputId: string;
        targetNodeId: string;
        targetInputId: string;
        condition?: string | undefined;
    }>, "many">;
    variables: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodNativeEnum<typeof VariableType>;
        defaultValue: z.ZodOptional<z.ZodAny>;
        description: z.ZodOptional<z.ZodString>;
        required: z.ZodBoolean;
        scope: z.ZodNativeEnum<typeof VariableScope>;
        validation: z.ZodOptional<z.ZodObject<{
            pattern: z.ZodOptional<z.ZodString>;
            minLength: z.ZodOptional<z.ZodNumber>;
            maxLength: z.ZodOptional<z.ZodNumber>;
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            required: z.ZodOptional<z.ZodBoolean>;
            enum: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            pattern?: string | undefined;
            required?: boolean | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            min?: number | undefined;
            max?: number | undefined;
            enum?: any[] | undefined;
        }, {
            pattern?: string | undefined;
            required?: boolean | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            min?: number | undefined;
            max?: number | undefined;
            enum?: any[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        scope: VariableScope;
        description?: string | undefined;
        defaultValue?: any;
        validation?: {
            pattern?: string | undefined;
            required?: boolean | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            min?: number | undefined;
            max?: number | undefined;
            enum?: any[] | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        scope: VariableScope;
        description?: string | undefined;
        defaultValue?: any;
        validation?: {
            pattern?: string | undefined;
            required?: boolean | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            min?: number | undefined;
            max?: number | undefined;
            enum?: any[] | undefined;
        } | undefined;
    }>, "many">;
    triggers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodNativeEnum<typeof TriggerType>;
        name: z.ZodString;
        enabled: z.ZodBoolean;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        schedule: z.ZodOptional<z.ZodObject<{
            expression: z.ZodString;
            timezone: z.ZodOptional<z.ZodString>;
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            expression: string;
            enabled: boolean;
            timezone?: string | undefined;
        }, {
            expression: string;
            enabled: boolean;
            timezone?: string | undefined;
        }>>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "regex"]>;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            field: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
            value?: any;
        }, {
            field: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
            value?: any;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        enabled: boolean;
        type: TriggerType;
        config: Record<string, any>;
        conditions?: {
            field: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
            value?: any;
        }[] | undefined;
        schedule?: {
            expression: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        enabled: boolean;
        type: TriggerType;
        config: Record<string, any>;
        conditions?: {
            field: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
            value?: any;
        }[] | undefined;
        schedule?: {
            expression: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | undefined;
    }>, "many">;
    settings: z.ZodObject<{
        parallel: z.ZodBoolean;
        maxConcurrentExecutions: z.ZodNumber;
        timeoutMs: z.ZodNumber;
        retryPolicy: z.ZodObject<{
            enabled: z.ZodBoolean;
            maxAttempts: z.ZodNumber;
            delayMs: z.ZodNumber;
            backoffMultiplier: z.ZodNumber;
            maxDelayMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        }, {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        }>;
        errorHandling: z.ZodObject<{
            onError: z.ZodEnum<["stop", "continue", "retry", "skip"]>;
            captureErrors: z.ZodBoolean;
            notifyOnError: z.ZodBoolean;
            fallbackWorkflowId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            onError: "stop" | "continue" | "retry" | "skip";
            captureErrors: boolean;
            notifyOnError: boolean;
            fallbackWorkflowId?: string | undefined;
        }, {
            onError: "stop" | "continue" | "retry" | "skip";
            captureErrors: boolean;
            notifyOnError: boolean;
            fallbackWorkflowId?: string | undefined;
        }>;
        logging: z.ZodObject<{
            level: z.ZodEnum<["none", "error", "warn", "info", "debug"]>;
            includeInputs: z.ZodBoolean;
            includeOutputs: z.ZodBoolean;
            includeTiming: z.ZodBoolean;
            retentionDays: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            level: "none" | "error" | "warn" | "info" | "debug";
            includeInputs: boolean;
            includeOutputs: boolean;
            includeTiming: boolean;
            retentionDays: number;
        }, {
            level: "none" | "error" | "warn" | "info" | "debug";
            includeInputs: boolean;
            includeOutputs: boolean;
            includeTiming: boolean;
            retentionDays: number;
        }>;
        notifications: z.ZodObject<{
            onStart: z.ZodBoolean;
            onComplete: z.ZodBoolean;
            onError: z.ZodBoolean;
            channels: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["email", "slack", "webhook", "relay"]>;
                config: z.ZodRecord<z.ZodString, z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }, {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            onStart: boolean;
            onComplete: boolean;
            onError: boolean;
            channels: {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }[];
        }, {
            onStart: boolean;
            onComplete: boolean;
            onError: boolean;
            channels: {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        parallel: boolean;
        timeoutMs: number;
        maxConcurrentExecutions: number;
        retryPolicy: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        };
        errorHandling: {
            onError: "stop" | "continue" | "retry" | "skip";
            captureErrors: boolean;
            notifyOnError: boolean;
            fallbackWorkflowId?: string | undefined;
        };
        logging: {
            level: "none" | "error" | "warn" | "info" | "debug";
            includeInputs: boolean;
            includeOutputs: boolean;
            includeTiming: boolean;
            retentionDays: number;
        };
        notifications: {
            onStart: boolean;
            onComplete: boolean;
            onError: boolean;
            channels: {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }[];
        };
    }, {
        parallel: boolean;
        timeoutMs: number;
        maxConcurrentExecutions: number;
        retryPolicy: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        };
        errorHandling: {
            onError: "stop" | "continue" | "retry" | "skip";
            captureErrors: boolean;
            notifyOnError: boolean;
            fallbackWorkflowId?: string | undefined;
        };
        logging: {
            level: "none" | "error" | "warn" | "info" | "debug";
            includeInputs: boolean;
            includeOutputs: boolean;
            includeTiming: boolean;
            retentionDays: number;
        };
        notifications: {
            onStart: boolean;
            onComplete: boolean;
            onError: boolean;
            channels: {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }[];
        };
    }>;
}, "strip", z.ZodTypeAny, {
    variables: {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        scope: VariableScope;
        description?: string | undefined;
        defaultValue?: any;
        validation?: {
            pattern?: string | undefined;
            required?: boolean | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            min?: number | undefined;
            max?: number | undefined;
            enum?: any[] | undefined;
        } | undefined;
    }[];
    version: string;
    nodes: {
        name: string;
        id: string;
        type: WorkflowNodeType;
        metadata: Record<string, any>;
        position: {
            x: number;
            y: number;
        };
        config: Record<string, any>;
        inputs: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            description?: string | undefined;
            defaultValue?: any;
        }[];
        outputs: {
            name: string;
            id: string;
            type: VariableType;
            description?: string | undefined;
            schema?: any;
        }[];
        retry?: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        } | undefined;
        timeout?: number | undefined;
        description?: string | undefined;
        conditions?: {
            expression: string;
            id: string;
            outputId: string;
            description?: string | undefined;
        }[] | undefined;
    }[];
    connections: {
        id: string;
        metadata: Record<string, any>;
        sourceNodeId: string;
        sourceOutputId: string;
        targetNodeId: string;
        targetInputId: string;
        condition?: string | undefined;
    }[];
    triggers: {
        name: string;
        id: string;
        enabled: boolean;
        type: TriggerType;
        config: Record<string, any>;
        conditions?: {
            field: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
            value?: any;
        }[] | undefined;
        schedule?: {
            expression: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | undefined;
    }[];
    settings: {
        parallel: boolean;
        timeoutMs: number;
        maxConcurrentExecutions: number;
        retryPolicy: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        };
        errorHandling: {
            onError: "stop" | "continue" | "retry" | "skip";
            captureErrors: boolean;
            notifyOnError: boolean;
            fallbackWorkflowId?: string | undefined;
        };
        logging: {
            level: "none" | "error" | "warn" | "info" | "debug";
            includeInputs: boolean;
            includeOutputs: boolean;
            includeTiming: boolean;
            retentionDays: number;
        };
        notifications: {
            onStart: boolean;
            onComplete: boolean;
            onError: boolean;
            channels: {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }[];
        };
    };
}, {
    variables: {
        name: string;
        id: string;
        type: VariableType;
        required: boolean;
        scope: VariableScope;
        description?: string | undefined;
        defaultValue?: any;
        validation?: {
            pattern?: string | undefined;
            required?: boolean | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            min?: number | undefined;
            max?: number | undefined;
            enum?: any[] | undefined;
        } | undefined;
    }[];
    version: string;
    nodes: {
        name: string;
        id: string;
        type: WorkflowNodeType;
        metadata: Record<string, any>;
        position: {
            x: number;
            y: number;
        };
        config: Record<string, any>;
        inputs: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            description?: string | undefined;
            defaultValue?: any;
        }[];
        outputs: {
            name: string;
            id: string;
            type: VariableType;
            description?: string | undefined;
            schema?: any;
        }[];
        retry?: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        } | undefined;
        timeout?: number | undefined;
        description?: string | undefined;
        conditions?: {
            expression: string;
            id: string;
            outputId: string;
            description?: string | undefined;
        }[] | undefined;
    }[];
    connections: {
        id: string;
        metadata: Record<string, any>;
        sourceNodeId: string;
        sourceOutputId: string;
        targetNodeId: string;
        targetInputId: string;
        condition?: string | undefined;
    }[];
    triggers: {
        name: string;
        id: string;
        enabled: boolean;
        type: TriggerType;
        config: Record<string, any>;
        conditions?: {
            field: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
            value?: any;
        }[] | undefined;
        schedule?: {
            expression: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | undefined;
    }[];
    settings: {
        parallel: boolean;
        timeoutMs: number;
        maxConcurrentExecutions: number;
        retryPolicy: {
            enabled: boolean;
            maxAttempts: number;
            delayMs: number;
            backoffMultiplier: number;
            maxDelayMs: number;
        };
        errorHandling: {
            onError: "stop" | "continue" | "retry" | "skip";
            captureErrors: boolean;
            notifyOnError: boolean;
            fallbackWorkflowId?: string | undefined;
        };
        logging: {
            level: "none" | "error" | "warn" | "info" | "debug";
            includeInputs: boolean;
            includeOutputs: boolean;
            includeTiming: boolean;
            retentionDays: number;
        };
        notifications: {
            onStart: boolean;
            onComplete: boolean;
            onError: boolean;
            channels: {
                type: "webhook" | "email" | "slack" | "relay";
                config: Record<string, any>;
            }[];
        };
    };
}>;
export declare const PerformanceMetricsSchema: z.ZodObject<{
    averageCpuUsage: z.ZodNumber;
    averageMemoryUsage: z.ZodNumber;
    peakMemoryUsage: z.ZodNumber;
    throughput: z.ZodNumber;
    bottleneckNodes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    throughput: number;
    bottleneckNodes: string[];
}, {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    throughput: number;
    bottleneckNodes: string[];
}>;
export declare const WorkflowStatisticsSchema: z.ZodObject<{
    totalExecutions: z.ZodNumber;
    successfulExecutions: z.ZodNumber;
    failedExecutions: z.ZodNumber;
    averageExecutionTime: z.ZodNumber;
    successRate: z.ZodNumber;
    lastExecutionStatus: z.ZodOptional<z.ZodNativeEnum<typeof WorkflowExecutionStatus>>;
    lastExecutionError: z.ZodOptional<z.ZodString>;
    performance: z.ZodObject<{
        averageCpuUsage: z.ZodNumber;
        averageMemoryUsage: z.ZodNumber;
        peakMemoryUsage: z.ZodNumber;
        throughput: z.ZodNumber;
        bottleneckNodes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        averageCpuUsage: number;
        averageMemoryUsage: number;
        peakMemoryUsage: number;
        throughput: number;
        bottleneckNodes: string[];
    }, {
        averageCpuUsage: number;
        averageMemoryUsage: number;
        peakMemoryUsage: number;
        throughput: number;
        bottleneckNodes: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    successRate: number;
    totalExecutions: number;
    failedExecutions: number;
    successfulExecutions: number;
    averageExecutionTime: number;
    performance: {
        averageCpuUsage: number;
        averageMemoryUsage: number;
        peakMemoryUsage: number;
        throughput: number;
        bottleneckNodes: string[];
    };
    lastExecutionStatus?: WorkflowExecutionStatus | undefined;
    lastExecutionError?: string | undefined;
}, {
    successRate: number;
    totalExecutions: number;
    failedExecutions: number;
    successfulExecutions: number;
    averageExecutionTime: number;
    performance: {
        averageCpuUsage: number;
        averageMemoryUsage: number;
        peakMemoryUsage: number;
        throughput: number;
        bottleneckNodes: string[];
    };
    lastExecutionStatus?: WorkflowExecutionStatus | undefined;
    lastExecutionError?: string | undefined;
}>;
export declare const WorkflowDependencySchema: z.ZodObject<{
    type: z.ZodEnum<["workflow", "agent", "service", "package"]>;
    id: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    required: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "agent" | "workflow" | "service" | "package";
    required: boolean;
    version?: string | undefined;
}, {
    id: string;
    type: "agent" | "workflow" | "service" | "package";
    required: boolean;
    version?: string | undefined;
}>;
export declare const ChangelogEntrySchema: z.ZodObject<{
    version: z.ZodString;
    date: z.ZodUnion<[z.ZodDate, z.ZodEffects<z.ZodString, Date, string>]>;
    changes: z.ZodArray<z.ZodString, "many">;
    author: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: Date;
    version: string;
    changes: string[];
    author: string;
}, {
    date: string | Date;
    version: string;
    changes: string[];
    author: string;
}>;
export declare const WorkflowMetadataSchema: z.ZodObject<{
    category: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    author: z.ZodString;
    authorEmail: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    documentation: z.ZodOptional<z.ZodString>;
    changelog: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        date: z.ZodUnion<[z.ZodDate, z.ZodEffects<z.ZodString, Date, string>]>;
        changes: z.ZodArray<z.ZodString, "many">;
        author: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        date: Date;
        version: string;
        changes: string[];
        author: string;
    }, {
        date: string | Date;
        version: string;
        changes: string[];
        author: string;
    }>, "many">>;
    dependencies: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["workflow", "agent", "service", "package"]>;
        id: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "agent" | "workflow" | "service" | "package";
        required: boolean;
        version?: string | undefined;
    }, {
        id: string;
        type: "agent" | "workflow" | "service" | "package";
        required: boolean;
        version?: string | undefined;
    }>, "many">;
    integrations: z.ZodArray<z.ZodString, "many">;
    customProperties: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    category: string;
    dependencies: {
        id: string;
        type: "agent" | "workflow" | "service" | "package";
        required: boolean;
        version?: string | undefined;
    }[];
    tags: string[];
    author: string;
    integrations: string[];
    customProperties: Record<string, any>;
    description?: string | undefined;
    authorEmail?: string | undefined;
    documentation?: string | undefined;
    changelog?: {
        date: Date;
        version: string;
        changes: string[];
        author: string;
    }[] | undefined;
}, {
    category: string;
    dependencies: {
        id: string;
        type: "agent" | "workflow" | "service" | "package";
        required: boolean;
        version?: string | undefined;
    }[];
    tags: string[];
    author: string;
    integrations: string[];
    customProperties: Record<string, any>;
    description?: string | undefined;
    authorEmail?: string | undefined;
    documentation?: string | undefined;
    changelog?: {
        date: string | Date;
        version: string;
        changes: string[];
        author: string;
    }[] | undefined;
}>;
export declare const UnifiedWorkflowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    definition: z.ZodObject<{
        version: z.ZodString;
        nodes: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodNativeEnum<typeof WorkflowNodeType>;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>;
            config: z.ZodRecord<z.ZodString, z.ZodAny>;
            inputs: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodNativeEnum<typeof VariableType>;
                required: z.ZodBoolean;
                description: z.ZodOptional<z.ZodString>;
                defaultValue: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }, {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }>, "many">;
            outputs: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodNativeEnum<typeof VariableType>;
                description: z.ZodOptional<z.ZodString>;
                schema: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }, {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }>, "many">;
            conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                expression: z.ZodString;
                outputId: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }, {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }>, "many">>;
            retry: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodBoolean;
                maxAttempts: z.ZodNumber;
                delayMs: z.ZodNumber;
                backoffMultiplier: z.ZodNumber;
                maxDelayMs: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            }, {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            }>>;
            timeout: z.ZodOptional<z.ZodNumber>;
            metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            type: WorkflowNodeType;
            metadata: Record<string, any>;
            position: {
                x: number;
                y: number;
            };
            config: Record<string, any>;
            inputs: {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }[];
            outputs: {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }[];
            retry?: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            } | undefined;
            timeout?: number | undefined;
            description?: string | undefined;
            conditions?: {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }[] | undefined;
        }, {
            name: string;
            id: string;
            type: WorkflowNodeType;
            metadata: Record<string, any>;
            position: {
                x: number;
                y: number;
            };
            config: Record<string, any>;
            inputs: {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }[];
            outputs: {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }[];
            retry?: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            } | undefined;
            timeout?: number | undefined;
            description?: string | undefined;
            conditions?: {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }[] | undefined;
        }>, "many">;
        connections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            sourceNodeId: z.ZodString;
            sourceOutputId: z.ZodString;
            targetNodeId: z.ZodString;
            targetInputId: z.ZodString;
            condition: z.ZodOptional<z.ZodString>;
            metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            metadata: Record<string, any>;
            sourceNodeId: string;
            sourceOutputId: string;
            targetNodeId: string;
            targetInputId: string;
            condition?: string | undefined;
        }, {
            id: string;
            metadata: Record<string, any>;
            sourceNodeId: string;
            sourceOutputId: string;
            targetNodeId: string;
            targetInputId: string;
            condition?: string | undefined;
        }>, "many">;
        variables: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodNativeEnum<typeof VariableType>;
            defaultValue: z.ZodOptional<z.ZodAny>;
            description: z.ZodOptional<z.ZodString>;
            required: z.ZodBoolean;
            scope: z.ZodNativeEnum<typeof VariableScope>;
            validation: z.ZodOptional<z.ZodObject<{
                pattern: z.ZodOptional<z.ZodString>;
                minLength: z.ZodOptional<z.ZodNumber>;
                maxLength: z.ZodOptional<z.ZodNumber>;
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                required: z.ZodOptional<z.ZodBoolean>;
                enum: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            }, "strip", z.ZodTypeAny, {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            }, {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            scope: VariableScope;
            description?: string | undefined;
            defaultValue?: any;
            validation?: {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            } | undefined;
        }, {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            scope: VariableScope;
            description?: string | undefined;
            defaultValue?: any;
            validation?: {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            } | undefined;
        }>, "many">;
        triggers: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodNativeEnum<typeof TriggerType>;
            name: z.ZodString;
            enabled: z.ZodBoolean;
            config: z.ZodRecord<z.ZodString, z.ZodAny>;
            schedule: z.ZodOptional<z.ZodObject<{
                expression: z.ZodString;
                timezone: z.ZodOptional<z.ZodString>;
                enabled: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            }, {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            }>>;
            conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "regex"]>;
                value: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }, {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            enabled: boolean;
            type: TriggerType;
            config: Record<string, any>;
            conditions?: {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }[] | undefined;
            schedule?: {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            } | undefined;
        }, {
            name: string;
            id: string;
            enabled: boolean;
            type: TriggerType;
            config: Record<string, any>;
            conditions?: {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }[] | undefined;
            schedule?: {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            } | undefined;
        }>, "many">;
        settings: z.ZodObject<{
            parallel: z.ZodBoolean;
            maxConcurrentExecutions: z.ZodNumber;
            timeoutMs: z.ZodNumber;
            retryPolicy: z.ZodObject<{
                enabled: z.ZodBoolean;
                maxAttempts: z.ZodNumber;
                delayMs: z.ZodNumber;
                backoffMultiplier: z.ZodNumber;
                maxDelayMs: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            }, {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            }>;
            errorHandling: z.ZodObject<{
                onError: z.ZodEnum<["stop", "continue", "retry", "skip"]>;
                captureErrors: z.ZodBoolean;
                notifyOnError: z.ZodBoolean;
                fallbackWorkflowId: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            }, {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            }>;
            logging: z.ZodObject<{
                level: z.ZodEnum<["none", "error", "warn", "info", "debug"]>;
                includeInputs: z.ZodBoolean;
                includeOutputs: z.ZodBoolean;
                includeTiming: z.ZodBoolean;
                retentionDays: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            }, {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            }>;
            notifications: z.ZodObject<{
                onStart: z.ZodBoolean;
                onComplete: z.ZodBoolean;
                onError: z.ZodBoolean;
                channels: z.ZodArray<z.ZodObject<{
                    type: z.ZodEnum<["email", "slack", "webhook", "relay"]>;
                    config: z.ZodRecord<z.ZodString, z.ZodAny>;
                }, "strip", z.ZodTypeAny, {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }, {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            }, {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            }>;
        }, "strip", z.ZodTypeAny, {
            parallel: boolean;
            timeoutMs: number;
            maxConcurrentExecutions: number;
            retryPolicy: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            };
            errorHandling: {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            };
            logging: {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            };
            notifications: {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            };
        }, {
            parallel: boolean;
            timeoutMs: number;
            maxConcurrentExecutions: number;
            retryPolicy: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            };
            errorHandling: {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            };
            logging: {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            };
            notifications: {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        variables: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            scope: VariableScope;
            description?: string | undefined;
            defaultValue?: any;
            validation?: {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            } | undefined;
        }[];
        version: string;
        nodes: {
            name: string;
            id: string;
            type: WorkflowNodeType;
            metadata: Record<string, any>;
            position: {
                x: number;
                y: number;
            };
            config: Record<string, any>;
            inputs: {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }[];
            outputs: {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }[];
            retry?: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            } | undefined;
            timeout?: number | undefined;
            description?: string | undefined;
            conditions?: {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }[] | undefined;
        }[];
        connections: {
            id: string;
            metadata: Record<string, any>;
            sourceNodeId: string;
            sourceOutputId: string;
            targetNodeId: string;
            targetInputId: string;
            condition?: string | undefined;
        }[];
        triggers: {
            name: string;
            id: string;
            enabled: boolean;
            type: TriggerType;
            config: Record<string, any>;
            conditions?: {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }[] | undefined;
            schedule?: {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            } | undefined;
        }[];
        settings: {
            parallel: boolean;
            timeoutMs: number;
            maxConcurrentExecutions: number;
            retryPolicy: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            };
            errorHandling: {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            };
            logging: {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            };
            notifications: {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            };
        };
    }, {
        variables: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            scope: VariableScope;
            description?: string | undefined;
            defaultValue?: any;
            validation?: {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            } | undefined;
        }[];
        version: string;
        nodes: {
            name: string;
            id: string;
            type: WorkflowNodeType;
            metadata: Record<string, any>;
            position: {
                x: number;
                y: number;
            };
            config: Record<string, any>;
            inputs: {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }[];
            outputs: {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }[];
            retry?: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            } | undefined;
            timeout?: number | undefined;
            description?: string | undefined;
            conditions?: {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }[] | undefined;
        }[];
        connections: {
            id: string;
            metadata: Record<string, any>;
            sourceNodeId: string;
            sourceOutputId: string;
            targetNodeId: string;
            targetInputId: string;
            condition?: string | undefined;
        }[];
        triggers: {
            name: string;
            id: string;
            enabled: boolean;
            type: TriggerType;
            config: Record<string, any>;
            conditions?: {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }[] | undefined;
            schedule?: {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            } | undefined;
        }[];
        settings: {
            parallel: boolean;
            timeoutMs: number;
            maxConcurrentExecutions: number;
            retryPolicy: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            };
            errorHandling: {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            };
            logging: {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            };
            notifications: {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            };
        };
    }>;
    status: z.ZodNativeEnum<typeof WorkflowStatus>;
    agentId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    version: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    isTemplate: z.ZodBoolean;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodEffects<z.ZodString, Date, string>]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodEffects<z.ZodString, Date, string>]>;
    lastExecutedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodEffects<z.ZodString, Date, string>]>>;
    executionCount: z.ZodNumber;
    statistics: z.ZodObject<{
        totalExecutions: z.ZodNumber;
        successfulExecutions: z.ZodNumber;
        failedExecutions: z.ZodNumber;
        averageExecutionTime: z.ZodNumber;
        successRate: z.ZodNumber;
        lastExecutionStatus: z.ZodOptional<z.ZodNativeEnum<typeof WorkflowExecutionStatus>>;
        lastExecutionError: z.ZodOptional<z.ZodString>;
        performance: z.ZodObject<{
            averageCpuUsage: z.ZodNumber;
            averageMemoryUsage: z.ZodNumber;
            peakMemoryUsage: z.ZodNumber;
            throughput: z.ZodNumber;
            bottleneckNodes: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            averageCpuUsage: number;
            averageMemoryUsage: number;
            peakMemoryUsage: number;
            throughput: number;
            bottleneckNodes: string[];
        }, {
            averageCpuUsage: number;
            averageMemoryUsage: number;
            peakMemoryUsage: number;
            throughput: number;
            bottleneckNodes: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        successRate: number;
        totalExecutions: number;
        failedExecutions: number;
        successfulExecutions: number;
        averageExecutionTime: number;
        performance: {
            averageCpuUsage: number;
            averageMemoryUsage: number;
            peakMemoryUsage: number;
            throughput: number;
            bottleneckNodes: string[];
        };
        lastExecutionStatus?: WorkflowExecutionStatus | undefined;
        lastExecutionError?: string | undefined;
    }, {
        successRate: number;
        totalExecutions: number;
        failedExecutions: number;
        successfulExecutions: number;
        averageExecutionTime: number;
        performance: {
            averageCpuUsage: number;
            averageMemoryUsage: number;
            peakMemoryUsage: number;
            throughput: number;
            bottleneckNodes: string[];
        };
        lastExecutionStatus?: WorkflowExecutionStatus | undefined;
        lastExecutionError?: string | undefined;
    }>;
    metadata: z.ZodObject<{
        category: z.ZodString;
        tags: z.ZodArray<z.ZodString, "many">;
        author: z.ZodString;
        authorEmail: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        documentation: z.ZodOptional<z.ZodString>;
        changelog: z.ZodOptional<z.ZodArray<z.ZodObject<{
            version: z.ZodString;
            date: z.ZodUnion<[z.ZodDate, z.ZodEffects<z.ZodString, Date, string>]>;
            changes: z.ZodArray<z.ZodString, "many">;
            author: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            date: Date;
            version: string;
            changes: string[];
            author: string;
        }, {
            date: string | Date;
            version: string;
            changes: string[];
            author: string;
        }>, "many">>;
        dependencies: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["workflow", "agent", "service", "package"]>;
            id: z.ZodString;
            version: z.ZodOptional<z.ZodString>;
            required: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "agent" | "workflow" | "service" | "package";
            required: boolean;
            version?: string | undefined;
        }, {
            id: string;
            type: "agent" | "workflow" | "service" | "package";
            required: boolean;
            version?: string | undefined;
        }>, "many">;
        integrations: z.ZodArray<z.ZodString, "many">;
        customProperties: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        dependencies: {
            id: string;
            type: "agent" | "workflow" | "service" | "package";
            required: boolean;
            version?: string | undefined;
        }[];
        tags: string[];
        author: string;
        integrations: string[];
        customProperties: Record<string, any>;
        description?: string | undefined;
        authorEmail?: string | undefined;
        documentation?: string | undefined;
        changelog?: {
            date: Date;
            version: string;
            changes: string[];
            author: string;
        }[] | undefined;
    }, {
        category: string;
        dependencies: {
            id: string;
            type: "agent" | "workflow" | "service" | "package";
            required: boolean;
            version?: string | undefined;
        }[];
        tags: string[];
        author: string;
        integrations: string[];
        customProperties: Record<string, any>;
        description?: string | undefined;
        authorEmail?: string | undefined;
        documentation?: string | undefined;
        changelog?: {
            date: string | Date;
            version: string;
            changes: string[];
            author: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    executionCount: number;
    status: WorkflowStatus;
    id: string;
    statistics: {
        successRate: number;
        totalExecutions: number;
        failedExecutions: number;
        successfulExecutions: number;
        averageExecutionTime: number;
        performance: {
            averageCpuUsage: number;
            averageMemoryUsage: number;
            peakMemoryUsage: number;
            throughput: number;
            bottleneckNodes: string[];
        };
        lastExecutionStatus?: WorkflowExecutionStatus | undefined;
        lastExecutionError?: string | undefined;
    };
    metadata: {
        category: string;
        dependencies: {
            id: string;
            type: "agent" | "workflow" | "service" | "package";
            required: boolean;
            version?: string | undefined;
        }[];
        tags: string[];
        author: string;
        integrations: string[];
        customProperties: Record<string, any>;
        description?: string | undefined;
        authorEmail?: string | undefined;
        documentation?: string | undefined;
        changelog?: {
            date: Date;
            version: string;
            changes: string[];
            author: string;
        }[] | undefined;
    };
    version: string;
    isTemplate: boolean;
    definition: {
        variables: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            scope: VariableScope;
            description?: string | undefined;
            defaultValue?: any;
            validation?: {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            } | undefined;
        }[];
        version: string;
        nodes: {
            name: string;
            id: string;
            type: WorkflowNodeType;
            metadata: Record<string, any>;
            position: {
                x: number;
                y: number;
            };
            config: Record<string, any>;
            inputs: {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }[];
            outputs: {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }[];
            retry?: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            } | undefined;
            timeout?: number | undefined;
            description?: string | undefined;
            conditions?: {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }[] | undefined;
        }[];
        connections: {
            id: string;
            metadata: Record<string, any>;
            sourceNodeId: string;
            sourceOutputId: string;
            targetNodeId: string;
            targetInputId: string;
            condition?: string | undefined;
        }[];
        triggers: {
            name: string;
            id: string;
            enabled: boolean;
            type: TriggerType;
            config: Record<string, any>;
            conditions?: {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }[] | undefined;
            schedule?: {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            } | undefined;
        }[];
        settings: {
            parallel: boolean;
            timeoutMs: number;
            maxConcurrentExecutions: number;
            retryPolicy: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            };
            errorHandling: {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            };
            logging: {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            };
            notifications: {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            };
        };
    };
    tags: string[];
    agentId?: string | undefined;
    lastExecutedAt?: Date | undefined;
    description?: string | undefined;
    userId?: string | undefined;
}, {
    name: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    executionCount: number;
    status: WorkflowStatus;
    id: string;
    statistics: {
        successRate: number;
        totalExecutions: number;
        failedExecutions: number;
        successfulExecutions: number;
        averageExecutionTime: number;
        performance: {
            averageCpuUsage: number;
            averageMemoryUsage: number;
            peakMemoryUsage: number;
            throughput: number;
            bottleneckNodes: string[];
        };
        lastExecutionStatus?: WorkflowExecutionStatus | undefined;
        lastExecutionError?: string | undefined;
    };
    metadata: {
        category: string;
        dependencies: {
            id: string;
            type: "agent" | "workflow" | "service" | "package";
            required: boolean;
            version?: string | undefined;
        }[];
        tags: string[];
        author: string;
        integrations: string[];
        customProperties: Record<string, any>;
        description?: string | undefined;
        authorEmail?: string | undefined;
        documentation?: string | undefined;
        changelog?: {
            date: string | Date;
            version: string;
            changes: string[];
            author: string;
        }[] | undefined;
    };
    version: string;
    isTemplate: boolean;
    definition: {
        variables: {
            name: string;
            id: string;
            type: VariableType;
            required: boolean;
            scope: VariableScope;
            description?: string | undefined;
            defaultValue?: any;
            validation?: {
                pattern?: string | undefined;
                required?: boolean | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
                max?: number | undefined;
                enum?: any[] | undefined;
            } | undefined;
        }[];
        version: string;
        nodes: {
            name: string;
            id: string;
            type: WorkflowNodeType;
            metadata: Record<string, any>;
            position: {
                x: number;
                y: number;
            };
            config: Record<string, any>;
            inputs: {
                name: string;
                id: string;
                type: VariableType;
                required: boolean;
                description?: string | undefined;
                defaultValue?: any;
            }[];
            outputs: {
                name: string;
                id: string;
                type: VariableType;
                description?: string | undefined;
                schema?: any;
            }[];
            retry?: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            } | undefined;
            timeout?: number | undefined;
            description?: string | undefined;
            conditions?: {
                expression: string;
                id: string;
                outputId: string;
                description?: string | undefined;
            }[] | undefined;
        }[];
        connections: {
            id: string;
            metadata: Record<string, any>;
            sourceNodeId: string;
            sourceOutputId: string;
            targetNodeId: string;
            targetInputId: string;
            condition?: string | undefined;
        }[];
        triggers: {
            name: string;
            id: string;
            enabled: boolean;
            type: TriggerType;
            config: Record<string, any>;
            conditions?: {
                field: string;
                operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "regex";
                value?: any;
            }[] | undefined;
            schedule?: {
                expression: string;
                enabled: boolean;
                timezone?: string | undefined;
            } | undefined;
        }[];
        settings: {
            parallel: boolean;
            timeoutMs: number;
            maxConcurrentExecutions: number;
            retryPolicy: {
                enabled: boolean;
                maxAttempts: number;
                delayMs: number;
                backoffMultiplier: number;
                maxDelayMs: number;
            };
            errorHandling: {
                onError: "stop" | "continue" | "retry" | "skip";
                captureErrors: boolean;
                notifyOnError: boolean;
                fallbackWorkflowId?: string | undefined;
            };
            logging: {
                level: "none" | "error" | "warn" | "info" | "debug";
                includeInputs: boolean;
                includeOutputs: boolean;
                includeTiming: boolean;
                retentionDays: number;
            };
            notifications: {
                onStart: boolean;
                onComplete: boolean;
                onError: boolean;
                channels: {
                    type: "webhook" | "email" | "slack" | "relay";
                    config: Record<string, any>;
                }[];
            };
        };
    };
    tags: string[];
    agentId?: string | undefined;
    lastExecutedAt?: string | Date | undefined;
    description?: string | undefined;
    userId?: string | undefined;
}>;
export declare const AgentTaskNodeConfigSchema: z.ZodObject<{
    agentId: z.ZodOptional<z.ZodString>;
    agentType: z.ZodOptional<z.ZodNativeEnum<typeof AgentType>>;
    task: z.ZodString;
    instructions: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    handoffTemplateId: z.ZodOptional<z.ZodString>;
    expectedDuration: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodEnum<["low", "medium", "high"]>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    agentId: z.ZodOptional<z.ZodString>;
    agentType: z.ZodOptional<z.ZodNativeEnum<typeof AgentType>>;
    task: z.ZodString;
    instructions: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    handoffTemplateId: z.ZodOptional<z.ZodString>;
    expectedDuration: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodEnum<["low", "medium", "high"]>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    agentId: z.ZodOptional<z.ZodString>;
    agentType: z.ZodOptional<z.ZodNativeEnum<typeof AgentType>>;
    task: z.ZodString;
    instructions: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    handoffTemplateId: z.ZodOptional<z.ZodString>;
    expectedDuration: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodEnum<["low", "medium", "high"]>;
}, z.ZodTypeAny, "passthrough">>;
export declare const AgentHandoffNodeConfigSchema: z.ZodObject<{
    fromAgentId: z.ZodString;
    toAgentId: z.ZodString;
    handoffTemplateId: z.ZodString;
    preserveContext: z.ZodBoolean;
    stagnationThresholdMs: z.ZodNumber;
    fallbackAgentId: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    fromAgentId: z.ZodString;
    toAgentId: z.ZodString;
    handoffTemplateId: z.ZodString;
    preserveContext: z.ZodBoolean;
    stagnationThresholdMs: z.ZodNumber;
    fallbackAgentId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    fromAgentId: z.ZodString;
    toAgentId: z.ZodString;
    handoffTemplateId: z.ZodString;
    preserveContext: z.ZodBoolean;
    stagnationThresholdMs: z.ZodNumber;
    fallbackAgentId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ConditionNodeConfigSchema: z.ZodObject<{
    expression: z.ZodString;
    truthyOutput: z.ZodAny;
    falsyOutput: z.ZodAny;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    expression: z.ZodString;
    truthyOutput: z.ZodAny;
    falsyOutput: z.ZodAny;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    expression: z.ZodString;
    truthyOutput: z.ZodAny;
    falsyOutput: z.ZodAny;
}, z.ZodTypeAny, "passthrough">>;
export declare const LoopNodeConfigSchema: z.ZodObject<{
    iterableVariable: z.ZodString;
    itemVariable: z.ZodString;
    maxIterations: z.ZodOptional<z.ZodNumber>;
    breakCondition: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    iterableVariable: z.ZodString;
    itemVariable: z.ZodString;
    maxIterations: z.ZodOptional<z.ZodNumber>;
    breakCondition: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    iterableVariable: z.ZodString;
    itemVariable: z.ZodString;
    maxIterations: z.ZodOptional<z.ZodNumber>;
    breakCondition: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const APICallNodeConfigSchema: z.ZodObject<{
    url: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    headers: z.ZodRecord<z.ZodString, z.ZodString>;
    body: z.ZodOptional<z.ZodAny>;
    responseMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    url: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    headers: z.ZodRecord<z.ZodString, z.ZodString>;
    body: z.ZodOptional<z.ZodAny>;
    responseMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    url: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    headers: z.ZodRecord<z.ZodString, z.ZodString>;
    body: z.ZodOptional<z.ZodAny>;
    responseMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const LLMPromptNodeConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["openai", "anthropic", "google", "local"]>;
    model: z.ZodString;
    prompt: z.ZodString;
    systemPrompt: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    responseFormat: z.ZodOptional<z.ZodEnum<["text", "json", "structured"]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    provider: z.ZodEnum<["openai", "anthropic", "google", "local"]>;
    model: z.ZodString;
    prompt: z.ZodString;
    systemPrompt: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    responseFormat: z.ZodOptional<z.ZodEnum<["text", "json", "structured"]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    provider: z.ZodEnum<["openai", "anthropic", "google", "local"]>;
    model: z.ZodString;
    prompt: z.ZodString;
    systemPrompt: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    responseFormat: z.ZodOptional<z.ZodEnum<["text", "json", "structured"]>>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=WorkflowSchemas.d.ts.map