# The New Fuse UI Components

This package contains the consolidated UI components for The New Fuse platform. It provides a consistent set of components that can be used across the application.

## Features

- 🎨 Fully customizable components with variants
- 🌙 Dark mode support
- 📱 Responsive design
- ♿ Accessible components
- 🧪 Thoroughly tested
- 📚 Comprehensive documentation

## Installation

```bash
yarn add @the-new-fuse/ui-consolidated
```

## Usage

```tsx
import { Button, Card, Input, Select } from '@the-new-fuse/ui-consolidated';

function MyComponent() {
  return (
    <Card title="My Form">
      <form>
        <Input
          label="Name"
          placeholder="Enter your name"
        />
        <Select
          label="Country"
          options={[
            { value: 'us', label: 'United States' },
            { value: 'ca', label: 'Canada' },
          ]}
        />
        <Button>Submit</Button>
      </form>
    </Card>
  );
}
```

## Components

### Core Components

#### Button

A versatile button component that supports multiple variants, sizes, and states.

```tsx
// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// With loading state
<Button isLoading>Processing...</Button>

// With icon
<Button icon={<IconComponent />}>With Icon</Button>
```

#### Card

A flexible container component for displaying content in a contained box.

```tsx
// Basic usage
<Card>Content</Card>

// With title
<Card title="Card Title">Content</Card>

// With header and footer
<Card
  header={<div>Header Content</div>}
  footer={<div>Footer Content</div>}
>
  Main Content
</Card>

// With variants
<Card variant="elevated" size="lg">Large elevated card</Card>
```

#### Input

A text input component with support for labels, icons, and validation states.

```tsx
// Basic usage
<Input placeholder="Enter text" />

// With label and helper text
<Input
  label="Email"
  placeholder="Enter your email"
  helperText="We'll never share your email"
/>

// With error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With icons
<Input
  startIcon={<MailIcon />}
  endIcon={<EyeIcon />}
  placeholder="Enter email"
/>
```

#### Select

A dropdown selection component with support for labels and validation states.

```tsx
// Basic usage
<Select
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
/>

// With label and helper text
<Select
  label="Country"
  helperText="Select your country of residence"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
/>

// With error state
<Select
  label="Language"
  error="Please select a language"
  options={[
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
  ]}
/>
```

#### Checkbox

A checkbox component for boolean input.

```tsx
// Basic usage
<Checkbox />

// With label
<Checkbox label="Accept terms and conditions" />

// With helper text
<Checkbox
  label="Subscribe to newsletter"
  helperText="We'll send you weekly updates"
/>

// With error
<Checkbox
  label="Accept terms"
  error="You must accept the terms to continue"
/>
```

#### Radio

A radio component for selecting a single option from a group.

```tsx
// Basic usage
<Radio name="option" value="option1" label="Option 1" />
<Radio name="option" value="option2" label="Option 2" />

// With RadioGroup
<RadioGroup
  name="fruit"
  label="Select a fruit"
  options={[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ]}
/>
```

#### Switch

A switch component for toggling between two states.

```tsx
// Basic usage
<Switch />

// With label
<Switch label="Dark mode" />

// With label position
<Switch labelPosition="left" label="Enable notifications" />
```

#### Textarea

A textarea component for multi-line text input.

```tsx
// Basic usage
<Textarea placeholder="Enter your message" />

// With auto-resize
<Textarea autoResize placeholder="This will grow as you type..." />

// With label and helper text
<Textarea
  label="Message"
  placeholder="Enter your message"
  helperText="Maximum 500 characters"
/>
```

### Layout Components

#### Container

A responsive container with max-width.

```tsx
<Container>
  <h1>Page Content</h1>
  <p>This content is contained within a responsive container.</p>
</Container>
```

#### Layout

A page layout component with header, sidebar, and content areas.

```tsx
<Layout>
  <Layout.Header>Header Content</Layout.Header>
  <Layout.Sidebar>Sidebar Content</Layout.Sidebar>
  <Layout.Content>Main Content</Layout.Content>
</Layout>
```

#### Split

A resizable split view component.

```tsx
<Split>
  <Split.Pane minSize={200}>
    <div>Left Panel</div>
  </Split.Pane>
  <Split.Pane>
    <div>Right Panel</div>
  </Split.Pane>
</Split>
```

### Feedback Components

#### Alert

A component for displaying important messages.

```tsx
// Basic usage
<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>

// With variants
<Alert variant="info">
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>This is an informational message.</AlertDescription>
</Alert>

// With icon
<Alert
  variant="warning"
  icon={<ExclamationTriangleIcon className="h-4 w-4" />}
>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Your account is about to expire.</AlertDescription>
</Alert>
```

#### Tabs

A tabbed interface component.

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content for Tab 1</TabsContent>
  <TabsContent value="tab2">Content for Tab 2</TabsContent>
</Tabs>
```

## Utilities

### cn

A utility function for merging class names with Tailwind CSS.

```tsx
import { cn } from '@the-new-fuse/ui-consolidated';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
);
```

## Theme

The component library supports light and dark mode. To enable theme switching:

```jsx
import { ThemeProvider, ThemeToggle } from '@the-new-fuse/ui-consolidated';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <YourApp />
    </ThemeProvider>
  );
}
```

## Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build the package
yarn build

# Run Storybook
yarn storybook
```

## Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate test coverage
yarn test:coverage
```
