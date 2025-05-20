# The New Fuse - Security Features

This document provides comprehensive documentation for the security features in The New Fuse VSCode extension.

## Table of Contents

1. [Overview](#overview)
2. [Agent Verification](#agent-verification)
3. [Message Security](#message-security)
4. [Permission System](#permission-system)
5. [Best Practices](#best-practices)
6. [Implementation Examples](#implementation-examples)

## Overview

The New Fuse includes several security features to ensure secure agent communication and interaction:

- **Agent Verification**: Ensures that only verified agents can interact with the system
- **Message Security**: Provides message signing, validation, and encryption
- **Permission System**: Controls agent access to resources

These features work together to create a secure environment for agent collaboration.

## Agent Verification

The Agent Verification system ensures that only verified agents can interact with the system.

### Key Features

- **Token-based Verification**: Agents are verified using secure tokens
- **Expiration**: Verification can expire after a configurable period
- **Revocation**: Verification can be revoked at any time
- **Status Tracking**: Agent verification status is tracked and can be queried

### Verification Process

1. **Token Generation**: A verification token is generated for an agent
2. **Token Distribution**: The token is securely distributed to the agent
3. **Verification**: The agent presents the token to verify its identity
4. **Status Check**: The agent's verification status can be checked at any time

### API Reference

#### `AgentVerificationManager`

```typescript
class AgentVerificationManager {
    /**
     * Constructor
     * @param context VS Code extension context
     */
    constructor(context: vscode.ExtensionContext);

    /**
     * Generate a verification token for an agent
     * @param agentId Agent ID
     * @returns Verification token
     */
    generateVerificationToken(agentId: string): string;

    /**
     * Verify an agent using a token
     * @param agentId Agent ID
     * @param token Verification token
     * @returns Verification result
     */
    verifyAgent(agentId: string, token: string): VerificationResult;

    /**
     * Check if an agent is verified
     * @param agentId Agent ID
     * @returns Verification status
     */
    isAgentVerified(agentId: string): VerificationStatus;

    /**
     * Revoke agent verification
     * @param agentId Agent ID
     * @returns True if revoked
     */
    revokeVerification(agentId: string): boolean;

    /**
     * Sign a message
     * @param message Message to sign
     * @returns Signature
     */
    signMessage(message: string): string;

    /**
     * Verify a message signature
     * @param message Original message
     * @param signature Message signature
     * @returns True if signature is valid
     */
    verifySignature(message: string, signature: string): boolean;

    /**
     * Get all verified agents
     * @returns Map of agent IDs to verification results
     */
    getVerifiedAgents(): Map<string, VerificationResult>;
}
```

#### `VerificationResult`

```typescript
interface VerificationResult {
    status: VerificationStatus;
    agentId: string;
    timestamp: number;
    expiresAt?: number;
    message?: string;
    verificationToken?: string;
}
```

#### `VerificationStatus`

```typescript
type VerificationStatus = 'verified' | 'unverified' | 'rejected';
```

## Message Security

The Message Security system provides message signing, validation, and encryption.

### Key Features

- **Message Signing**: Messages can be signed to ensure authenticity
- **Signature Verification**: Message signatures can be verified
- **Payload Encryption**: Message payloads can be encrypted for confidentiality
- **Payload Decryption**: Encrypted payloads can be decrypted
- **Configurable Options**: Security options can be configured

### Security Process

1. **Outgoing Messages**: Messages are signed and/or encrypted before sending
2. **Incoming Messages**: Messages are verified and/or decrypted upon receipt
3. **Validation**: Messages are validated based on signature and agent verification
4. **Processing**: Valid messages are processed, invalid messages are rejected

### API Reference

#### `MessageSecurityManager`

```typescript
class MessageSecurityManager {
    /**
     * Constructor
     * @param verificationManager Agent verification manager
     * @param options Security options
     */
    constructor(
        verificationManager: AgentVerificationManager,
        options?: Partial<MessageSecurityOptions>
    );

    /**
     * Sign a message
     * @param message Message to sign
     * @returns Signed message
     */
    signMessage(message: any): any;

    /**
     * Verify a message signature
     * @param message Message to verify
     * @returns True if signature is valid
     */
    verifyMessageSignature(message: any): boolean;

    /**
     * Encrypt a message payload
     * @param payload Message payload
     * @returns Encrypted payload
     */
    encryptPayload(payload: any): string;

    /**
     * Decrypt a message payload
     * @param encryptedPayload Encrypted payload
     * @returns Decrypted payload
     */
    decryptPayload(encryptedPayload: any): any;

    /**
     * Secure an outgoing message
     * @param message Message to secure
     * @returns Secured message
     */
    secureOutgoingMessage(message: any): any;

    /**
     * Process an incoming message
     * @param message Incoming message
     * @returns Processed message and validation result
     */
    processIncomingMessage(message: any): {
        message: any;
        isValid: boolean;
        isVerified: boolean;
    };

    /**
     * Update security options
     * @param options New security options
     */
    updateOptions(options: Partial<MessageSecurityOptions>): void;

    /**
     * Get current security options
     * @returns Current security options
     */
    getOptions(): MessageSecurityOptions;
}
```

#### `MessageSecurityOptions`

```typescript
interface MessageSecurityOptions {
    /**
     * Whether to sign outgoing messages
     */
    signMessages: boolean;
    
    /**
     * Whether to verify signatures on incoming messages
     */
    verifySignatures: boolean;
    
    /**
     * Whether to encrypt message payloads
     */
    encryptPayloads: boolean;
    
    /**
     * Whether to require verification for all agents
     */
    requireVerification: boolean;
}
```

## Permission System

The Permission System controls agent access to resources.

### Key Features

- **Resource-based Permissions**: Permissions are defined for specific resource types
- **Permission Levels**: Different levels of access can be granted (none, read, write, admin)
- **Default Permissions**: Default permissions can be defined for resource types
- **Temporary Permissions**: Permissions can be granted temporarily
- **Permission Checking**: Permissions can be checked before allowing access

### Permission Levels

- **None**: No access to the resource
- **Read**: Read-only access to the resource
- **Write**: Read and write access to the resource
- **Admin**: Full access to the resource, including management operations

### Resource Types

- **File**: Files in the workspace
- **Workspace**: The workspace itself
- **Command**: VS Code commands
- **Agent**: Other agents
- **Task**: Tasks in the task coordination system
- **Workflow**: Workflows in the workflow system

### API Reference

#### `PermissionSystem`

```typescript
class PermissionSystem {
    /**
     * Constructor
     * @param context VS Code extension context
     */
    constructor(context: vscode.ExtensionContext);

    /**
     * Add a permission rule
     * @param rule Permission rule to add
     * @returns Added rule
     */
    addRule(rule: Omit<PermissionRule, 'id' | 'createdAt' | 'createdBy'>): PermissionRule;

    /**
     * Remove a permission rule
     * @param ruleId Rule ID to remove
     * @returns True if removed
     */
    removeRule(ruleId: string): boolean;

    /**
     * Update a permission rule
     * @param ruleId Rule ID to update
     * @param updates Updates to apply
     * @returns Updated rule or undefined if not found
     */
    updateRule(
        ruleId: string,
        updates: Partial<Pick<PermissionRule, 'level' | 'expiresAt'>>
    ): PermissionRule | undefined;

    /**
     * Get all permission rules
     * @returns All permission rules
     */
    getAllRules(): PermissionRule[];

    /**
     * Get rules for an agent
     * @param agentId Agent ID
     * @returns Rules for the agent
     */
    getRulesForAgent(agentId: string): PermissionRule[];

    /**
     * Get rules for a resource
     * @param resourceType Resource type
     * @param resourceId Resource ID (optional)
     * @returns Rules for the resource
     */
    getRulesForResource(resourceType: ResourceType, resourceId?: string): PermissionRule[];

    /**
     * Check if an agent has permission for a resource
     * @param agentId Agent ID
     * @param resourceType Resource type
     * @param resourceId Resource ID (optional)
     * @param requiredLevel Required permission level
     * @returns Permission check result
     */
    checkPermission(
        agentId: string,
        resourceType: ResourceType,
        resourceId: string | undefined,
        requiredLevel: PermissionLevel
    ): PermissionCheckResult;

    /**
     * Set default permission level for a resource type
     * @param resourceType Resource type
     * @param level Permission level
     */
    setDefaultPermission(resourceType: ResourceType, level: PermissionLevel): void;

    /**
     * Get default permission level for a resource type
     * @param resourceType Resource type
     * @returns Default permission level
     */
    getDefaultPermission(resourceType: ResourceType): PermissionLevel;

    /**
     * Grant temporary permission
     * @param agentId Agent ID
     * @param resourceType Resource type
     * @param resourceId Resource ID (optional)
     * @param level Permission level
     * @param duration Duration in milliseconds
     * @returns Added rule
     */
    grantTemporaryPermission(
        agentId: string,
        resourceType: ResourceType,
        resourceId: string | undefined,
        level: PermissionLevel,
        duration: number
    ): PermissionRule;
}
```

#### `PermissionRule`

```typescript
interface PermissionRule {
    id: string;
    agentId: string;
    resourceType: ResourceType;
    resourceId?: string; // Optional specific resource ID
    level: PermissionLevel;
    expiresAt?: number; // Optional expiration timestamp
    createdAt: number;
    createdBy: string;
}
```

#### `PermissionLevel`

```typescript
type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
```

#### `ResourceType`

```typescript
type ResourceType = 'file' | 'workspace' | 'command' | 'agent' | 'task' | 'workflow';
```

#### `PermissionCheckResult`

```typescript
interface PermissionCheckResult {
    granted: boolean;
    rule?: PermissionRule;
    message?: string;
}
```

## Best Practices

### Agent Verification

1. **Verify All Agents**: Always verify agents before allowing them to interact with the system
2. **Secure Token Distribution**: Distribute verification tokens securely
3. **Limited Token Validity**: Use short-lived tokens for verification
4. **Regular Reverification**: Require agents to reverify periodically
5. **Revoke Unused Verifications**: Revoke verification for inactive agents

### Message Security

1. **Sign All Messages**: Sign all messages to ensure authenticity
2. **Verify All Signatures**: Verify signatures on all incoming messages
3. **Encrypt Sensitive Data**: Encrypt sensitive data in message payloads
4. **Use Strong Encryption**: Use strong encryption algorithms for payload encryption
5. **Rotate Keys**: Rotate encryption keys periodically

### Permission System

1. **Least Privilege**: Grant the minimum permissions necessary
2. **Specific Resources**: Use specific resource IDs instead of wildcards when possible
3. **Temporary Permissions**: Use temporary permissions for one-time operations
4. **Regular Audits**: Regularly audit permission rules
5. **Default Deny**: Set default permissions to 'none' or 'read' for sensitive resource types

## Implementation Examples

### Example 1: Secure Agent Registration

This example demonstrates how to securely register and verify an agent:

```typescript
// Initialize verification manager
const verificationManager = new AgentVerificationManager(context);

// When a new agent connects
function handleNewAgentConnection(agentId: string, agentName: string) {
    // Generate a verification token
    const token = verificationManager.generateVerificationToken(agentId);
    
    // Send the token to the agent securely
    // This could be through a secure channel or during initial handshake
    sendTokenToAgent(agentId, token);
    
    // Instruct the agent to verify itself
    sendVerificationRequest(agentId);
}

// When an agent attempts to verify itself
function handleVerificationAttempt(agentId: string, token: string) {
    // Verify the agent
    const result = verificationManager.verifyAgent(agentId, token);
    
    if (result.status === 'verified') {
        // Allow the agent to interact with the system
        console.log(`Agent ${agentId} verified successfully`);
    } else {
        // Reject the agent
        console.log(`Agent ${agentId} verification failed: ${result.message}`);
    }
}

// Check verification status before processing messages
function handleAgentMessage(agentId: string, message: any) {
    const status = verificationManager.isAgentVerified(agentId);
    
    if (status !== 'verified') {
        console.log(`Rejecting message from unverified agent ${agentId}`);
        return;
    }
    
    // Process the message
    processMessage(message);
}
```

### Example 2: Secure Message Exchange

This example demonstrates how to securely exchange messages between agents:

```typescript
// Initialize message security
const messageSecurity = new MessageSecurityManager(verificationManager, {
    signMessages: true,
    verifySignatures: true,
    encryptPayloads: true,
    requireVerification: true
});

// Send a secure message
function sendSecureMessage(recipient: string, action: string, payload: any) {
    // Create the message
    const message = {
        id: generateMessageId(),
        sender: 'thefuse',
        recipient,
        action,
        payload,
        timestamp: Date.now()
    };
    
    // Secure the message
    const securedMessage = messageSecurity.secureOutgoingMessage(message);
    
    // Send the message
    sendMessage(recipient, securedMessage);
}

// Receive and process a secure message
function receiveSecureMessage(message: any) {
    // Process the message
    const { message: processedMessage, isValid, isVerified } = 
        messageSecurity.processIncomingMessage(message);
    
    if (!isValid) {
        console.log('Rejecting invalid message');
        return;
    }
    
    if (!isVerified && messageSecurity.getOptions().requireVerification) {
        console.log('Rejecting message from unverified sender');
        return;
    }
    
    // Process the message
    handleMessage(processedMessage);
}
```

### Example 3: Permission-based Access Control

This example demonstrates how to use the permission system for access control:

```typescript
// Initialize permission system
const permissionSystem = new PermissionSystem(context);

// Set default permissions
permissionSystem.setDefaultPermission('file', 'read');
permissionSystem.setDefaultPermission('workspace', 'read');
permissionSystem.setDefaultPermission('command', 'none');
permissionSystem.setDefaultPermission('agent', 'read');
permissionSystem.setDefaultPermission('task', 'read');
permissionSystem.setDefaultPermission('workflow', 'read');

// Grant specific permissions
permissionSystem.addRule({
    agentId: 'agent-1',
    resourceType: 'file',
    resourceId: '/path/to/file.ts',
    level: 'write'
});

permissionSystem.addRule({
    agentId: 'agent-2',
    resourceType: 'task',
    level: 'admin'
});

// Grant temporary permission for a specific operation
permissionSystem.grantTemporaryPermission(
    'agent-3',
    'command',
    'workbench.action.files.save',
    'write',
    60 * 1000 // 1 minute
);

// Check permission before allowing access
function handleFileAccess(agentId: string, filePath: string, accessType: 'read' | 'write') {
    const { granted, message } = permissionSystem.checkPermission(
        agentId,
        'file',
        filePath,
        accessType
    );
    
    if (!granted) {
        console.log(`Access denied: ${message}`);
        return false;
    }
    
    // Allow access
    console.log(`Access granted: ${message}`);
    return true;
}

// Check permission before executing a command
function handleCommandExecution(agentId: string, command: string) {
    const { granted, message } = permissionSystem.checkPermission(
        agentId,
        'command',
        command,
        'write'
    );
    
    if (!granted) {
        console.log(`Command execution denied: ${message}`);
        return false;
    }
    
    // Execute the command
    console.log(`Command execution granted: ${message}`);
    vscode.commands.executeCommand(command);
    return true;
}
```

These examples demonstrate how to use the security features in The New Fuse to create a secure environment for agent collaboration.
