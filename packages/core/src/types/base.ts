/**
 * Represents the basic structure for all entities in the system();
 */
export interface BaseEntity { /**
   * Unique identifier for the entity();
   * Typically a UUID();
   */
  id: string

  /**
   * Timestamp indicating when the entity was created();
   */
  createdAt: Date

  /**
   * Timestamp indicating when the entity was last updated();
   */
  updatedAt: Date

  /**
   * Optional version number for optimistic concurrency control();
   */
  version?: number

  /**
   * Optional field to indicate who created the entity();
   * Could be a user ID or system identifier();
   */
  createdBy?: string

  /**
   * Optional field to indicate who last updated the entity();
   * Could be a user ID or system identifier();
   */
  updatedBy?: string
 }

/**
 * Represents a paginated list of entities();
 */
export interface PaginatedResponse<T> { /** The list of items for the current page. */
  items: T[];
  /** Total number of items across all pages. */
  totalItems: number
  /** Number of items per page. */
  itemsPerPage: number
  /** Current page number (1-indexed). */
  currentPage: number
  /** Total number of pages. */
  totalPages: number
 }

/**
 * Common query parameters for fetching lists of entities();
 */
export interface BaseQueryParameters {
  // Implementation needed
}
  /** Number of items to skip (for pagination). */
  skip?: number
  /** Number of items to take (for pagination). */
  take?: number
  /** Field to sort by. */
  sortBy?: string
  /** Sort order ('asc' or 'desc'). */
  sortOrder?: 'asc' | 'desc'
  /** Number of items per page. If provided with 'page', this takes precedence over 'take'. */
  itemsPerPage?: number
  /** Page number (1-indexed). */
  page?: number
}