# Chakra UI to Tailwind CSS Migration Guide

## Overview
This document outlines the migration strategy from Chakra UI to Tailwind CSS for The New Fuse frontend application.

## Current Status
- **Completed**: A2AMultiAgentChat, Dashboard components, Layout components, Toast system
- **Remaining**: 57 files still using Chakra UI components
- **Target**: Complete migration to Tailwind CSS utility classes

## Migration Priority

### High Priority (User-Facing)
1. **Admin Panels** (`src/pages/Admin/*`)
2. **Authentication** (`src/components/auth/*`)
3. **Onboarding Flow** (`src/components/onboarding/*`, `src/components/admin/onboarding/*`)
4. **Analytics & Charts** (`src/components/analytics/*`, `src/components/AdminPanel/*`)
5. **Forms** (`src/components/forms/*`, `src/components/shared/FormFields.tsx`)

### Medium Priority
1. **Workflows** (`src/pages/Workflows/*`)
2. **Shared Components** (`src/components/shared/*`)
3. **Prompt Workbench** (`src/components/PromptWorkbench/*`)
4. **Agent Creation** (`src/components/AgentCreationStudio.tsx`)

### Low Priority
1. **Demonstration Components** (`src/components/demo/*`)
2. **Utility Components** (`src/components/ui/popup/*`)

## Component Mapping Reference

### Layout Components
```jsx
// Chakra UI → Tailwind CSS
<Box> → <div className="...">
<VStack> → <div className="flex flex-col">
<HStack> → <div className="flex flex-row">
<Flex> → <div className="flex">
<SimpleGrid> → <div className="grid">
<Container> → <div className="container mx-auto">
```

### Typography
```jsx
<Text> → <p className="text-...">
<Heading> → <h1-6 className="text-... font-...">
<Code> → <code className="bg-gray-100 text-sm font-mono">
<Badge> → <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
```

### Form Components
```jsx
<Input> → <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
<Textarea> → <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
<Select> → <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
<Button> → <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
<Checkbox> → <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
```

### Feedback Components
```jsx
<Alert> → <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
<AlertIcon> → <div className="flex-shrink-0 w-5 h-5 text-blue-600">
<Progress> → <div className="w-full bg-gray-200 rounded-full"><div className="h-2 bg-blue-600 rounded-full" style={{width: '60%'}}></div></div>
<Spinner> → <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600">
```

### Navigation
```jsx
<Tabs> → Complex migration (see Tabs migration guide)
<Menu> → <div className="relative inline-block text-left">
<Modal> → Complex migration (see Modal migration guide)
```

### Data Display
```jsx
<Table> → <table className="min-w-full divide-y divide-gray-200">
<Tbody> → <tbody className="bg-white divide-y divide-gray-200">
<Tr> → <tr className="hover:bg-gray-50">
<Td> → <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
```

### Cards
```jsx
<Card> → <div className="bg-white shadow rounded-lg">
<CardHeader> → <div className="px-6 py-4 border-b border-gray-200">
<CardBody> → <div className="px-6 py-4">
<CardFooter> → <div className="px-6 py-4 border-t border-gray-200">
```

## Common Utility Classes

### Colors
```css
/* Text Colors */
text-gray-900     /* Dark text */
text-gray-600     /* Medium text */
text-gray-500     /* Light text */
text-blue-600     /* Primary text */
text-red-600      /* Error text */
text-green-600    /* Success text */
text-yellow-600   /* Warning text */

/* Background Colors */
bg-white          /* White background */
bg-gray-50        /* Light gray */
bg-gray-100       /* Medium gray */
bg-blue-600       /* Primary blue */
bg-red-100        /* Error background */
bg-green-100      /* Success background */
bg-yellow-100     /* Warning background */

/* Border Colors */
border-gray-200   /* Light borders */
border-gray-300   /* Medium borders */
border-blue-500   /* Primary borders */
border-red-500    /* Error borders */
```

### Spacing
```css
p-4              /* Padding 4 units (16px) */
px-6             /* Horizontal padding */
py-4             /* Vertical padding */
m-4              /* Margin 4 units */
mx-auto          /* Horizontal margin auto */
mt-2             /* Margin top 2 units */
mb-4             /* Margin bottom 4 units */
space-y-4        /* Gap between children (flex/grid) */
```

### Typography
```css
text-sm          /* Small text */
text-base        /* Base text size */
text-lg          /* Large text */
text-xl          /* Extra large text */
text-2xl         /* 24px text */
text-3xl         /* 30px text */
font-medium      /* Medium weight */
font-semibold    /* Semi-bold weight */
font-bold        /* Bold weight */
```

### Layout
```css
flex             /* Flexbox */
flex-col         /* Column flex */
flex-row         /* Row flex */
items-center     /* Center items */
justify-center   /* Justify center */
justify-between  /* Space between */
grid             /* Grid layout */
grid-cols-3      /* 3 columns */
gap-4            /* Grid/flex gap */
w-full           /* Full width */
h-full           /* Full height */
min-h-screen     /* Minimum full screen height */
```

### Borders & Rounded
```css
rounded          /* Border radius small */
rounded-lg       /* Border radius large */
rounded-full     /* Full border radius */
border           /* Border */
border-2         /* Border 2px */
border-gray-300  /* Gray border */
```

## Migration Patterns

### 1. Simple Component Migration
```jsx
// Before (Chakra UI)
import { Box, Text, Button } from '@chakra-ui/react';

function MyComponent() {
  return (
    <Box p={4} bg="white" rounded="lg" shadow="sm">
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        Hello World
      </Text>
      <Button colorScheme="blue" size="sm">
        Click Me
      </Button>
    </Box>
  );
}

// After (Tailwind CSS)
function MyComponent() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <p className="text-lg font-bold mb-2">
        Hello World
      </p>
      <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
        Click Me
      </button>
    </div>
  );
}
```

### 2. Complex Component Migration
```jsx
// Before (Chakra UI)
import { 
  Box, VStack, HStack, Text, Button, Input, Select, 
  FormControl, FormLabel, Alert, AlertIcon, Spinner 
} from '@chakra-ui/react';

function FormComponent() {
  const [loading, setLoading] = useState(false);
  
  return (
    <Box maxW="md" mx="auto" p={6}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input placeholder="Enter name" />
        </FormControl>
        
        <FormControl>
          <FormLabel>Type</FormLabel>
          <Select>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </Select>
        </FormControl>
        
        {loading && (
          <Alert status="info">
            <AlertIcon />
            <Text>Saving...</Text>
          </Alert>
        )}
        
        <HStack>
          <Button colorScheme="blue" onClick={() => setLoading(true)}>
            Save
          </Button>
          <Button variant="outline">
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// After (Tailwind CSS)
function FormComponent() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex flex-col space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input 
            type="text" 
            placeholder="Enter name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
        </div>
        
        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
            <div className="flex-shrink-0 w-5 h-5 text-blue-600">
              <svg>...</svg>
            </div>
            <p className="ml-2 text-sm text-blue-800">Saving...</p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setLoading(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Special Cases

### Dark Mode
```jsx
// Use dark: prefix for dark mode variants
className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
```

### Responsive Design
```jsx
// Use responsive prefixes
className="text-sm md:text-base lg:text-lg px-4 md:px-6 lg:px-8"
```

### State-Based Styling
```jsx
// Use conditional classes
className={`px-4 py-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}

// Or with class-variance-authority
import { cva } from 'class-variance-authority';
const buttonVariants = cva(
  'px-4 py-2 rounded-lg font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        danger: 'bg-red-600 text-white hover:bg-red-700'
      }
    }
  }
);
```

## Migration Steps

1. **Analyze Current Component**
   - Identify Chakra UI imports
   - List all components used
   - Note styling props and variants

2. **Plan Migration**
   - Create Tailwind CSS class mapping
   - Identify responsive behavior
   - Plan dark mode support

3. **Implement Migration**
   - Replace imports
   - Convert JSX elements
   - Apply Tailwind utility classes

4. **Test and Validate**
   - Verify visual appearance
   - Test responsive behavior
   - Check dark mode compatibility
   - Ensure functionality is preserved

5. **Clean Up**
   - Remove unused Chakra UI imports
   - Remove Chakra UI dependencies if completely migrated
   - Update any related type definitions

## Tools and Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
- **Headless UI**: For complex components like modals, dropdowns
- **Radix UI**: For accessible primitives
- **class-variance-authority**: For component variants
- **clsx**: For conditional className logic

## Progress Tracking

- [x] A2AMultiAgentChat.tsx
- [x] Layout components (Sidebar, Header)
- [x] Dashboard pages
- [ ] Authentication components
- [ ] Admin panels
- [ ] Analytics components
- [ ] Form components
- [ ] Onboarding flow
- [ ] Prompt workbench
- [ ] Workflow components
- [ ] Shared utility components