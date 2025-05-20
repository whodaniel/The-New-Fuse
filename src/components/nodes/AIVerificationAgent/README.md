# AI Verification Agent Component

## Overview

The AI Verification Agent is a specialized workflow node component that verifies claims using LLM-based fact-checking or simulated verification. It provides a user interface for interacting with the verification system and integrates with the VS Code extension backend.

## Features

- **Claim Verification**: Verifies claims using LLM-based fact-checking or simulation
- **Multiple Verification Levels**: Supports STRICT, STANDARD, and PERMISSIVE verification
- **Interactive UI**: Provides a visual interface for verification operations
- **Real-time Status**: Shows verification status and progress
- **Claim Management**: Displays verified and pending claims
- **Verification Level Control**: Allows changing verification levels
- **Filtering**: Supports filtering claims by verification status
- **Auto-verification**: Automatically verifies pending claims when enabled

## Component Structure

The component consists of:

- **Main Component**: `AIVerificationAgent` React component
- **Data Interface**: `AIVerificationAgentNodeData` TypeScript interface
- **Default Data**: `defaultAIVerificationAgentData` for initialization
- **Supporting Types**: Enums and interfaces for verification data

## Usage

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

## Backend Integration

The component integrates with the VS Code extension backend through commands:

- `thefuse.verification.initialize`: Initializes a verification agent
- `thefuse.verification.verifyClaim`: Verifies a claim
- `thefuse.verification.setLevel`: Changes the verification level

## Verification Levels

The component supports three verification levels:

- **STRICT**: Requires multiple credible sources (verification threshold: 0.7)
- **STANDARD**: Requires at least one credible source (verification threshold: 0.5)
- **PERMISSIVE**: Accepts claims with minimal verification (verification threshold: 0.3)

## Claim Management

The component manages two types of claims:

- **Pending Claims**: Claims that have been submitted but not yet verified
- **Verified Claims**: Claims that have been processed with verification results

Claims include:
- Text content
- Verification status
- Confidence score
- Verification sources
- Metadata

## Auto-verification

When auto-verification is enabled, the component automatically processes pending claims:

1. Checks for pending claims every 5 seconds
2. Verifies the oldest pending claim if the agent is idle
3. Updates the UI with verification results
4. Broadcasts verification results to other components

## UI Features

The component provides a rich user interface:

- **Status Indicators**: Shows the agent's current status (idle, busy, error)
- **Progress Bar**: Displays verification progress in real-time
- **Verification Level Controls**: Buttons to change verification strictness
- **Claim List**: Displays verified claims with filtering options
- **Pending Claims**: Shows claims waiting for verification
- **Source Information**: Displays verification sources for verified claims
- **Confidence Scores**: Shows confidence levels for verification results

## Related Documentation

For more detailed information, see:
- [Verification Agent Documentation](../../../vscode-extension/docs/verification-agent.md)
- [Command Reference](../../../../COMMAND-REFERENCE.md)
