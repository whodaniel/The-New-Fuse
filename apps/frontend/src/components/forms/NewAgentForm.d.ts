import { z } from "zod";
export declare const agentFormSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<any>;
    description: z.ZodString;
    llmProviderId: z.ZodOptional<z.ZodString>;
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
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodObject<{
        personalityTraits: z.ZodOptional<z.ZodArray<z.ZodString>>;
        communicationStyle: z.ZodOptional<z.ZodString>;
        expertiseAreas: z.ZodOptional<z.ZodArray<z.ZodString>>;
        reasoningStrategies: z.ZodOptional<z.ZodArray<z.ZodEnum<any>>>;
        skillDevelopment: z.ZodOptional<z.ZodObject<{
            currentLevel: z.ZodOptional<z.ZodNumber>;
            targetLevel: z.ZodOptional<z.ZodNumber>;
            learningPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    config: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
}, z.core.$strip>;
export declare const NewAgentForm: ({ form, onSubmit }: {
    form: any;
    onSubmit: any;
}) => import("react/jsx-runtime").JSX.Element;
