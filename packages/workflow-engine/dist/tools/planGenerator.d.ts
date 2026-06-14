import { z } from 'zod';
export declare const WorkflowPlanSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    phases: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        tasks: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            assignee: z.ZodOptional<z.ZodString>;
            dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            status: z.ZodDefault<z.ZodEnum<["pending", "in_progress", "completed", "blocked"]>>;
            acceptance: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            status: "pending" | "in_progress" | "completed" | "blocked";
            title: string;
            dependencies: string[];
            description?: string | undefined;
            assignee?: string | undefined;
            acceptance?: string | undefined;
        }, {
            id: string;
            title: string;
            status?: "pending" | "in_progress" | "completed" | "blocked" | undefined;
            description?: string | undefined;
            assignee?: string | undefined;
            dependencies?: string[] | undefined;
            acceptance?: string | undefined;
        }>, "many">;
        gate: z.ZodOptional<z.ZodObject<{
            criteria: z.ZodArray<z.ZodString, "many">;
            approvedBy: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            criteria: string[];
            approvedBy?: string | undefined;
        }, {
            criteria: string[];
            approvedBy?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        name: string;
        tasks: {
            id: string;
            status: "pending" | "in_progress" | "completed" | "blocked";
            title: string;
            dependencies: string[];
            description?: string | undefined;
            assignee?: string | undefined;
            acceptance?: string | undefined;
        }[];
        gate?: {
            criteria: string[];
            approvedBy?: string | undefined;
        } | undefined;
    }, {
        id: string;
        description: string;
        name: string;
        tasks: {
            id: string;
            title: string;
            status?: "pending" | "in_progress" | "completed" | "blocked" | undefined;
            description?: string | undefined;
            assignee?: string | undefined;
            dependencies?: string[] | undefined;
            acceptance?: string | undefined;
        }[];
        gate?: {
            criteria: string[];
            approvedBy?: string | undefined;
        } | undefined;
    }>, "many">;
    status: z.ZodDefault<z.ZodEnum<["draft", "active", "completed", "cancelled"]>>;
    createdAt: z.ZodDefault<z.ZodString>;
    updatedAt: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "completed" | "draft" | "active" | "cancelled";
    title: string;
    phases: {
        id: string;
        description: string;
        name: string;
        tasks: {
            id: string;
            status: "pending" | "in_progress" | "completed" | "blocked";
            title: string;
            dependencies: string[];
            description?: string | undefined;
            assignee?: string | undefined;
            acceptance?: string | undefined;
        }[];
        gate?: {
            criteria: string[];
            approvedBy?: string | undefined;
        } | undefined;
    }[];
    createdAt: string;
    updatedAt: string;
    description?: string | undefined;
}, {
    id: string;
    title: string;
    phases: {
        id: string;
        description: string;
        name: string;
        tasks: {
            id: string;
            title: string;
            status?: "pending" | "in_progress" | "completed" | "blocked" | undefined;
            description?: string | undefined;
            assignee?: string | undefined;
            dependencies?: string[] | undefined;
            acceptance?: string | undefined;
        }[];
        gate?: {
            criteria: string[];
            approvedBy?: string | undefined;
        } | undefined;
    }[];
    status?: "completed" | "draft" | "active" | "cancelled" | undefined;
    description?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type WorkflowPlan = z.infer<typeof WorkflowPlanSchema>;
export declare class PlanGenerator {
    generateIterativePlan(params: {
        featureName: string;
        description: string;
        constraints?: string[];
    }): WorkflowPlan;
    generateWorkflowYAML(plan: WorkflowPlan): string;
}
//# sourceMappingURL=planGenerator.d.ts.map