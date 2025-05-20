import { Container } from 'inversify';
import { WorkflowAuditSystem } from './audit.js';
import { WorkflowResourceManager } from './resources.js';
import { WorkflowSecurityManager } from './security.js';
import { WorkflowTestFramework } from './testing.js';
import { WorkflowAnalytics } from './analytics.js';
import { WorkflowRecoverySystem } from './recovery.js';
import { WorkflowAPIGateway } from './gateway.js';
import { WorkflowEngine } from './engine.js';
import { WorkflowErrorRecovery } from './errorRecovery.js';
import { WorkflowMonitor } from './monitor.js';

export interface WorkflowServices {
  audit: WorkflowAuditSystem;
  resources: WorkflowResourceManager;
  security: WorkflowSecurityManager;
  testing: WorkflowTestFramework;
  analytics: WorkflowAnalytics;
  recovery: WorkflowRecoverySystem;
  gateway: WorkflowAPIGateway;
  engine: WorkflowEngine;
  errorRecovery: WorkflowErrorRecovery;
  monitor: WorkflowMonitor;
}

export class WorkflowModule {
  private readonly container: Container;

  constructor() {
    this.container = new Container();
    this.registerServices();
  }

  private registerServices(): void {
    // Register all workflow services
    this.container.bind<WorkflowAuditSystem>(WorkflowAuditSystem).toSelf().inSingletonScope();
    this.container.bind<WorkflowResourceManager>(WorkflowResourceManager).toSelf().inSingletonScope();
    this.container.bind<WorkflowSecurityManager>(WorkflowSecurityManager).toSelf().inSingletonScope();
    this.container.bind<WorkflowTestFramework>(WorkflowTestFramework).toSelf().inSingletonScope();
    this.container.bind<WorkflowAnalytics>(WorkflowAnalytics).toSelf().inSingletonScope();
    this.container.bind<WorkflowRecoverySystem>(WorkflowRecoverySystem).toSelf().inSingletonScope();
    this.container.bind<WorkflowAPIGateway>(WorkflowAPIGateway).toSelf().inSingletonScope();
    this.container.bind<WorkflowEngine>(WorkflowEngine).toSelf().inSingletonScope();
    this.container.bind<WorkflowErrorRecovery>(WorkflowErrorRecovery).toSelf().inSingletonScope();
    this.container.bind<WorkflowMonitor>(WorkflowMonitor).toSelf().inSingletonScope();
  }

  getServices(): WorkflowServices {
    return {
      audit: this.container.get(WorkflowAuditSystem),
      resources: this.container.get(WorkflowResourceManager),
      security: this.container.get(WorkflowSecurityManager),
      testing: this.container.get(WorkflowTestFramework),
      analytics: this.container.get(WorkflowAnalytics),
      recovery: this.container.get(WorkflowRecoverySystem),
      gateway: this.container.get(WorkflowAPIGateway),
      engine: this.container.get(WorkflowEngine),
      errorRecovery: this.container.get(WorkflowErrorRecovery),
      monitor: this.container.get(WorkflowMonitor)
    };
  }
}

// Export all workflow components
export * from './engine.js';
export * from './errorRecovery.js';
export * from './monitor.js';
export * from './gateway.js';
export * from './types.js';
