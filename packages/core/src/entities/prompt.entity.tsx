import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PromptParameter, PromptMetrics, PromptTemplate as IPromptTemplate } from '../types/prompt.types.js';

@Entity()
export class PromptTemplate implements IPromptTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column()
    template!: string;

    @Column('jsonb')
    parameters!: PromptParameter[];

    @Column()
    category!: string;

    @Column()
    version!: number;

    @Column('jsonb')
    metrics!: PromptMetrics;

    @Column('jsonb')
    metadata!: {
        author: string;
        created: Date;
        updated: Date;
        tags: string[];
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    render(params: Record<string, unknown>): string {
        let result = this.template;
        for (const [key, value] of Object.entries(params)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), String(value));
        }
        return result;
    }

    validateParameters(params: Record<string, unknown>): { isValid: boolean; errors?: string[] } {
        const errors: string[] = [];

        for (const param of this.parameters) {
            if (param.required && !(param.name in params)) {
                errors.push(`Missing required parameter: ${param.name}`);
                continue;
            }

            const value = params[param.name];
            if (value === undefined) {
                errors.push(`Parameter ${param.name} cannot be undefined`);
                continue;
            }

            const valueType = typeof value;
            if (valueType !== param.type) {
                errors.push(`Parameter ${param.name} must be of type ${param.type}, got ${valueType}`);
                continue;
            }

            if (param.validation) {
                if (param.validation.min !== undefined && (value as number) < param.validation.min) {
                    errors.push(`Parameter ${param.name} must be >= ${param.validation.min}`);
                }

                if (param.validation.max !== undefined && (value as number) > param.validation.max) {
                    errors.push(`Parameter ${param.name} must be <= ${param.validation.max}`);
                }

                if (param.validation.pattern) {
                    const regex = new RegExp(param.validation.pattern);
                    if (!regex.test(value as string)) {
                        errors.push(`Parameter ${param.name} must match pattern ${param.validation.pattern}`);
                    }
                }

                if (param.validation.enum && !param.validation.enum.includes(value)) {
                    errors.push(`Parameter ${param.name} must be one of ${param.validation.enum.join(', ')}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
}
