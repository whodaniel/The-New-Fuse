# Contract Testing Framework

This framework provides tools for implementing contract tests for The New Fuse platform's APIs. It ensures that API requests and responses conform to their TypeScript interfaces at runtime and during testing.

## Core Components

### SchemaValidator
Validates objects against TypeScript interfaces using class-validator and class-transformer.
- `validateSchema`: Validates single objects
- `validateNested`: Validates nested objects and arrays

### ContractEnforcer
Manages API contracts and provides runtime validation.
- `registerContract`: Register new API contracts
- `validateRequest`: Validate incoming requests
- `validateResponse`: Validate outgoing responses
- `createMockEndpoint`: Create mock endpoints for testing
- `generateContractTests`: Generate test boilerplate

### TestUtils
Utilities for generating test data and mocks.
- `generateMockData`: Create mock data based on TypeScript types
- `generateMockArray`: Generate arrays of mock data
- `createMockApiResponse`: Create API response objects

## Usage

### 1. Define API Contracts

```typescript
const createAgentContract: ContractDefinition<Agent> = {
  method: 'POST',
  path: '/api/agents',
  requestSchema: CreateAgentDto,
  responseSchema: Agent,
  protocol: ProtocolType.REST,
  security: SecurityScheme.JWT
};
```

### 2. Register and Use Contracts

```typescript
const enforcer = new ContractEnforcer();
enforcer.registerContract('createAgent', createAgentContract);

// Validate requests
const result = await enforcer.validateRequest('createAgent', requestData);

// Validate responses
const responseResult = await enforcer.validateResponse('createAgent', responseData);
```

### 3. Write Contract Tests

```typescript
describe('API Contract Tests', () => {
  it('should validate request schema', async () => {
    const validRequest = {
      name: 'Test Agent',
      type: AgentType.BASE
    };
    
    const result = await enforcer.validateRequest('createAgent', validRequest);
    expect(result.isValid).toBe(true);
  });
});
```

## Best Practices

1. **Define Clear Interfaces**: Use TypeScript interfaces to define your API contracts clearly.
2. **Validate Both Ways**: Always validate both requests and responses.
3. **Use Mock Data**: Utilize TestUtils to generate realistic test data.
4. **Test Edge Cases**: Include tests for invalid data and edge cases.
5. **Maintain Documentation**: Keep contract documentation up-to-date with changes.

## Integration with CI/CD

Add contract tests to your CI/CD pipeline:

```yaml
test:
  script:
    - npm install
    - npm run test:contracts
```

## Example Implementation

See `examples/agentApi.test.ts` for a complete example of contract testing implementation.