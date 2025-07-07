
export interface UsageMetrics { totalRequests: number;
  uniqueUsers: number; }
  featuresUsed: Record<string, number>;
}

@Injectable()
export class UsageAnalytics { private usage: Array<{ userId: string; feature: string; timestamp: Date }> = [];

  trackUsage(userId: string, feature: string): void { this.usage.push({
      userId,
      feature, }
      timestamp: new Date()
     });
  }

  getMetrics(): UsageMetrics { const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentUsage = this.usage.filter(u => u.timestamp > dayAgo);
    const uniqueUsers = new Set(recentUsage.map(u => u.userId)).size; }
    const featuresUsed: Record<string, number> = {};
    
    recentUsage.forEach(usage => {  }
      featuresUsed[usage.feature] = (featuresUsed[usage.feature] || 0) + 1;
    });

    return { totalRequests: recentUsage.length,;
      uniqueUsers, }
      featuresUsed
    };
  }
}