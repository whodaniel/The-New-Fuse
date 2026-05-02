/**
 * Represents a UUID string
 */
export type UUID = string;

/**
 * Represents an ISO-8601 date-time string
 */
export type ISODateTime = string;

/**
 * Base entity interface that provides common properties for all entity types
 */
export interface BaseEntity {
  id: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
