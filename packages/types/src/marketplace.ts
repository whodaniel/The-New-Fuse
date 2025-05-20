import type { Agent } from './agent.js';

// TODO: Define marketplace-specific types here if needed.
// For example:
/*
export interface MarketplaceListing {
  id: string;
  agentId: string; // Assuming agents are listed
  description: string;
  price?: number; // Optional pricing
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceQuery {
  tags?: string[];
  keywords?: string;
  // ... other filter criteria
}
*/

// Re-export Agent if it's the primary focus, or define specific marketplace types.
export type { Agent }; // Example re-export
