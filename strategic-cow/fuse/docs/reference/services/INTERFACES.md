# Service Interfaces Documentation

## Service Registry Interface
### Methods
- `registerService(serviceName: string, metadata: ServiceMetadata): Promise<void>`
  - Registers a new service in the system
  - Parameters:
    - serviceName: Unique identifier for the service
    - metadata: Service capabilities and requirements

- `discoverService(type: string, capabilities: string[]): Promise<ServiceInfo>`
  - Discovers services matching specified criteria
  - Returns: Service information including connection details

## Workflow Orchestrator Interface
### Methods
- `orchestrateWorkflow(workflowId: string, context: any): Promise<WorkflowResult>`
  - Executes a multi-service workflow
  - Handles service coordination and error recovery

## Protocol Translation Interface
### Methods
- `translateMessage(message: any, source: string, target: string): Promise<any>`
  - Converts messages between different protocols
  - Validates message format and content