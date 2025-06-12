import { Container } from 'inversify';
import { WorkflowAuditSystem } from './audit.tsx';
import { WorkflowResourceManager } from './resources.tsx';
import { WorkflowSecurityManager } from './security.tsx';
import { WorkflowTestFramework } from './testing.tsx';
import { WorkflowAnalytics } from './analytics.tsx';
import { WorkflowRecoverySystem } from './recovery.tsx';
import { WorkflowAPIGateway } from './gateway.tsx';
import { WorkflowEngine } from './engine.tsx';
import { WorkflowErrorRecovery } from './errorRecovery.tsx';
import { WorkflowMonitor } from './monitor.tsx';

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
export * from './engine.tsx';
export * from './errorRecovery.tsx';
export * from './monitor.tsx';
export * from './gateway.tsx';
export * from './types.tsx';
