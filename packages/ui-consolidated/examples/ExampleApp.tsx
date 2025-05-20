import React, { useState } from 'react';
import { Button, Card, Input, Select } from '../src.js';
import { ConversationExportDemo } from '../src/components/ConversationExportDemo.js';
import { Mail, Eye, EyeOff } from 'lucide-react';

/**
 * Example application demonstrating the consolidated UI components
 */
export const ExampleApp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.country) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
        alert(JSON.stringify(formData, null, 2));
        setIsSubmitting(false);
      }, 1500);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-8">
      <ConversationExportDemo />
      <Card 
        className="w-full max-w-md"
        title="Registration Form"
        header={
          <p className="text-muted-foreground">
            Please fill out the form below to create an account.
          </p>
        }
        footer={
          <div className="flex justify-between w-full">
            <Button variant="ghost">Cancel</Button>
            <Button 
              variant="default" 
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Register
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Name"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            startIcon={<Mail size={16} />}
          />
          
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            endIcon={
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            helperText="Password must be at least 8 characters"
          />
          
          <Select
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            error={errors.country}
            options={[
              { value: '', label: 'Select a country' },
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'au', label: 'Australia' },
            ]}
          />
        </form>
      </Card>
    </div>
  );
};
