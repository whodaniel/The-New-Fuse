import React from 'react';
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
export declare const agentFormSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodNativeEnum<any>;
    description: z.ZodString;
    capabilities: z.ZodOptional<z.ZodObject<{
        code_generation: z.ZodOptional<z.ZodBoolean>;
        code_review: z.ZodOptional<z.ZodBoolean>;
        code_optimization: z.ZodOptional<z.ZodBoolean>;
        architecture_review: z.ZodOptional<z.ZodBoolean>;
        dependency_analysis: z.ZodOptional<z.ZodBoolean>;
        security_audit: z.ZodOptional<z.ZodBoolean>;
        documentation: z.ZodOptional<z.ZodBoolean>;
        test_generation: z.ZodOptional<z.ZodBoolean>;
        bug_analysis: z.ZodOptional<z.ZodBoolean>;
        performance_analysis: z.ZodOptional<z.ZodBoolean>;
        data_analysis: z.ZodOptional<z.ZodBoolean>;
        natural_language_processing: z.ZodOptional<z.ZodBoolean>;
        virtual_browser: z.ZodOptional<z.ZodBoolean>;
        web_automation: z.ZodOptional<z.ZodBoolean>;
        project_analysis: z.ZodOptional<z.ZodBoolean>;
        knowledge_graph: z.ZodOptional<z.ZodBoolean>;
        taxonomy_system: z.ZodOptional<z.ZodBoolean>;
        learning_system: z.ZodOptional<z.ZodBoolean>;
        agent_collaboration: z.ZodOptional<z.ZodBoolean>;
        communication_bus: z.ZodOptional<z.ZodBoolean>;
        protocol_handler: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code_generation?: boolean | undefined;
        data_analysis?: boolean | undefined;
        code_review?: boolean | undefined;
        code_optimization?: boolean | undefined;
        architecture_review?: boolean | undefined;
        dependency_analysis?: boolean | undefined;
        security_audit?: boolean | undefined;
        documentation?: boolean | undefined;
        test_generation?: boolean | undefined;
        bug_analysis?: boolean | undefined;
        performance_analysis?: boolean | undefined;
        natural_language_processing?: boolean | undefined;
        virtual_browser?: boolean | undefined;
        web_automation?: boolean | undefined;
        project_analysis?: boolean | undefined;
        knowledge_graph?: boolean | undefined;
        taxonomy_system?: boolean | undefined;
        learning_system?: boolean | undefined;
        agent_collaboration?: boolean | undefined;
        communication_bus?: boolean | undefined;
        protocol_handler?: boolean | undefined;
    }, {
        code_generation?: boolean | undefined;
        data_analysis?: boolean | undefined;
        code_review?: boolean | undefined;
        code_optimization?: boolean | undefined;
        architecture_review?: boolean | undefined;
        dependency_analysis?: boolean | undefined;
        security_audit?: boolean | undefined;
        documentation?: boolean | undefined;
        test_generation?: boolean | undefined;
        bug_analysis?: boolean | undefined;
        performance_analysis?: boolean | undefined;
        natural_language_processing?: boolean | undefined;
        virtual_browser?: boolean | undefined;
        web_automation?: boolean | undefined;
        project_analysis?: boolean | undefined;
        knowledge_graph?: boolean | undefined;
        taxonomy_system?: boolean | undefined;
        learning_system?: boolean | undefined;
        agent_collaboration?: boolean | undefined;
        communication_bus?: boolean | undefined;
        protocol_handler?: boolean | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        personalityTraits: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        communicationStyle: z.ZodOptional<z.ZodString>;
        expertiseAreas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        reasoningStrategies: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<any>, "many">>;
        skillDevelopment: z.ZodOptional<z.ZodObject<{
            currentLevel: z.ZodOptional<z.ZodNumber>;
            targetLevel: z.ZodOptional<z.ZodNumber>;
            learningPath: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            currentLevel?: number | undefined;
            targetLevel?: number | undefined;
            learningPath?: string[] | undefined;
        }, {
            currentLevel?: number | undefined;
            targetLevel?: number | undefined;
            learningPath?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        personalityTraits?: string[] | undefined;
        communicationStyle?: string | undefined;
        expertiseAreas?: string[] | undefined;
        reasoningStrategies?: any[] | undefined;
        skillDevelopment?: {
            currentLevel?: number | undefined;
            targetLevel?: number | undefined;
            learningPath?: string[] | undefined;
        } | undefined;
    }, {
        personalityTraits?: string[] | undefined;
        communicationStyle?: string | undefined;
        expertiseAreas?: string[] | undefined;
        reasoningStrategies?: any[] | undefined;
        skillDevelopment?: {
            currentLevel?: number | undefined;
            targetLevel?: number | undefined;
            learningPath?: string[] | undefined;
        } | undefined;
    }>>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    name?: unknown;
    type?: unknown;
    description?: unknown;
    capabilities?: unknown;
    metadata?: unknown;
    config?: unknown;
}, {
    [x: string]: any;
    name?: unknown;
    type?: unknown;
    description?: unknown;
    capabilities?: unknown;
    metadata?: unknown;
    config?: unknown;
}>;
export type FormData = z.infer<typeof agentFormSchema>;
interface NewAgentFormProps {
    form: UseFormReturn<FormData>;
    onSubmit: (values: FormData) => Promise<void>;
}
export declare const NewAgentForm: React.React.FC<NewAgentFormProps>;
export {};
