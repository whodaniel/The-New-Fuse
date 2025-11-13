/**
 * Common Types for Agent Protocol Bridge Integrations
 *
 * These interfaces provide a shared foundation for various entities
 * across different integration systems, promoting consistency and reusability.
 */
/**
 * Base interface for any entity with a unique identifier and timestamps.
 */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Interface for entities that have a name and an optional description,
 * extending the BaseEntity for common properties.
 */
export interface NamedEntity extends BaseEntity {
    name: string;
    description?: string;
}
//# sourceMappingURL=common-types.d.ts.map