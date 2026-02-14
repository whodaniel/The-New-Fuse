import { config } from '../config';
import type { User } from '../types/auth';

export interface TokenPackage {
  amount: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

export interface TokenTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  balance: number;
}

export class TokenService {
  private apiUrl: string;

  constructor(apiUrl: string = config.apiUrl) {
    this.apiUrl = apiUrl;
  }

  getTokenPackages(): TokenPackage[] {
    return [
      { amount: 500, price: 4.99, bonus: 0 },
      { amount: 1000, price: 8.99, bonus: 100, popular: true },
      { amount: 2500, price: 19.99, bonus: 350 },
      { amount: 5000, price: 34.99, bonus: 1000 },
      { amount: 10000, price: 59.99, bonus: 2500 },
    ];
  }

  async purchaseTokens(
    packageId: number,
    paymentMethodId: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/tokens/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId, paymentMethodId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token purchase error:', error);
      return { success: false, message: 'Purchase failed. Please try again.' };
    }
  }

  async getTransactionHistory(): Promise<TokenTransaction[]> {
    try {
      const response = await fetch(`${this.apiUrl}/tokens/transactions`);
      if (response.ok) {
        const data = await response.json();
        return data.transactions || [];
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    }
    return [];
  }

  async useTokens(
    amount: number,
    agentId: string,
    sessionId: string
  ): Promise<{ success: boolean; balance?: number }> {
    try {
      const response = await fetch(`${this.apiUrl}/tokens/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, agentId, sessionId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token usage error:', error);
      return { success: false };
    }
  }

  // Calculate token cost for an agent run
  calculateRunCost(pricePerRun: number): number {
    // Convert dollar price to tokens (1 token = $0.01)
    return Math.ceil(pricePerRun * 100);
  }

  // Format token amount for display
  formatTokens(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  }
}
