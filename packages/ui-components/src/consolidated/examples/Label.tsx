import React from 'react';
import { Label } from '../Label.js';
import { Input } from '../Input.js';

// Basic Label
export const BasicLabel = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input type="email" id="email" placeholder="Enter your email" />
  </div>
);

// Required Label
export const RequiredLabel = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="password" required>Password</Label>
    <Input type="password" id="password" placeholder="Enter your password" />
  </div>
);

// Error State Label
export const ErrorLabel = () => (
  <div className="grid w-full max-w-sm items-center gap-1.5">
    <Label htmlFor="username" error>Username</Label>
    <Input 
      type="text" 
      id="username" 
      placeholder="Enter your username" 
      className="border-destructive" 
    />
  </div>
);

// Form Field Group
export const FormFieldGroup = () => (
  <form className="w-full max-w-sm space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="name">Full Name</Label>
      <Input type="text" id="name" placeholder="John Doe" />
    </div>
    
    <div className="space-y-1.5">
      <Label htmlFor="email-required" required>Email Address</Label>
      <Input type="email" id="email-required" placeholder="john@example.com" />
    </div>
    
    <div className="space-y-1.5">
      <Label htmlFor="phone" error>Phone Number</Label>
      <Input 
        type="tel" 
        id="phone" 
        placeholder="+1 (555) 000-0000"
        className="border-destructive" 
      />
      <p className="text-sm text-destructive">Invalid phone number format</p>
    </div>
  </form>
);