# Verification Agent Documentation

## Overview

The Verification Agent is a component of The New Fuse that verifies claims using LLM-based fact-checking or simulated verification. It provides commands for initializing verification agents, verifying claims, and changing verification levels.

The system consists of two main parts:

1. **Backend Implementation**: VS Code extension commands that handle verification logic
2. **Frontend Component**: React component for the workflow UI that interacts with the backend

## Features

- **LLM-based Verification**: Uses language models to verify claims in production mode
- **Simulated Verification**: Provides realistic simulated verification in development mode
- **Caching**: Caches verification results to improve performance (24-hour expiration by default)
- **Event-based Communication**: Emits events for other components to listen to
- **Multiple Verification Levels**: Supports STRICT, STANDARD, and PERMISSIVE verification levels
- **Source Credibility Assessment**: Evaluates sources based on type and reliability
- **Confidence Scoring**: Provides confidence scores for verification results
- **Fallback Mechanisms**: Gracefully falls back to simulation if LLM verification fails

## Commands

### Initialize Verification Agent

```typescript
vscode.commands.executeCommand('thefuse.verification.initialize', {
  id: string;                      // Required: Unique ID for the agent
  name: string;                    // Required: Display name for the agent
  verificationLevel?: VerificationLevel; // Optional: STRICT, STANDARD, or PERMISSIVE
  trustedSources?: string[];       // Optional: List of trusted source URLs
  minConfidenceThreshold?: number; // Optional: Minimum confidence threshold (0.0-1.0)
  maxResponseTime?: number;        // Optional: Maximum response time in seconds
  supportedProtocols?: string[];   // Optional: List of supported protocols
  capabilities?: string[];         // Optional: List of agent capabilities
});
```

Returns:

```typescript
{
  success: boolean;
  message: string;
  claims: Claim[]; // Empty array for new agents
}
```

### Verify Claim

```typescript
vscode.commands.executeCommand('thefuse.verification.verifyClaim', {
  agentId: string; // Required: ID of the verification agent
  claim: {         // Required: Claim to verify
    id: string;
    text: string;
    source?: string;
    metadata?: any;
    verificationStatus: 'verified' | 'refuted' | 'unverified' | 'insufficient_data';
    confidenceScore: number;
  }
});
```

Returns:

```typescript
{
  success: boolean;
  verifiedClaim: {
    id: string;
    text: string;
    source?: string;
    metadata?: any;
    verificationStatus: 'verified' | 'refuted' | 'unverified' | 'insufficient_data';
    confidenceScore: number;
    verificationSources: VerificationSource[];
    verifiedAt: string; // ISO date string
  }
}
```

### Set Verification Level

```typescript
vscode.commands.executeCommand('thefuse.verification.setLevel', {
  agentId: string;                 // Required: ID of the verification agent
  level: VerificationLevel;        // Required: STRICT, STANDARD, or PERMISSIVE
});
```

Returns:

```typescript
{
  success: boolean;
  message: string;
}
```

## Verification Levels

The verification agent supports three levels of verification strictness:

- **STRICT**: Requires multiple credible sources to verify a claim
  - Verification threshold: 0.7 (70%)
  - Typically requires 2-4 credible sources
  - Higher confidence scores required for verification
  - Best for critical information where accuracy is paramount

- **STANDARD**: Requires at least one credible source to verify a claim
  - Verification threshold: 0.5 (50%)
  - Typically requires 1-2 credible sources
  - Balanced approach for most verification needs
  - Default verification level

- **PERMISSIVE**: Accepts claims with minimal verification
  - Verification threshold: 0.3 (30%)
  - May accept claims with limited source verification
  - Lower confidence threshold
  - Suitable for non-critical information or exploratory research

## Events

The verification agent uses an event-based architecture to communicate with other components. This enables loose coupling and allows components to react to verification activities without direct dependencies.

### Event Types

The verification agent emits the following events:

- **AGENT_INITIALIZED**: Emitted when a verification agent is initialized
  - Contains agent ID, name, and initial verification level
  - Useful for tracking agent creation and configuration

- **CLAIM_VERIFIED**: Emitted when a claim is verified
  - Contains the verified claim with all verification details
  - Includes source information and confidence scores
  - Indicates whether the result came from cache

- **VERIFICATION_LEVEL_CHANGED**: Emitted when the verification level is changed
  - Contains the agent ID, old level, and new level
  - Useful for tracking verification policy changes

- **VERIFICATION_ERROR**: Emitted when an error occurs during verification
  - Contains error details and the operation that failed
  - Includes agent ID and claim ID (if applicable)
  - Useful for error tracking and debugging

## Listening to Events

```typescript
// Get the verification manager
const verificationManager = getVerificationManager();

// Add event listener
const disposable = verificationManager.addEventListener(
  VerificationEventType.CLAIM_VERIFIED,
  (event) => {
    console.log(`Claim verified: ${event.data.claim.id}`);
  }
);

// Remove event listener when done
disposable.dispose();
```

## Caching

The verification agent implements a caching system to improve performance and reduce redundant verification operations.

### Cache Features

- **Duration**: Verification results are cached for 24 hours by default
- **Storage**: Cache is stored in the extension's global storage directory
- **Persistence**: Cache is saved to disk and loaded when the extension is activated
- **Key Generation**: Cache keys are generated using MD5 hashes of claim text and verification level
- **Expiration**: Expired cache entries are automatically filtered out during loading
- **Automatic Saving**: Cache is automatically saved after each verification

### Cache Benefits

- **Performance**: Significantly reduces response time for previously verified claims
- **Consistency**: Ensures consistent verification results for the same claim
- **Resource Efficiency**: Reduces LLM API calls for repeated verifications
- **Offline Operation**: Enables verification using cached results when LLM services are unavailable

## LLM Integration

In production mode, the verification agent uses an LLM service to verify claims. This enables sophisticated fact-checking capabilities with access to the LLM's knowledge base.

### LLM Service Interface

The LLM service must implement the following interface:

```typescript
interface LLMService {
  generateCompletion(params: {
    model: string;
    messages: Array<{role: string, content: string}>;
    temperature?: number;
    max_tokens?: number;
    response_format?: {type: string};
  }): Promise<any>;
}
```

### Verification Process

When using an LLM for verification:

1. The agent constructs a detailed prompt with:
   - The claim text to verify
   - Verification parameters (level, trusted sources, etc.)
   - Detailed instructions for verification
   - Expected response format

2. The prompt is sent to the LLM with:
   - System message defining the LLM's role as a fact-checker
   - Low temperature (0.2) for more factual responses
   - JSON response format for structured output

3. The LLM response is parsed and validated:
   - Verification status is checked against allowed values
   - Confidence score is validated to be between 0 and 1
   - Sources are transformed to match the expected format

4. If any part of the LLM verification fails, the system falls back to simulated verification

## Development Mode

In development mode, the verification agent uses a mock LLM service that simulates verification results. This allows for testing without making actual LLM API calls.

### Mock LLM Service

The mock LLM service (`MockLLMService`) provides a realistic simulation of verification:

- **Smart Claim Analysis**: Analyzes claim text to determine verification status
  - Claims containing "verified" are marked as verified
  - Claims containing "refuted" are marked as refuted
  - Claims containing "insufficient" are marked as insufficient_data
  - Other claims are marked as unverified

- **Realistic Sources**: Generates appropriate mock sources based on verification status
  - Verified claims get multiple high-reliability sources
  - Refuted claims get medium-reliability sources
  - Unverified claims get fewer, lower-reliability sources

- **Simulated Delay**: Adds a realistic processing delay to mimic real LLM calls

- **Consistent Format**: Returns data in the same format as a real LLM service

### Automatic Detection

The verification agent automatically uses the mock LLM service when:

- The VS Code extension is running in development mode
- No production LLM service is provided
- The LLM service fails to respond

## Example Usage

```typescript
// Initialize a verification agent
const initResult = await vscode.commands.executeCommand(
  'thefuse.verification.initialize',
  {
    id: 'agent-1',
    name: 'Fact Checker',
    verificationLevel: 'standard',
    trustedSources: ['example.com', 'trusted-source.org']
  }
);

// Verify a claim
const verifyResult = await vscode.commands.executeCommand(
  'thefuse.verification.verifyClaim',
  {
    agentId: 'agent-1',
    claim: {
      id: 'claim-1',
      text: 'The Earth is round.',
      verificationStatus: 'unverified',
      confidenceScore: 0
    }
  }
);

// Change verification level
const levelResult = await vscode.commands.executeCommand(
  'thefuse.verification.setLevel',
  {
    agentId: 'agent-1',
    level: 'strict'
  }
);
```

## Troubleshooting

### Common Issues

- **Verification Failures**:
  - Check the extension output panel for detailed error messages
  - Look for "ERROR" entries in the AI Verification output channel
  - Verify that the claim has a valid ID and text content
  - Check if the agent ID exists and is correctly referenced

- **Initialization Issues**:
  - Ensure the verification agent is initialized before verifying claims
  - Check that required parameters (id, name) are provided during initialization
  - Verify that the VS Code extension is properly activated

- **LLM Integration Issues**:
  - For LLM-based verification, ensure the LLM service is properly configured
  - Check that the LLM service implements the required interface
  - Verify that the LLM service has appropriate permissions and API keys
  - If LLM verification fails, the system will fall back to simulated verification

- **Performance Issues**:
  - If verification is slow, check if caching is working properly
  - Verify that the cache directory exists and is writable
  - Consider adjusting the cache expiration time for your use case

### Logging

The verification agent provides detailed logging:

- **Output Channel**: Check the "AI Verification" output channel in VS Code
- **Log Levels**: Both regular logs and error logs are available
- **Timestamps**: All logs include timestamps for easier debugging
- **Error Details**: Error logs include detailed error messages and stack traces

### Event Debugging

Use event listeners to debug verification issues:

```typescript
// Listen for verification errors
verificationManager.addEventListener(
  VerificationEventType.VERIFICATION_ERROR,
  (event) => {
    console.log(`Verification error: ${event.data.error}`);
    console.log(`Operation: ${event.data.operation}`);
    console.log(`Agent ID: ${event.agentId}`);
  }
);
```

## Frontend Component

The verification agent includes a React component (`AIVerificationAgent`) that provides a user interface for interacting with the verification system.

### Component Features

- **Interactive UI**: Provides a visual interface for verification operations
- **Real-time Status**: Shows verification status and progress
- **Claim Management**: Displays verified and pending claims
- **Verification Level Control**: Allows changing verification levels
- **Filtering**: Supports filtering claims by verification status
- **Auto-verification**: Automatically verifies pending claims when enabled

### Component Integration

The component integrates with the backend through VS Code extension commands:

```typescript
// Initialize the verification agent
const result = await window.vscode?.commands.executeCommand(
  'thefuse.verification.initialize',
  {
    id: data.id,
    name: data.name,
    // ...other parameters
  }
);

// Verify a claim
const result = await window.vscode?.commands.executeCommand(
  'thefuse.verification.verifyClaim',
  {
    agentId: data.id,
    claim: claim,
    // ...other parameters
  }
);

// Change verification level
const result = await window.vscode?.commands.executeCommand(
  'thefuse.verification.setLevel',
  {
    agentId: data.id,
    level: level
  }
);
```

### Component Usage

The component can be used in workflow diagrams as a node:

```tsx
import AIVerificationAgent from 'src/components/nodes/AIVerificationAgent';
import { defaultAIVerificationAgentData } from 'src/components/nodes/AIVerificationAgent';

// In your workflow component
const nodeTypes = {
  verificationAgent: AIVerificationAgent,
  // ...other node types
};

// Create a verification agent node
const verificationNode = {
  id: 'verification-1',
  type: 'verificationAgent',
  position: { x: 250, y: 250 },
  data: defaultAIVerificationAgentData
};
```
