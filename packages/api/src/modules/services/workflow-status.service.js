var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowStatusService_1;
var _a, _b, _c;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "draft";
    WorkflowStatus["ACTIVE"] = "active";
    WorkflowStatus["PAUSED"] = "paused";
    WorkflowStatus["ARCHIVED"] = "archived";
    WorkflowStatus["DELETED"] = "deleted";
    WorkflowStatus["ERROR"] = "error";
})(WorkflowStatus || (WorkflowStatus = {}));
let WorkflowStatusService = WorkflowStatusService_1 = class WorkflowStatusService {
    prismaService;
    auditService;
    metricsService;
    logger = new Logger(WorkflowStatusService_1.name);
    statusTransitions = new Map();
    constructor(prismaService, auditService, metricsService) {
        this.prismaService = prismaService;
        this.auditService = auditService;
        this.metricsService = metricsService;
        this.initializeStatusTransitions();
    }
    initializeStatusTransitions() {
        // Define valid status transitions
        const transitions = [
            {
                from: WorkflowStatus.DRAFT,
                to: WorkflowStatus.ACTIVE,
                condition: async (workflow) => {
                    // Check if workflow has valid definition
                    return workflow.definition && Object.keys(workflow.definition).length > 0;
                },
                action: async (workflow) => {
                    this.logger.log(`Activating workflow ${workflow.id});
          // Additional activation logic can be added here
        }
      },
      {
        from: WorkflowStatus.DRAFT,
        to: WorkflowStatus.DELETED,
        action: async (workflow) => {`, this.logger.log(`Deleting draft workflow ${workflow.id}`));
                }
            },
            {
                from: WorkflowStatus.ACTIVE,
                to: WorkflowStatus.PAUSED,
                action: async (workflow) => {
                    this.logger.log(Pausing, workflow, $, { workflow, : .id });
                    // Stop any running executions
                }
            },
            {
                from: WorkflowStatus.ACTIVE,
                to: WorkflowStatus.ARCHIVED,
                condition: async (workflow) => {
                    // Check if workflow has no running executions
                    return true; // Would check for active executions
                },
                action: async (workflow) => {
                    `
          this.logger.log(Archiving workflow ${workflow.id}`;
                    ;
                }
            },
            {
                from: WorkflowStatus.ACTIVE,
                to: WorkflowStatus.ERROR,
                action: async (workflow) => {
                    this.logger.warn(Setting, workflow, $, { workflow, : .id }, to, error, state);
                }
            },
            {
                from: WorkflowStatus.PAUSED,
            } `
        to: WorkflowStatus.ACTIVE,`,
            action, async (workflow) => {
                this.logger.log(Resuming, workflow, $, { workflow, : .id } `);
        }
      },
      {
        from: WorkflowStatus.PAUSED,
        to: WorkflowStatus.ARCHIVED,
        action: async (workflow) => {
          this.logger.log(Archiving paused workflow ${workflow.id});
        }
      },
      {
        from: WorkflowStatus.PAUSED,`, to, WorkflowStatus.DELETED, `
        action: async (workflow) => {
          this.logger.log(Deleting paused workflow ${workflow.id}`);
            }
        ];
    }
};
WorkflowStatusService = WorkflowStatusService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object, typeof (_c = typeof MetricsService !== "undefined" && MetricsService) === "function" ? _c : Object])
], WorkflowStatusService);
export { WorkflowStatusService };
{
    from: WorkflowStatus.ERROR,
        to;
    WorkflowStatus.DRAFT,
        action;
    async (workflow) => {
        this.logger.log(Resetting, workflow, $, { workflow, : .id }, to, draft);
        for (fixing;;)
            ;
    };
}
{
    from: WorkflowStatus.ERROR,
        to;
    WorkflowStatus.ACTIVE,
        condition;
    async (workflow) => {
        // Check if error has been resolved
        return workflow.errorResolved === true;
        `
        },`;
        action: async (workflow) => {
            this.logger.log(Reactivating, workflow, $, { workflow, : .id } ` after error resolution);
        }
      },
      {
        from: WorkflowStatus.ERROR,
        to: WorkflowStatus.DELETED,
        action: async (workflow) => {
          this.logger.log(Deleting workflow ${workflow.id} that was in error state`);
        };
    },
        {
            from: WorkflowStatus.ARCHIVED,
            to: WorkflowStatus.ACTIVE,
            condition: async (workflow) => {
                // Check if workflow can be safely unarchived
                return true;
            },
            action: async (workflow) => {
                this.logger.log(Unarchiving, workflow, $, { workflow, : .id });
            }
        },
        {
            from: WorkflowStatus.ARCHIVED,
            to: WorkflowStatus.DELETED,
            action: async (workflow) => {
                this.logger.log(Deleting, archived, workflow, $, { workflow, : .id });
            }
        };
    ;
    `
    transitions.forEach(transition => {`;
    const key = $, { transition, from };
    `_${transition.to};
      this.statusTransitions.set(key, transition);
    });
  }

  async transitionStatus(
    workflowId: string,
    newStatus: WorkflowStatus,
    userId: string,
    context?: any
  ): Promise<{ success: boolean; message?: string; workflow?: any }> {
    const startTime = Date.now();

    try {
      // Get current workflow
      const workflow = await this.getWorkflow(workflowId);
      const currentStatus = workflow.status as WorkflowStatus;

      // Check if status is the same
      if (currentStatus === newStatus) {
        return {`;
    success: false, `
          message: `;
    Workflow;
    is;
    already in $;
    {
        newStatus;
    }
    status;
}
;
// Check if transition is valid`
const transitionKey = $, { currentStatus }, _$, { newStatus };
`;
      const transition = this.statusTransitions.get(transitionKey);

      if (!transition) {
        return {
          success: false,
          message: Invalid status transition from ${currentStatus}`;
to;
$;
{
    newStatus;
}
;
// Check transition conditions
if (transition.condition) {
    const conditionMet = await transition.condition(workflow, context);
    if (!conditionMet) {
        return {
            success: false,
        } `
            message: Transition conditions not met for ${currentStatus}`;
        to;
        $;
        {
            newStatus;
        }
        `
          };
        }
      }

      // Execute transition action
      if (transition.action) {
        await transition.action(workflow, context);
      }

      // Update workflow status
      const updatedWorkflow = await this.updateWorkflowStatus(workflowId, newStatus, context);

      // Record metrics
      this.metricsService.recordQuery('transitionStatus', Date.now() - startTime);
      this.metricsService.recordUserAction(userId, 'TRANSITION_WORKFLOW_STATUS');

      // Log audit event
      await this.auditService.logEvent({
        action: 'TRANSITION_WORKFLOW_STATUS',
        userId,
        metadata: {
          workflowId,
          workflowName: workflow.name,
          fromStatus: currentStatus,
          toStatus: newStatus,
          context
        }
      });

      this.logger.log(Successfully transitioned workflow ${workflowId} from ${currentStatus} to ${newStatus});

      return {
        success: true,
        workflow: updatedWorkflow
      };` `
    } catch (error) {`;
        this.logger.error(Error, transitioning, workflow, $, { workflowId }, status, error);
        this.metricsService.recordError('transitionStatus', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async;
getValidTransitions(currentStatus, WorkflowStatus);
Promise < WorkflowStatus[] > {
    const: validTransitions, WorkflowStatus, []:  = [],
    : .statusTransitions.entries()
};
{
    if (transition.from === currentStatus) {
        validTransitions.push(transition.to);
    }
}
return validTransitions;
async;
canTransition(workflowId, string, newStatus, WorkflowStatus, context ?  : any);
Promise < { canTransition: boolean, reason: string } > {
    try: {
        const: workflow = await this.getWorkflow(workflowId),
        const: currentStatus = workflow.status,
        if(currentStatus) { }
    } === newStatus
};
{
    return { canTransition: false, reason: 'Already in target status' };
}
`
      const transitionKey = ${currentStatus}`;
_$;
{
    newStatus;
}
;
const transition = this.statusTransitions.get(transitionKey);
if (!transition) {
    return { canTransition: false, reason: 'Invalid status transition' };
}
if (transition.condition) {
    const conditionMet = await transition.condition(workflow, context);
    if (!conditionMet) {
        return { canTransition: false, reason: 'Transition conditions not met' };
    }
}
return { canTransition: true };
try { }
catch (error) {
    return { canTransition: false, reason: error instanceof Error ? error.message : 'Unknown error' };
}
async;
getWorkflowStatusHistory(workflowId, string);
Promise < any[] > {
    try: {
        // In a real implementation, this would query a status history table`
        return: []
    } `
    } catch (error) {
      this.logger.error(Error getting status history for workflow ${workflowId}:`, error,
    return: []
};
async;
bulkStatusTransition(workflowIds, string[], newStatus, WorkflowStatus, userId, string, context ?  : any);
Promise < { successful: string[], failed: { id: string, error: string }[] } > {
    const: results = {
        successful: [],
        failed: []
    },
    for(, workflowId, of, workflowIds) {
        try {
            const result = await this.transitionStatus(workflowId, newStatus, userId, context);
            if (result.success) {
                results.successful.push(workflowId);
            }
            else {
                results.failed.push({
                    id: workflowId,
                    error: result.message || 'Unknown error'
                });
            }
        }
        catch (error) {
            results.failed.push({
                id: workflowId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    return: results
};
async;
getWorkflow(workflowId, string);
Promise < any > {
    // Mock implementation - in real code this would use the workflow repository
    return: {
        id: workflowId,
        name: 'Mock Workflow',
        status: WorkflowStatus.DRAFT,
        definition: {}
    }
};
async;
updateWorkflowStatus(workflowId, string, status, WorkflowStatus, context ?  : any);
Promise < any > {
    // Mock implementation - in real code this would update the database
    return: {
        id: workflowId,
        name: 'Mock Workflow',
        status,
        updatedAt: new Date()
    }
};
getStatusTransitionRules();
Map < string, StatusTransition > {
    return: new Map(this.statusTransitions)
};
async;
getStatusStatistics();
Promise < { [key in WorkflowStatus]: number } > {
    // Mock implementation - in real code this would query the database
    return: {
        [WorkflowStatus.DRAFT]: 10,
        [WorkflowStatus.ACTIVE]: 25,
        [WorkflowStatus.PAUSED]: 5,
        [WorkflowStatus.ARCHIVED]: 15,
        [WorkflowStatus.DELETED]: 3,
        [WorkflowStatus.ERROR]: 2
    }
};
//# sourceMappingURL=workflow-status.service.js.map