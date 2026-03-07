# Wizard System Integration Guide

Complete guide for integrating the Wizard system into The New Fuse application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Integration Steps](#integration-steps)
5. [Available Wizards](#available-wizards)
6. [Creating Custom Wizards](#creating-custom-wizards)
7. [API Reference](#api-reference)
8. [Examples](#examples)

## Overview

The Wizard System provides interactive, step-by-step guidance for users to
accomplish complex tasks. It features:

- **State Management**: Automatic progress tracking and persistence
- **Branching Logic**: Dynamic next steps based on user choices
- **Validation**: Built-in validation for each step
- **Auto-save**: Automatic saving of progress
- **React Integration**: Pre-built React components and hooks
- **Extensibility**: Easy to create custom wizards and steps

## Architecture

```
packages/features/ui/wizard/
├── WizardSystem.ts          # Core state management
├── DefaultWizards.ts        # Pre-built wizards
├── WizardUI.tsx             # React UI components
├── useWizard.ts             # React hooks
├── wizard.css               # Styles
├── steps/                   # Step components
│   ├── WelcomeScreen.tsx
│   ├── ProfileSetup.tsx
│   ├── WorkspaceSetup.tsx
│   ├── AgentConfiguration.tsx
│   ├── AgentCapabilities.tsx
│   ├── AgentTesting.tsx
│   ├── RailwayConnection.tsx
│   ├── DeploymentConfiguration.tsx
│   ├── DeploymentProgress.tsx
│   ├── RoleConfiguration.tsx
│   ├── PermissionMatrix.tsx
│   ├── ProblemIdentification.tsx
│   ├── DiagnosticsRunner.tsx
│   ├── SolutionSteps.tsx
│   └── index.ts
└── index.ts                 # Main exports
```

## Quick Start

### 1. Install Dependencies

The wizard system is already part of the `@the-new-fuse/features` package.

### 2. Initialize Wizard System

```typescript
import { initializeWizardSystem } from '@the-new-fuse/features/ui/wizard';

// In your app initialization (e.g., App.tsx or main.tsx)
const wizardManager = initializeWizardSystem();
```

### 3. Use in a Component

```typescript
import { useWizard, Wizard } from '@the-new-fuse/features/ui/wizard';

function MyComponent() {
  const { wizard, progress, currentStep, next, previous } = useWizard({
    wizardId: 'get-started',
    userId: currentUser.id,
    userRole: currentUser.role,
    stateManager: wizardManager,
  });

  return (
    <Wizard
      wizard={wizard}
      userId={currentUser.id}
      userRole={currentUser.role}
      stateManager={wizardManager}
      onComplete={(progress) => {
        console.log('Wizard completed!', progress);
      }}
    />
  );
}
```

## Integration Steps

### Step 1: Add Wizard Context Provider

Create a React context to make the wizard manager available throughout your app:

```typescript
// src/contexts/WizardContext.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { WizardStateManager, initializeWizardSystem } from '@the-new-fuse/features/ui/wizard';

interface WizardContextType {
  stateManager: WizardStateManager;
}

const WizardContext = createContext<WizardContextType | null>(null);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stateManager = useMemo(() => initializeWizardSystem(), []);

  return (
    <WizardContext.Provider value={{ stateManager }}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizardContext = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizardContext must be used within WizardProvider');
  }
  return context;
};
```

### Step 2: Wrap Your App

```typescript
// src/App.tsx or src/main.tsx
import { WizardProvider } from './contexts/WizardContext';

function App() {
  return (
    <WizardProvider>
      {/* Your app content */}
    </WizardProvider>
  );
}
```

### Step 3: Create a Wizard Page

```typescript
// src/pages/Wizards/WizardPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wizard } from '@the-new-fuse/features/ui/wizard';
import { useWizardContext } from '@/contexts/WizardContext';
import { useAuth } from '@/hooks/useAuth';

export const WizardPage: React.FC = () => {
  const { wizardId } = useParams<{ wizardId: string }>();
  const navigate = useNavigate();
  const { stateManager } = useWizardContext();
  const { user } = useAuth();

  const handleComplete = (progress: WizardProgress) => {
    console.log('Wizard completed!', progress);
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (!wizardId) {
    return <div>Wizard not found</div>;
  }

  const wizard = stateManager.definitions.get(wizardId);
  if (!wizard) {
    return <div>Wizard not found</div>;
  }

  return (
    <div className="wizard-page">
      <Wizard
        wizard={wizard}
        userId={user.id}
        userRole={user.role}
        stateManager={stateManager}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};
```

### Step 4: Add Wizard Discovery Page

```typescript
// src/pages/Wizards/WizardListPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardList } from '@the-new-fuse/features/ui/wizard';
import { useWizardContext } from '@/contexts/WizardContext';
import { useAuth } from '@/hooks/useAuth';

export const WizardListPage: React.FC = () => {
  const navigate = useNavigate();
  const { stateManager } = useWizardContext();
  const { user } = useAuth();

  const handleStartWizard = (wizardId: string) => {
    navigate(`/wizards/${wizardId}`);
  };

  return (
    <div className="wizard-list-page">
      <h1>Getting Started Guides</h1>
      <WizardList
        stateManager={stateManager}
        userId={user.id}
        userRole={user.role}
        skillLevel="beginner"
        onStartWizard={handleStartWizard}
      />
    </div>
  );
};
```

### Step 5: Add Routes

```typescript
// src/routes.tsx
import { WizardPage } from './pages/Wizards/WizardPage';
import { WizardListPage } from './pages/Wizards/WizardListPage';

export const routes = [
  {
    path: '/wizards',
    element: <WizardListPage />,
  },
  {
    path: '/wizards/:wizardId',
    element: <WizardPage />,
  },
  // ... other routes
];
```

### Step 6: Add Wizard Launcher

Add a way to trigger wizards from anywhere in your app:

```typescript
// src/components/WizardLauncher.tsx
import React from 'react';
import { Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardContext } from '@/contexts/WizardContext';
import { useAuth } from '@/hooks/useAuth';

export const WizardLauncher: React.FC = () => {
  const navigate = useNavigate();
  const { stateManager } = useWizardContext();
  const { user } = useAuth();

  const suggestedWizards = stateManager.getSuggestedWizards(
    user.role,
    user.goals || [],
    user.completedWizards || []
  );

  if (suggestedWizards.length === 0) {
    return null;
  }

  return (
    <div className="wizard-launcher">
      <div className="wizard-launcher-header">
        <Wand2 className="w-4 h-4" />
        <span>Suggested Guides</span>
      </div>
      <div className="wizard-launcher-list">
        {suggestedWizards.map((wizard) => (
          <button
            key={wizard.id}
            className="wizard-launcher-item"
            onClick={() => navigate(`/wizards/${wizard.id}`)}
          >
            {wizard.name}
          </button>
        ))}
      </div>
    </div>
  );
};
```

## Available Wizards

### 1. Get Started Wizard (`get-started`)

**Purpose**: First-time user onboarding

**Steps**:

1. Welcome
2. Profile Setup
3. Workspace Creation
4. Create First Agent
5. Test Agent
6. Completion

**Target Audience**: Beginners

**Estimated Time**: 10 minutes

### 2. Create Agent Wizard (`create-agent`)

**Purpose**: Guided agent creation

**Steps**:

1. Define Purpose
2. Select Capabilities
3. Configure LLM
4. Security Settings
5. Test & Deploy

**Target Audience**: All levels

**Estimated Time**: 15 minutes

### 3. Deploy to Railway Wizard (`deploy-railway`)

**Purpose**: Deploy cloud sandbox to Railway

**Steps**:

1. Connect GitHub
2. Configure Service
3. Set Environment Variables
4. Provision Database
5. Deploy
6. Verify Deployment
7. Custom Domain (optional)

**Target Audience**: Intermediate/Advanced

**Estimated Time**: 20 minutes

**Prerequisites**: Railway account, GitHub repository

### 4. Configure RBAC Wizard (`configure-rbac`)

**Purpose**: Set up role-based access control

**Steps**:

1. Understand Roles
2. Assign User Roles
3. Configure Agent Capabilities
4. Set Quotas
5. Enable Audit Logging
6. Test Permissions

**Target Audience**: Intermediate/Advanced

**Estimated Time**: 15 minutes

### 5. Troubleshooting Wizard (`troubleshooting`)

**Purpose**: Diagnose and fix common problems

**Steps**:

1. Identify Issue
2. Category-specific troubleshooting
3. Check Resolution
4. Contact Support (if needed)

**Target Audience**: All levels

**Estimated Time**: 10 minutes

## Creating Custom Wizards

### Using WizardBuilder

```typescript
import {
  WizardBuilder,
  ValidationResult,
  WizardContext,
} from '@the-new-fuse/features/ui/wizard';

export function createMyCustomWizard() {
  return new WizardBuilder('my-wizard', 'My Custom Wizard')
    .description('A custom wizard for my specific use case')
    .category('custom')
    .goal('Accomplish a specific task')
    .targetAudience(['intermediate', 'advanced'])
    .estimatedTime(15)
    .prerequisites(['Some prerequisite'])
    .outcomes(['Outcome 1', 'Outcome 2'])
    .tags(['custom', 'specific-task'])
    .addStep({
      id: 'step-1',
      title: 'First Step',
      description: 'Description of first step',
      component: 'MyCustomStepComponent',
      canSkip: false,
      estimatedTime: 120,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        // Custom validation logic
        const errors: string[] = [];

        if (!context.data.requiredField) {
          errors.push('Required field is missing');
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      },
      onComplete: async (context: WizardContext): Promise<void> => {
        // Custom completion logic
        console.log('Step completed!', context.data);
      },
      helpText: 'This is help text for the step',
      tips: ['Tip 1', 'Tip 2'],
      requirements: ['Requirement 1'],
      nextStep: 'step-2',
    })
    .addStep({
      id: 'step-2',
      title: 'Second Step',
      description: 'Description of second step',
      component: 'AnotherStepComponent',
      canSkip: true,
      previousStep: 'step-1',
      nextStep: (context) => {
        // Dynamic next step based on context
        return context.data.choice === 'option-a' ? 'step-3a' : 'step-3b';
      },
    })
    .build();
}
```

### Creating Custom Step Components

```typescript
// src/components/wizards/MyCustomStepComponent.tsx
import React, { useState } from 'react';
import { WizardContext } from '@the-new-fuse/features/ui/wizard';

export interface MyCustomStepProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

export const MyCustomStepComponent: React.FC<MyCustomStepProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [value, setValue] = useState((context.data.myField as string) || '');

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onDataChange({ myField: newValue });
  };

  return (
    <div className="wizard-step-custom">
      <div className="step-header">
        <h2 className="step-title">My Custom Step</h2>
        <p className="step-description">Enter some information</p>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">My Field</label>
        <input
          className="form-input"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
};
```

### Registering Custom Wizards

```typescript
import { initializeWizardSystem } from '@the-new-fuse/features/ui/wizard';
import { createMyCustomWizard } from './wizards/myCustomWizard';

const stateManager = initializeWizardSystem();

// Register custom wizard
stateManager.registerWizard(createMyCustomWizard());
```

## API Reference

### WizardStateManager

**Methods**:

- `registerWizard(definition: WizardDefinition): void` - Register a new wizard
- `startWizard(wizardId, userId, userRole, initialData?): WizardProgress` -
  Start a wizard session
- `getProgress(userId, wizardId): WizardProgress | null` - Get current progress
- `getCurrentStep(userId, wizardId): WizardStep | null` - Get current step
- `validateCurrentStep(userId, wizardId): Promise<ValidationResult>` - Validate
  current step
- `next(userId, wizardId): Promise<WizardProgress>` - Move to next step
- `previous(userId, wizardId): WizardProgress` - Go to previous step
- `skip(userId, wizardId): Promise<WizardProgress>` - Skip current step
- `updateContext(userId, wizardId, data): void` - Update wizard context data
- `resetWizard(userId, wizardId): void` - Reset wizard progress
- `getAvailableWizards(userRole, skillLevel): WizardDefinition[]` - Get
  available wizards
- `getSuggestedWizards(userRole, userGoals, completedWizards): WizardDefinition[]` -
  Get suggested wizards
- `getUserProgress(userId): WizardProgress[]` - Get all user progress

### useWizard Hook

**Options**:

```typescript
interface UseWizardOptions {
  wizardId: string;
  userId: string;
  userRole: string;
  stateManager: WizardStateManager;
  initialData?: Record<string, unknown>;
  autoSave?: boolean;
  onComplete?: (progress: WizardProgress) => void;
  onError?: (error: Error) => void;
}
```

**Returns**:

```typescript
interface UseWizardReturn {
  wizard: WizardDefinition | null;
  progress: WizardProgress | null;
  currentStep: WizardStep | null;
  next: () => Promise<void>;
  previous: () => void;
  skip: () => Promise<void>;
  updateData: (data: Record<string, unknown>) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canSkip: boolean;
  isComplete: boolean;
  validationErrors: string[];
}
```

## Examples

### Example 1: Embedding a Wizard in Onboarding Flow

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardContext } from '@/contexts/WizardContext';
import { useAuth } from '@/hooks/useAuth';

function OnboardingFlow() {
  const navigate = useNavigate();
  const { stateManager } = useWizardContext();
  const { user } = useAuth();

  useEffect(() => {
    if (!user.hasCompletedOnboarding) {
      navigate('/wizards/get-started');
    }
  }, [user, navigate]);

  return null;
}
```

### Example 2: Showing Wizard Progress in UI

```typescript
import { useWizardContext } from '@/contexts/WizardContext';
import { useAuth } from '@/hooks/useAuth';

function WizardProgressIndicator({ wizardId }: { wizardId: string }) {
  const { stateManager } = useWizardContext();
  const { user } = useAuth();

  const progress = stateManager.getProgress(user.id, wizardId);

  if (!progress) {
    return null;
  }

  return (
    <div className="wizard-progress-indicator">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.completionPercentage}%` }}
        />
      </div>
      <p className="progress-text">
        {progress.completionPercentage}% complete
      </p>
    </div>
  );
}
```

### Example 3: Conditional Wizard Suggestions

```typescript
import { useWizardContext } from '@/contexts/WizardContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function ConditionalWizardSuggestion() {
  const navigate = useNavigate();
  const { stateManager } = useWizardContext();
  const { user } = useAuth();

  // Show deployment wizard if user has created agents but hasn't deployed
  if (user.agentCount > 0 && !user.hasDeployedToRailway) {
    return (
      <div className="wizard-suggestion">
        <p>Ready to deploy your agents to the cloud?</p>
        <button onClick={() => navigate('/wizards/deploy-railway')}>
          Start Deployment Guide
        </button>
      </div>
    );
  }

  // Show RBAC wizard if user has a team
  if (user.teamSize > 1 && !user.hasConfiguredRBAC) {
    return (
      <div className="wizard-suggestion">
        <p>Secure your team's access with role-based permissions</p>
        <button onClick={() => navigate('/wizards/configure-rbac')}>
          Configure RBAC
        </button>
      </div>
    );
  }

  return null;
}
```

## Best Practices

1. **Use wizards for multi-step processes**: Don't create a wizard for
   single-step tasks

2. **Provide clear validation**: Always validate user input at each step

3. **Make steps skippable when appropriate**: Not all steps need to be mandatory

4. **Use branching logic wisely**: Only branch when the path significantly
   differs

5. **Keep steps focused**: Each step should have a single, clear purpose

6. **Provide help text and tips**: Guide users through complex steps

7. **Test wizard flows**: Ensure all paths work correctly

8. **Track wizard completion**: Use analytics to improve wizard design

9. **Allow users to exit**: Always provide a way to cancel or exit

10. **Save progress automatically**: Don't make users lose their progress

## Troubleshooting

### Wizard not appearing

Check that:

- WizardProvider is wrapping your app
- Wizard is registered with the state manager
- User has appropriate role/skill level

### Validation not working

Ensure:

- Validation function returns correct ValidationResult structure
- Validation errors are being displayed in the step component

### Progress not saving

Verify:

- updateContext is being called when data changes
- State manager is persisted across page refreshes (if needed)

### Custom step not rendering

Confirm:

- Step component is registered in STEP_COMPONENTS
- Component name matches the step's `component` field
- Component accepts correct props interface

## Support

For issues or questions:

- Check the [Examples](#examples) section
- Review the [API Reference](#api-reference)
- Open an issue on GitHub
- Contact the development team

## Version History

- **v1.0.0** (Current): Initial release with 5 default wizards and full React
  integration
