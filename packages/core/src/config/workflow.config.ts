export interface WorkflowConfig {
  // Implementation needed
}
  audit: {
  // Implementation needed
}
    retention: {
  // Implementation needed
}
      days: number;
      highPriorityDays: number;
    };
    sampling: {
  // Implementation needed
}
      enabled: boolean;
      rate: number;
    };
  };
  resources: {
  // Implementation needed
}
    scaling: {
  // Implementation needed
}
      enabled: boolean;
      minInstances: number;
      maxInstances: number;
      cooldownPeriod: number;
    };
    limits: {
  // Implementation needed
}
      cpu: number;
      memory: number;
      storage: number;
    };
  };
  security: {
  // Implementation needed
}
    encryption: {
  // Implementation needed
}
      algorithm: string;
      keyRotationDays: number;
    };
    authentication: {
  // Implementation needed
}
      sessionTimeout: number;
      maxAttempts: number;
    };
  };
  recovery: {
  // Implementation needed
}
    backup: {
  // Implementation needed
}
      schedule: string;
      retention: number;
      compressionLevel: number;
    };
    monitoring: {
  // Implementation needed
}
      checkInterval: number;
      healthThreshold: number;
    };
  };
}