"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessManagerAgent = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
let ProcessManagerAgent = class ProcessManagerAgent {
    logger;
    processes = new Map();
    instances = new Map();
    completion_times = [];
    monitoring_interval;
    constructor(logger) {
        this.logger = logger;
        this.logger.log('ProcessManagerAgent initialized', 'ProcessManagerAgent');
        this.startMonitoring();
    }
    async createProcess(definition) {
        const process = {
            id: `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      ...definition,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Validate process definition
    this.validateProcessDefinition(process);

    this.processes.set(process.id, process);`,
            this: .logger.log(Process, created, $, { definition, : .name } ` (${process.id}`), 'ProcessManagerAgent': 
        };
        return process;
    }
    async updateProcess(id, updates) {
        const process = this.processes.get(id);
        if (!process) {
            return null;
        }
        Object.assign(process, updates, { updated_at: new Date() });
        // Re-validate after updates
        if (updates.stages || updates.rules) {
            this.validateProcessDefinition(process);
        }
        this.logger.log(Process, updated, $, { process, : .name }($, { id }), 'ProcessManagerAgent');
        return process;
    }
    async deleteProcess(id) {
        const process = this.processes.get(id);
        if (!process) {
            return false;
        }
        // Check for active instances
        const active_instances = Array.from(this.instances.values())
            .filter(instance => instance.process_id === id && instance.status === 'active');
        if (active_instances.length > 0) {
            `
      throw new Error(`;
            Cannot;
            delete process;
            with ($) {
                active_instances.length;
            }
            active;
            instances;
            ;
        }
        `
`;
        this.processes.delete(id);
        this.logger.log(Process, deleted, $, { process, : .name } ` (${id}), 'ProcessManagerAgent');
    
    return true;
  }

  async startProcessInstance(process_id: string, variables: Record<string, any> = {}, started_by: string, priority: ProcessInstance['priority'] = 'normal'): Promise<string> {`);
        const process = this.processes.get(process_id);
        `
    if (!process) {
      throw new Error(Process not found: ${process_id});
    }
`;
        if (process.status !== 'active') {
            `
      throw new Error(Process is not active: ${process.status}`;
            ;
        }
        const instance = {
            id: instance_$
        }, { Date, now };
        ();
    }
    _$;
};
exports.ProcessManagerAgent = ProcessManagerAgent;
exports.ProcessManagerAgent = ProcessManagerAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], ProcessManagerAgent);
{
    Math.random().toString(36).substr(2, 9);
}
process_id,
    status;
'active',
    current_stage;
this.findInitialStage(process).id,
    priority,
    variables;
{
    process.variables, ;
    variables;
}
stage_instances: [],
    started_by,
    started_at;
new Date(),
    process_log;
[],
    attachments;
[];
;
// Calculate SLA deadline if configured
if (process.sla_config?.enabled) {
    instance.sla_deadline = this.calculateSLADeadline(process.sla_config, instance.started_at);
    instance.sla_status = 'on_track';
}
this.instances.set(instance.id, instance);
// Create initial stage instance
await this.enterStage(instance, this.findInitialStage(process));
`
    `;
this.addProcessLog(instance, 'started', undefined, started_by, Process, instance, started, $, { process, : .name } `);
    this.logger.log(Process instance started: ${process.name} (${instance.id}), 'ProcessManagerAgent');
    
    return instance.id;
  }

  async completeStage(instance_id: string, stage_id: string, action: ProcessAction, form_data: Record<string, any> = {}, user_id: string, comment?: string): Promise<boolean> {
    const instance = this.instances.get(instance_id);
    if (!instance) {
      return false;
    }

    const process = this.processes.get(instance.process_id);
    if (!process) {
      return false;
    }

    const stage_instance = instance.stage_instances.find(si => si.stage_id === stage_id && si.status === 'active');
    if (!stage_instance) {
      return false;
    }

    // Validate user permissions
    if (!this.canUserCompleteStage(user_id, stage_instance, process)) {
      throw new Error('User does not have permission to complete this stage');
    }

    // Complete the stage
    stage_instance.status = 'completed';
    stage_instance.completed_at = new Date();
    stage_instance.duration = stage_instance.completed_at.getTime() - stage_instance.started_at!.getTime();
    stage_instance.action_taken = action;
    stage_instance.form_data = form_data;

    if (comment) {
      stage_instance.comments.push({`, id, comment_$, { Date, : .now() }, _$, { Math, : .random().toString(36).substr(2, 6) } `,
        user_id,
        message: comment,
        timestamp: new Date(),
        action_type: action.type
      });
    }

    this.addProcessLog(instance, 'stage_completed', stage_id, user_id, Stage completed: ${action.name});

    // Determine next stage(s)
    const next_stages = await this.determineNextStages(instance, process, action);
    
    if (next_stages.length === 0) {
      // Process completed
      instance.status = 'completed';
      instance.completed_at = new Date();
      instance.duration = instance.completed_at.getTime() - instance.started_at.getTime();
      
      this.completion_times.push(instance.duration);
      if (this.completion_times.length > 1000) {
        this.completion_times.shift();
      }` `
      this.addProcessLog(instance, 'completed', undefined, user_id, 'Process completed');
      this.logger.log(Process instance completed: ${instance.id}, 'ProcessManagerAgent');
    } else {
      // Move to next stage(s)
      for (const next_stage of next_stages) {
        await this.enterStage(instance, next_stage);
      }
    }

    return true;
  }

  async reassignStage(instance_id: string, stage_id: string, new_assignees: string[], user_id: string, reason?: string): Promise<boolean> {
    const instance = this.instances.get(instance_id);
    if (!instance) {
      return false;
    }

    const stage_instance = instance.stage_instances.find(si => si.stage_id === stage_id && si.status === 'active');
    if (!stage_instance) {
      return false;
    }

    stage_instance.assigned_to = new_assignees;` `
    this.addProcessLog(instance, 'assigned', stage_id, user_id, Stage reassigned to: ${new_assignees.join(', ')}`, $, { reason } - $, { reason }, '');
`
    this.logger.log(Stage reassigned: ${instance_id}/${stage_id} to ${new_assignees.join(', ')}`, 'ProcessManagerAgent';
;
return true;
async;
escalateStage(instance_id, string, stage_id, string, escalation_level, number = 1);
Promise < boolean > {
    const: instance = this.instances.get(instance_id),
    if(, instance) {
        return false;
    },
    const: process = this.processes.get(instance.process_id),
    if(, process) {
        return false;
    },
    const: stage = process.stages.find(s => s.id === stage_id),
    const: stage_instance = instance.stage_instances.find(si => si.stage_id === stage_id && si.status === 'active'),
    if(, stage) { }
} || !stage_instance;
{
    return false;
}
const escalation_rule = stage.escalation_rules?.[escalation_level - 1];
if (!escalation_rule) {
    return false;
}
stage_instance.escalation_level = escalation_level;
stage_instance.assigned_to = escalation_rule.escalate_to;
this.addProcessLog(instance, 'escalated', stage_id, 'system', Stage, escalated, to, level, $, { escalation_level } `: ${escalation_rule.escalate_to.join(', ')});`, this.logger.log(Stage, escalated, $, { instance_id } `/${stage_id}`, to, level, $, { escalation_level }, 'ProcessManagerAgent'));
return true;
async;
cancelProcessInstance(instance_id, string, user_id, string, reason ?  : string);
Promise < boolean > {
    const: instance = this.instances.get(instance_id),
    if(, instance) {
        return false;
    },
    instance, : .status = 'cancelled',
    instance, : .completed_at = new Date(),
    instance, : .duration = instance.completed_at.getTime() - instance.started_at.getTime(),
    // Cancel all active stage instances
    instance, : .stage_instances.forEach(si => {
        if (si.status === 'active') {
            si.status = 'cancelled';
            si.completed_at = new Date();
        }
    })
} `
    this.addProcessLog(instance, 'cancelled', undefined, user_id, Process cancelled${reason ? `: ${reason}` : ''});
    this.logger.log(Process instance cancelled: ${instance_id}, 'ProcessManagerAgent');
    
    return true;
  }

  async getProcessInstance(instance_id: string): Promise<ProcessInstance | null> {
    return this.instances.get(instance_id) || null;
  }

  async getProcessInstances(filter: {
    process_id?: string;
    status?: ProcessInstance['status'];
    priority?: ProcessInstance['priority'];
    started_by?: string;
    assigned_to?: string;
    sla_status?: ProcessInstance['sla_status'];
    limit?: number;
  } = {}): Promise<ProcessInstance[]> {
    let instances = Array.from(this.instances.values());

    if (filter.process_id) {
      instances = instances.filter(i => i.process_id === filter.process_id);
    }
    if (filter.status) {
      instances = instances.filter(i => i.status === filter.status);
    }
    if (filter.priority) {
      instances = instances.filter(i => i.priority === filter.priority);
    }
    if (filter.started_by) {
      instances = instances.filter(i => i.started_by === filter.started_by);
    }
    if (filter.assigned_to) {
      instances = instances.filter(i =>
        i.stage_instances.some(si => si.assigned_to.includes(filter.assigned_to!))
      );
    }
    if (filter.sla_status) {
      instances = instances.filter(i => i.sla_status === filter.sla_status);
    }

    instances.sort((a, b) => b.started_at.getTime() - a.started_at.getTime());
    
    return instances.slice(0, filter.limit || 100);
  }

  async getMyTasks(user_id: string): Promise<{
    instance: ProcessInstance;
    stage: ProcessStage;
    stage_instance: StageInstance;
  }[]> {
    const my_tasks: {
      instance: ProcessInstance;
      stage: ProcessStage;
      stage_instance: StageInstance;
    }[] = [];

    for (const instance of this.instances.values()) {
      if (instance.status !== 'active') continue;

      const process = this.processes.get(instance.process_id);
      if (!process) continue;

      for (const stage_instance of instance.stage_instances) {
        if (stage_instance.status === 'active' && stage_instance.assigned_to.includes(user_id)) {
          const stage = process.stages.find(s => s.id === stage_instance.stage_id);
          if (stage) {
            my_tasks.push({
              instance,
              stage,
              stage_instance
            });
          }
        }
      }
    }

    return my_tasks.sort((a, b) => {
      // Sort by priority, then by start date
      const priority_order = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priority_diff = priority_order[b.instance.priority] - priority_order[a.instance.priority];
      if (priority_diff !== 0) return priority_diff;
      
      return a.stage_instance.started_at!.getTime() - b.stage_instance.started_at!.getTime();
    });
  }

  async getStats(): Promise<ProcessManagerStats> {
    const processes = Array.from(this.processes.values());
    const instances = Array.from(this.instances.values());
    
    const processes_by_type: Record<string, number> = {};
    const instances_by_status: Record<string, number> = {};
    const instances_by_priority: Record<string, number> = {};

    processes.forEach(process => {
      processes_by_type[process.process_type] = (processes_by_type[process.process_type] || 0) + 1;
    });

    instances.forEach(instance => {
      instances_by_status[instance.status] = (instances_by_status[instance.status] || 0) + 1;
      instances_by_priority[instance.priority] = (instances_by_priority[instance.priority] || 0) + 1;
    });

    const average_completion_time = this.completion_times.length > 0 ?
      this.completion_times.reduce((a, b) => a + b, 0) / this.completion_times.length : 0;

    const completed_instances = instances.filter(i => i.status === 'completed');
    const sla_compliant = completed_instances.filter(i => 
      i.sla_deadline && i.completed_at && i.completed_at <= i.sla_deadline
    );
    
    const sla_compliance_rate = completed_instances.length > 0 ?
      sla_compliant.length / completed_instances.length : 1;

    return {
      total_processes: processes.length,
      active_processes: processes.filter(p => p.status === 'active').length,
      total_instances: instances.length,
      active_instances: instances.filter(i => i.status === 'active').length,
      completed_instances: completed_instances.length,
      failed_instances: instances.filter(i => i.status === 'failed').length,
      average_completion_time,
      sla_compliance_rate,
      processes_by_type,
      instances_by_status,
      instances_by_priority
    };
  }

  private validateProcessDefinition(process: ProcessDefinition): void {
    // Validate stages
    if (!process.stages || process.stages.length === 0) {
      throw new Error('Process must have at least one stage');
    }

    // Check for valid initial stage
    const initial_stages = process.stages.filter(stage => 
      !process.stages.some(s => s.next_stages.includes(stage.id))
    );
    
    if (initial_stages.length === 0) {
      throw new Error('Process must have at least one initial stage');
    }

    // Validate stage references
    process.stages.forEach(stage => {
      stage.next_stages.forEach(next_id => {
        if (!process.stages.find(s => s.id === next_id)) {`;
throw new Error(Stage, $, { stage, : .id } ` references non-existent next stage: ${next_id});
        }
      });
    });

    // Validate variable references in rules
    process.rules.forEach(rule => {`, rule.conditions.forEach(condition => {
    `
        if (!Object.keys(process.variables).includes(condition.field)) {
          throw new Error(Rule ${rule.id} references undefined variable: ${condition.field}`;
}));
;
;
findInitialStage(process, ProcessDefinition);
ProcessStage;
{
    const initial_stages = process.stages.filter(stage => !process.stages.some(s => s.next_stages.includes(stage.id)));
    return initial_stages[0]; // Return first initial stage
}
async;
enterStage(instance, ProcessInstance, stage, ProcessStage);
Promise < void  > {
    const: stage_instance, StageInstance = {
        id: stage_$
    }
};
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
`,
      stage_id: stage.id,
      status: 'active',
      assigned_to: [...stage.assignees],
      started_at: new Date(),
      comments: [],
      escalation_level: 0
    };

    instance.stage_instances.push(stage_instance);
    instance.current_stage = stage.id;
    
    this.addProcessLog(instance, 'stage_entered', stage.id, 'system', Entered stage: ${stage.name});
  }

  private async determineNextStages(instance: ProcessInstance, process: ProcessDefinition, action: ProcessAction): Promise<ProcessStage[]> {
    const current_stage = process.stages.find(s => s.id === instance.current_stage);
    if (!current_stage) {
      return [];
    }

    // If action specifies next stage, use that
    if (action.next_stage) {
      const next_stage = process.stages.find(s => s.id === action.next_stage);
      return next_stage ? [next_stage] : [];
    }

    // Otherwise, use stage's next_stages
    const next_stages: ProcessStage[] = [];
    for (const next_stage_id of current_stage.next_stages) {
      const next_stage = process.stages.find(s => s.id === next_stage_id);
      if (next_stage) {
        next_stages.push(next_stage);
      }
    }

    return next_stages;
  }

  private canUserCompleteStage(user_id: string, stage_instance: StageInstance, process: ProcessDefinition): boolean {
    // Check if user is assigned to this stage
    return stage_instance.assigned_to.includes(user_id);
  }

  private calculateSLADeadline(sla_config: SLAConfig, start_date: Date): Date {
    if (sla_config.business_hours_only) {
      // Calculate deadline considering business hours
      // This is a simplified implementation
      return new Date(start_date.getTime() + sla_config.target_completion_time);
    } else {
      return new Date(start_date.getTime() + sla_config.target_completion_time);
    }
  }

  private addProcessLog(instance: ProcessInstance, event_type: ProcessLogEntry['event_type'], stage_id?: string, user_id?: string, details?: string): void {
    instance.process_log.push({
      timestamp: new Date(),
      event_type,
      stage_id,
      user_id,
      details: details || ''
    });
  }

  private startMonitoring(): void {
    this.monitoring_interval = setInterval(() => {
      this.monitorSLAs();
      this.checkTimeouts();
    }, 60000); // Check every minute
  }

  private monitorSLAs(): void {
    const now = new Date();
    
    for (const instance of this.instances.values()) {
      if (instance.status === 'active' && instance.sla_deadline) {
        const time_remaining = instance.sla_deadline.getTime() - now.getTime();
        const total_time = instance.sla_deadline.getTime() - instance.started_at.getTime();
        const elapsed_percentage = 1 - (time_remaining / total_time);
        
        if (time_remaining <= 0) {
          instance.sla_status = 'overdue';
        } else if (elapsed_percentage >= 0.8) {
          instance.sla_status = 'at_risk';
        } else {
          instance.sla_status = 'on_track';
        }
      }
    }
  }

  private checkTimeouts(): void {
    const now = new Date();
    
    for (const instance of this.instances.values()) {
      if (instance.status !== 'active') continue;
      
      const process = this.processes.get(instance.process_id);
      if (!process) continue;
      
      for (const stage_instance of instance.stage_instances) {
        if (stage_instance.status !== 'active' || !stage_instance.started_at) continue;
        
        const stage = process.stages.find(s => s.id === stage_instance.stage_id);
        if (!stage?.timeout_config?.enabled) continue;
        
        const elapsed = now.getTime() - stage_instance.started_at.getTime();
        if (elapsed >= stage.timeout_config.duration) {
          this.handleStageTimeout(instance, stage_instance, stage);
        }
      }
    }
  }

  private async handleStageTimeout(instance: ProcessInstance, stage_instance: StageInstance, stage: ProcessStage): Promise<void> {
    const timeout_config = stage.timeout_config!;
    
    switch (timeout_config.action) {
      case 'escalate':
        await this.escalateStage(instance.id, stage.id, stage_instance.escalation_level + 1);
        break;
      
      case 'auto_approve':
        // Simulate auto-approval
        const approve_action = stage.actions.find(a => a.type === 'approve');
        if (approve_action) {
          await this.completeStage(instance.id, stage.id, approve_action, {}, 'system', 'Auto-approved due to timeout');
        }
        break;
      
      case 'auto_reject':
        // Simulate auto-rejection
        const reject_action = stage.actions.find(a => a.type === 'reject');
        if (reject_action) {
          await this.completeStage(instance.id, stage.id, reject_action, {}, 'system', 'Auto-rejected due to timeout');
        }
        break;
      
      case 'pause':
        instance.status = 'paused';
        this.addProcessLog(instance, 'stage_entered', stage.id, 'system', 'Process paused due to stage timeout');
        break;
    }
    `;
this.logger.log(Stage, timeout, handled, $, { instance, : .id } `/${stage.id} - ${timeout_config.action}` `, 'ProcessManagerAgent');
  }

  async destroy(): Promise<void> {
    if (this.monitoring_interval) {
      clearInterval(this.monitoring_interval);
    }
    this.logger.log('ProcessManagerAgent destroyed', 'ProcessManagerAgent');
  }
}

export default ProcessManagerAgent;);
//# sourceMappingURL=process-manager.js.map