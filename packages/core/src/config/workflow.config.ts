export interface WorkflowConfig {
  audit: unknown;
  // Implementation needed
}
    retention: unknown;
  // Implementation needed
}
      days: number;
      highPriorityDays: number;
    };
    sampling: unknown;
  // Implementation needed
}
      enabled: boolean;
      rate: number;
    };
  };
  resources: unknown;
  // Implementation needed
}
    scaling: unknown;
  // Implementation needed
}
      enabled: boolean;
      minInstances: number;
      maxInstances: number;
      cooldownPeriod: number;
    };
    limits: unknown;
  // Implementation needed
}
      cpu: number;
      memory: number;
      storage: number;
    };
  };
  security: unknown;
  // Implementation needed
}
    encryption: unknown;
  // Implementation needed
}
      algorithm: string;
      keyRotationDays: number;
    };
    authentication: unknown;
  // Implementation needed
}
      sessionTimeout: number;
      maxAttempts: number;
    };
  };
  recovery: unknown;
  // Implementation needed
}
    backup: unknown;
  // Implementation needed
}
      schedule: string;
      retention: number;
      compressionLevel: number;
    };
    monitoring: unknown;
  // Implementation needed
}
      checkInterval: number;
      healthThreshold: number;
    };
  };
}