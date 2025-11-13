"use strict";
/**
 * ProtobufAdapter.ts
 *
 * Handles conversion between internal data structures and Protocol Buffer messages
 * for TRAYCER-style agent communication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtobufAdapter = void 0;
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const index_1 = require("../proto/index");
class ProtobufAdapter {
    // Type aliases for generated protobuf symbols with fallbacks
    Task = index_1.taskPb.Task || class Task {
    };
    Step = index_1.taskPb.Step || class Step {
    };
    Status = index_1.taskPb.Status || { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2, FAILED: 3, CANCELLED: 4 };
    RpcRequest = index_1.rpcPb.RpcRequest || class RpcRequest {
    };
    RpcResponse = index_1.rpcPb.RpcResponse || class RpcResponse {
    };
    UserPrompt = index_1.promptPb.UserPrompt || class UserPrompt {
    };
    McpMessage = index_1.mcpPb.McpMessage || class McpMessage {
    };
    /**
     * Convert internal AgentTask to Protocol Buffer Task
     */
    taskToProtobuf(task) {
        try {
            const pbTask = new this.Task();
            if (pbTask.setId)
                pbTask.setId(task.id);
            if (pbTask.setParentId && task.parentId)
                pbTask.setParentId(task.parentId);
            if (pbTask.setAgentId)
                pbTask.setAgentId(task.agentId);
            if (pbTask.setTitle)
                pbTask.setTitle(task.title);
            if (pbTask.setDescription)
                pbTask.setDescription(task.description);
            // Convert status
            if (pbTask.setStatus)
                pbTask.setStatus(this.statusToProtobuf(task.status));
            // Convert parameters if provided
            if (task.parameters && pbTask.setParameters) {
                const struct = this.objectToStruct(task.parameters);
                pbTask.setParameters(struct);
            }
            // Convert timestamps
            if (task.createdAt && pbTask.setCreatedAt) {
                const timestamp = new timestamp_pb_1.Timestamp();
                timestamp.fromDate(task.createdAt);
                pbTask.setCreatedAt(timestamp);
            }
            if (task.updatedAt && pbTask.setUpdatedAt) {
                const timestamp = new timestamp_pb_1.Timestamp();
                timestamp.fromDate(task.updatedAt);
                pbTask.setUpdatedAt(timestamp);
            }
            // Convert steps
            if (task.steps && pbTask.setStepsList) {
                const pbSteps = task.steps.map(step => this.stepToProtobuf(step));
                pbTask.setStepsList(pbSteps);
            }
            return pbTask;
        }
        catch (error) {
            console.error('Error converting task to protobuf:', error);
            throw new Error(`Failed to convert task to protobuf: ${error});
    }
  }

  /**
   * Convert Protocol Buffer Task to internal AgentTask
   */
  taskFromProtobuf(pbTask: InstanceType<typeof this.Task>): AgentTask {
    try {
      const task: AgentTask = {
        id: (pbTask.getId && pbTask.getId()) || '',
        agentId: (pbTask.getAgentId && pbTask.getAgentId()) || '',
        title: (pbTask.getTitle && pbTask.getTitle()) || '',
        description: (pbTask.getDescription && pbTask.getDescription()) || '',
        status: this.statusFromProtobuf((pbTask.getStatus && pbTask.getStatus()) || 0),
      };
      
      if (pbTask.getParentId && pbTask.getParentId()) {
        task.parentId = pbTask.getParentId();
      }
      
      if (pbTask.getParameters && pbTask.getParameters()) {
        task.parameters = this.structToObject(pbTask.getParameters());
      }
      
      if (pbTask.getCreatedAt && pbTask.getCreatedAt()) {
        task.createdAt = pbTask.getCreatedAt().toDate();
      }
      
      if (pbTask.getUpdatedAt && pbTask.getUpdatedAt()) {
        task.updatedAt = pbTask.getUpdatedAt().toDate();
      }
      
      if (pbTask.getStepsList && pbTask.getStepsList().length > 0) {
        task.steps = pbTask.getStepsList().map(step => this.stepFromProtobuf(step));
      }
      
      return task;
    } catch (error) {
      console.error('Error converting protobuf to task:', error);`);
            throw new Error(`Failed to convert protobuf to task: ${error}`);
        }
    }
    /**
     * Convert internal AgentStep to Protocol Buffer Step
     */
    stepToProtobuf(step) {
        const pbStep = new this.Step();
        pbStep.setId(step.id);
        pbStep.setTaskId(step.taskId);
        pbStep.setTitle(step.title);
        pbStep.setDescription(step.description);
        pbStep.setStatus(this.statusToProtobuf(step.status));
        if (step.parameters) {
            const struct = this.objectToStruct(step.parameters);
            pbStep.setParameters(struct);
        }
        if (step.result) {
            pbStep.setResult(step.result);
        }
        if (step.createdAt) {
            const timestamp = new timestamp_pb_1.Timestamp();
            timestamp.fromDate(step.createdAt);
            pbStep.setCreatedAt(timestamp);
        }
        if (step.updatedAt) {
            const timestamp = new timestamp_pb_1.Timestamp();
            timestamp.fromDate(step.updatedAt);
            pbStep.setUpdatedAt(timestamp);
        }
        return pbStep;
    }
    /**
     * Convert Protocol Buffer Step to internal AgentStep
     */
    stepFromProtobuf(pbStep) {
        const step = {
            id: pbStep.getId(),
            taskId: pbStep.getTaskId(),
            title: pbStep.getTitle(),
            description: pbStep.getDescription(),
            status: this.statusFromProtobuf(pbStep.getStatus()),
        };
        if (pbStep.getParameters()) {
            step.parameters = this.structToObject(pbStep.getParameters());
        }
        if (pbStep.getResult()) {
            step.result = pbStep.getResult();
        }
        if (pbStep.getCreatedAt()) {
            step.createdAt = pbStep.getCreatedAt().toDate();
        }
        if (pbStep.getUpdatedAt()) {
            step.updatedAt = pbStep.getUpdatedAt().toDate();
        }
        return step;
    }
    /**
     * Convert StructuredPrompt to Protocol Buffer UserPrompt
     */
    promptToProtobuf(prompt) {
        const pbPrompt = new this.UserPrompt();
        pbPrompt.setId(prompt.id);
        pbPrompt.setUserId(prompt.userId);
        pbPrompt.setText(prompt.text);
        if (prompt.context) {
            const contextStruct = this.objectToStruct({
                ...prompt.context,
                targetAgent: prompt.targetAgent,
                workspace: prompt.workspace,
                files: prompt.files || [],
            });
            pbPrompt.setContext(contextStruct);
        }
        return pbPrompt;
    }
    /**
     * Convert Protocol Buffer UserPrompt to StructuredPrompt
     */
    promptFromProtobuf(pbPrompt) {
        const prompt = {
            id: pbPrompt.getId(),
            userId: pbPrompt.getUserId(),
            text: pbPrompt.getText(),
        };
        if (pbPrompt.getContext()) {
            const context = this.structToObject(pbPrompt.getContext());
            prompt.context = context;
            // Extract special context fields
            if (context.targetAgent)
                prompt.targetAgent = context.targetAgent;
            if (context.workspace)
                prompt.workspace = context.workspace;
            if (context.files)
                prompt.files = context.files;
        }
        return prompt;
    }
    /**
     * Create RPC request message
     */
    createRpcRequest(id, method, parameters) {
        const request = new this.RpcRequest();
        request.setId(id);
        request.setMethod(method);
        if (parameters) {
            const struct = this.objectToStruct(parameters);
            request.setParameters(struct);
        }
        return request;
    }
    /**
     * Create MCP message for Model Context Protocol communication
     */
    createMcpMessage(id, role, content, metadata) {
        const message = new this.McpMessage();
        message.setId(id);
        message.setRole(role);
        message.setContent(content);
        if (metadata) {
            const struct = this.objectToStruct(metadata);
            message.setMetadata(struct);
        }
        return message;
    }
    /**
     * Helper: Convert status enum to protobuf
     */
    statusToProtobuf(status) {
        switch (status) {
            case 'pending': return this.Status.PENDING;
            case 'in_progress': return this.Status.IN_PROGRESS;
            case 'completed': return this.Status.COMPLETED;
            case 'failed': return this.Status.FAILED;
            case 'cancelled': return this.Status.CANCELLED;
            default:
                console.warn(Unknown, status, value, encountered, '${status}', defaulting, to, 'pending');
                if (process.env.NODE_ENV === 'development') {
                    `
          throw new Error(Invalid status value: '${status}`;
                    '. Expected one of: pending, in_progress, completed, failed, cancelled);;
                }
                return this.Status.PENDING;
        }
    }
    /**
     * Helper: Convert protobuf status to string
     */
    statusFromProtobuf(status) {
        switch (status) {
            case this.Status.PENDING: return 'pending';
            case this.Status.IN_PROGRESS: return 'in_progress';
            case this.Status.COMPLETED: return 'completed';
            case this.Status.FAILED: return 'failed';
            case this.Status.CANCELLED: return 'cancelled';
            default:
                console.warn(Unknown, protobuf, status, value, encountered, $, { status }, defaulting, to, 'pending');
                `
        if (process.env.NODE_ENV === 'development') {
          throw new Error(Invalid protobuf status value: ${status}`.Expected;
                one;
                of: PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED `);
        }
        return 'pending';
    }
  }

  /**
   * Helper: Convert object to protobuf Struct
   */
  private objectToStruct(obj: Record<string, any>): Struct {
    const struct = new Struct();
    for (const [key, value] of Object.entries(obj)) {
      struct.getFieldsMap().set(key, this.valueToProtobuf(value));
    }
    return struct;
  }

  /**
   * Helper: Convert protobuf Struct to object
   */
  private structToObject(struct: Struct): Record<string, any> {
    const obj: Record<string, any> = {};
    struct.getFieldsMap().forEach((value, key) => {
      obj[key] = this.valueFromProtobuf(value);
    });
    return obj;
  }

  /**
   * Helper: Convert JS value to protobuf Value
   */
  private valueToProtobuf(value: any): Value {
    const pbValue = new Value();
    
    if (value === null || value === undefined) {
      pbValue.setNullValue(NullValue.NULL_VALUE);
    } else if (typeof value === 'boolean') {
      pbValue.setBoolValue(value);
    } else if (typeof value === 'number') {
      pbValue.setNumberValue(value);
    } else if (typeof value === 'string') {
      pbValue.setStringValue(value);
    } else if (Array.isArray(value)) {
      const listValue = new ListValue();
      value.forEach(item => {
        listValue.addValues(this.valueToProtobuf(item));
      });
      pbValue.setListValue(listValue);
    } else if (typeof value === 'object') {
      pbValue.setStructValue(this.objectToStruct(value));
    } else {
      pbValue.setStringValue(String(value));
    }
    
    return pbValue;
  }

  /**
   * Helper: Convert protobuf Value to JS value
   */
  private valueFromProtobuf(pbValue: Value): any {
    switch (pbValue.getKindCase()) {
      case Value.KindCase.NULL_VALUE:
        return null;
      case Value.KindCase.BOOL_VALUE:
        return pbValue.getBoolValue();
      case Value.KindCase.NUMBER_VALUE:
        return pbValue.getNumberValue();
      case Value.KindCase.STRING_VALUE:
        return pbValue.getStringValue();
      case Value.KindCase.LIST_VALUE:
        return pbValue.getListValue()!.getValuesList().map(v => this.valueFromProtobuf(v));
      case Value.KindCase.STRUCT_VALUE:
        return this.structToObject(pbValue.getStructValue()!);
      default:
        return null;
    }
  }
};
        }
    }
}
exports.ProtobufAdapter = ProtobufAdapter;
//# sourceMappingURL=ProtobufAdapter.js.map