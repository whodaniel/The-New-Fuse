"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8NBridgeImplementation = void 0;
const axios_1 = __importDefault(require("axios"));
// Simple in-memory store for N8N workflows
const n8nWorkflowStore = new Map();
class N8NBridgeImplementation {
    config;
    n8nApiUrl;
    constructor(config) {
        this.config = config;
        this.n8nApiUrl = `${this.config.instanceUrl}/api/v1;
  }

  async executeWorkflow(workflowId: string, inputData?: Record<string, any>): Promise<N8NExecution> {`;
        console.log(`Executing N8N workflow ${workflowId}`);
        with (data)
            : , inputData;
        ;
        try {
            const response = await axios_1.default.post($, { this: .n8nApiUrl } / workflows / $, { workflowId } / executions, inputData, {
                headers: {
                    'X-N8N-API-KEY': this.config.apiKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            `
      console.error(Error executing N8N workflow ${workflowId}`;
            error;
            ;
            throw error;
        }
    }
    async registerWebhook(workflowId, path) {
        console.log(Registering, webhook);
        for (N8N; workflow; $) {
            workflowId;
        }
        at;
        path: $;
        {
            path;
        }
        `);

    const webhookUrl = ${this.config.webhookBaseUrl}/${path};

    try {
      // This is a simulated registration. A real implementation would
      // likely involve updating the N8N workflow to add a webhook trigger node.
      // For now, we'll just store the webhook URL.
      const workflow = n8nWorkflowStore.get(workflowId);
      if (workflow) {
        // In a real implementation, you would update the workflow definition
        // to include the webhook trigger and then update the workflow in N8N.`;
        console.log(Simulating, webhook, registration);
        for (workflow; $; { workflowId } ` with URL ${webhookUrl});`)
            ;
    }
}
exports.N8NBridgeImplementation = N8NBridgeImplementation;
{
    `
        console.warn(Workflow ${workflowId} not found in store. Cannot register webhook.);
      }

      return webhookUrl;
    } catch (error) {`;
    console.error(`Error registering webhook for N8N workflow ${workflowId}:, error);
      throw error;
    }
  }
`, async, handleWebhook(path, string, payload, (Record)), Promise < void  > {} `
    console.log(Handling N8N webhook at path ${path}`);
    with (payload)
        : `, payload);
    // In a real implementation, this method would be called by an external
    // HTTP server that listens for incoming webhooks.
    // It would then need to find the corresponding workflow and trigger it.
    console.log('Webhook received, but no action is taken in this simulation.');
    return;
  }
}
        ;
}
//# sourceMappingURL=N8NBridge.js.map