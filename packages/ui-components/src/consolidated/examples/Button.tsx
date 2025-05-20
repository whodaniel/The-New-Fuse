import React from 'react';
import { Button } from '../Button.js';
import { Search, Mail, Menu } from 'lucide-react';

// Basic Examples
export const BasicButton = () => <Button>Click me</Button>;

// Variants
export const ButtonVariants = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);

// Sizes
export const ButtonSizes = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon"><Menu className="h-4 w-4" /></Button>
  </div>
);

// States
export const ButtonStates = () => (
  <div className="flex flex-wrap gap-4">
    <Button isLoading>Loading</Button>
    <Button disabled>Disabled</Button>
    <Button icon={<Search />}>With Icon</Button>
    <Button icon={<Mail />} iconPosition="end">Icon End</Button>
  </div>
);

// Use Cases
export const ButtonUseCases = () => (
  <div className="space-y-4">
    {/* Primary Action */}
    <div className="flex gap-2">
      <Button>Save Changes</Button>
      <Button variant="destructive">Delete Account</Button>
    </div>
    
    {/* Secondary Actions */}
    <div className="flex gap-2">
      <Button variant="outline">Cancel</Button>
      <Button variant="secondary">Preview</Button>
    </div>
    
    {/* Navigation */}
    <div className="flex gap-2">
      <Button variant="ghost">Back</Button>
      <Button variant="link">Learn More</Button>
    </div>
  </div>
);