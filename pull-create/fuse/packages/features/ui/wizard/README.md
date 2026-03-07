# Wizard System

A comprehensive interactive user guidance system for The New Fuse framework. The
Wizard System helps users accomplish complex tasks through step-by-step
guidance, validation, and contextual help.

## Features

- **5 Default Wizards**: Get Started, Create Agent, Deploy to Railway, Configure
  RBAC, Troubleshooting
- **14 Step Components**: Pre-built React components for common wizard steps
- **Dynamic Step Rendering**: Map component names to actual components at
  runtime
- **Progress Tracking**: Save and resume wizard progress
- **Validation System**: Per-step validation with error messaging
- **Branching Logic**: Conditional step navigation based on user choices
- **Context Passing**: Share data between wizard steps
- **React Hooks**: `useWizard` and `useWizardList` for easy integration

## Installation

The wizard system is part of the `@the-new-fuse/features` package:

```bash
pnpm add @the-new-fuse/features
```

## Quick Start

### Basic Usage

```tsx
import {
  Wizard,
  WizardList,
  useWizard,
  initializeWizardSystem,
} from '@the-new-fuse/features/ui/wizard';

// Initialize the wizard system
const stateManager = initializeWizardSystem();

function App() {
  return (
    <WizardList
      stateManager={stateManager}
      userId="current-user-id"
      userRole="admin"
    />
  );
}
```

### Using the Hook

```tsx
import { useWizard } from '@the-new-fuse/features/ui/wizard';

function MyComponent() {
  const {
    wizard,
    progress,
    currentStep,
    next,
    previous,
    skip,
    updateData,
    canGoNext,
    isComplete,
  } = useWizard({
    wizardId: 'get-started',
    userId: 'user-123',
    autoSave: true,
    onComplete: (progress) => {
      console.log('Wizard completed!', progress);
    },
  });

  if (isComplete) {
    return <div>Congratulations! You've completed the wizard.</div>;
  }

  return (
    <div>
      <h2>{currentStep?.title}</h2>
      <button onClick={previous} disabled={!progress?.currentStepId}>
        Previous
      </button>
      <button onClick={next} disabled={!canGoNext}>
        Next
      </button>
    </div>
  );
}
```

## Available Wizards

### 1. Get Started Wizard

**ID**: `get-started` **Purpose**: Onboard new users to The New Fuse

**Steps**:

- Welcome Screen
- Profile Setup
- Workspace Setup
- Create First Agent
- Test Agent
- Complete

### 2. Agent Creation Wizard

**ID**: `create-agent` **Purpose**: Guide users through creating a new AI agent

**Steps**:

- Agent Configuration (name, type, provider, model)
- Agent Capabilities (select abilities)
- Agent Testing (interactive chat test)
- Complete

### 3. Deploy to Railway Wizard

**ID**: `deploy-railway` **Purpose**: Deploy cloud sandbox to Railway

**Steps**:

- Railway Connection (login, project selection)
- Deployment Configuration (environment, instance, database)
- Deployment Progress (real-time status)
- Complete

### 4. Configure RBAC Wizard

**ID**: `configure-rbac` **Purpose**: Set up role-based access control

**Steps**:

- Role Configuration (view/create roles)
- Permission Matrix (assign permissions)
- Complete

### 5. Troubleshooting Wizard

**ID**: `troubleshooting` **Purpose**: Help users identify and fix issues

**Steps**:

- Problem Identification (category, description)
- Diagnostics Runner (automated checks)
- Solution Steps (guided fixes)
- Complete

## Step Components

### Onboarding Steps

| Component        | Description                           |
| ---------------- | ------------------------------------- |
| `WelcomeScreen`  | Initial welcome with feature overview |
| `ProfileSetup`   | User profile configuration            |
| `WorkspaceSetup` | Create and configure workspace        |

### Agent Steps

| Component            | Description                                 |
| -------------------- | ------------------------------------------- |
| `AgentConfiguration` | Configure agent name, type, provider, model |
| `AgentCapabilities`  | Select agent capabilities                   |
| `AgentTesting`       | Interactive chat testing interface          |

### Deployment Steps

| Component                 | Description                               |
| ------------------------- | ----------------------------------------- |
| `RailwayConnection`       | Connect to Railway, select project        |
| `DeploymentConfiguration` | Configure environment, instance, database |
| `DeploymentProgress`      | Real-time deployment status               |

### RBAC Steps

| Component           | Description                |
| ------------------- | -------------------------- |
| `RoleConfiguration` | View and create user roles |
| `PermissionMatrix`  | Configure role permissions |

### Troubleshooting Steps

| Component               | Description               |
| ----------------------- | ------------------------- |
| `ProblemIdentification` | Identify issue category   |
| `DiagnosticsRunner`     | Run automated diagnostics |
| `SolutionSteps`         | Guided solution steps     |

## Creating Custom Wizards

### Using WizardBuilder

```typescript
import {
  WizardBuilder,
  WizardContext,
  ValidationResult,
} from '@the-new-fuse/features/ui/wizard';

const myWizard = new WizardBuilder('my-wizard', 'My Custom Wizard')
  .description('A custom wizard for my use case')
  .category('custom')
  .targetAudience(['developer'])
  .estimatedTime(5)
  .addStep({
    id: 'step-1',
    title: 'First Step',
    description: 'Description of the first step',
    component: 'MyCustomComponent',
    canSkip: false,
    nextStep: 'step-2',
    validation: async (context: WizardContext): Promise<ValidationResult> => {
      if (!context.data.requiredField) {
        return { valid: false, errors: ['Required field is missing'] };
      }
      return { valid: true };
    },
  })
  .addStep({
    id: 'step-2',
    title: 'Second Step',
    description: 'Description of the second step',
    component: 'AnotherComponent',
    nextStep: null, // Last step
  })
  .build();
```

### Registering Custom Wizards

```typescript
import { initializeWizardSystem } from '@the-new-fuse/features/ui/wizard';

const stateManager = initializeWizardSystem();

// Register your custom wizard
stateManager.registerWizard(myWizard);
```

### Adding Custom Step Components

```tsx
import {
  STEP_COMPONENTS,
  WizardContext,
} from '@the-new-fuse/features/ui/wizard';

interface MyCustomComponentProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

function MyCustomComponent({
  context,
  onDataChange,
  validationErrors,
}: MyCustomComponentProps) {
  return (
    <div>
      <h2>My Custom Step</h2>
      {validationErrors?.map((error) => (
        <div key={error} className="error">
          {error}
        </div>
      ))}
      <input
        value={(context.data.myField as string) || ''}
        onChange={(e) => onDataChange({ myField: e.target.value })}
      />
    </div>
  );
}

// Register the component
STEP_COMPONENTS['MyCustomComponent'] = MyCustomComponent;
```

## Step Component Props

All step components receive these props:

```typescript
interface StepComponentProps {
  context: WizardContext; // Current wizard context with data
  onDataChange: (data: Record<string, unknown>) => void; // Update wizard data
  validationErrors?: string[]; // Validation errors for current step
}
```

## Wizard Context

The `WizardContext` object contains:

```typescript
interface WizardContext {
  userId: string; // ID of the current user
  wizardId: string; // ID of the current wizard
  startedAt: Date; // When the wizard was started
  data: Record<string, unknown>; // User-provided data from all steps
  metadata: Record<string, unknown>; // Additional metadata
}
```

## Styling

The wizard system includes a CSS file with all necessary styles:

```tsx
import '@the-new-fuse/features/ui/wizard/wizard.css';
```

### CSS Variables

Customize the wizard appearance using CSS variables:

```css
:root {
  --wizard-primary: #3b82f6;
  --wizard-success: #10b981;
  --wizard-warning: #f59e0b;
  --wizard-error: #ef4444;
  --wizard-bg: #ffffff;
  --wizard-border: #e5e7eb;
  --wizard-text: #111827;
  --wizard-muted: #6b7280;
}
```

## API Reference

### WizardStateManager

```typescript
class WizardStateManager {
  registerWizard(wizard: WizardDefinition): void;
  getWizard(id: string): WizardDefinition | undefined;
  listWizards(): WizardDefinition[];
  startWizard(userId: string, wizardId: string): WizardProgress;
  getProgress(userId: string, wizardId: string): WizardProgress | undefined;
  next(userId: string, wizardId: string): Promise<WizardProgress>;
  previous(userId: string, wizardId: string): WizardProgress;
  skip(userId: string, wizardId: string): WizardProgress;
  updateContext(
    userId: string,
    wizardId: string,
    data: Record<string, unknown>
  ): void;
  validateCurrentStep(
    userId: string,
    wizardId: string
  ): Promise<ValidationResult>;
}
```

### useWizard Hook

```typescript
function useWizard(options: UseWizardOptions): UseWizardReturn;

interface UseWizardOptions {
  wizardId: string;
  userId: string;
  stateManager?: WizardStateManager;
  autoSave?: boolean;
  onComplete?: (progress: WizardProgress) => void;
  onStepChange?: (step: WizardStep) => void;
}

interface UseWizardReturn {
  wizard: WizardDefinition | null;
  progress: WizardProgress | null;
  currentStep: WizardStep | null;
  validationErrors: string[];
  isValidating: boolean;
  next: () => Promise<void>;
  previous: () => void;
  skip: () => void;
  updateData: (data: Record<string, unknown>) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canSkip: boolean;
  isComplete: boolean;
}
```

## Best Practices

1. **Keep Steps Focused**: Each step should accomplish one clear task
2. **Provide Clear Validation**: Give specific error messages for validation
   failures
3. **Allow Skipping When Possible**: Make optional steps skippable
4. **Save Progress**: Use `autoSave` to persist progress across sessions
5. **Test Navigation**: Verify all step transitions work correctly
6. **Document Steps**: Provide help text and tips for each step

## Troubleshooting

### Common Issues

**Step component not rendering**

- Ensure the component is registered in `STEP_COMPONENTS`
- Check that the `component` name in the wizard step matches the registered name

**Validation not working**

- Verify the `validation` function returns a `ValidationResult` object
- Check for errors in the validation function's async logic

**Progress not saving**

- Enable `autoSave` in the `useWizard` hook
- Implement persistence in the `WizardStateManager` if needed

## License

MIT License - Part of The New Fuse project.
