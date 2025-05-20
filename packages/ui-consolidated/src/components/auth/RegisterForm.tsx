import React, { useState } from 'react';
import { useAuthContext } from '../../providers/AuthProvider.js';
import { Button } from '../Button.js';
import { Input } from '../Input.js';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../Card.js';
import { Alert, AlertTitle, AlertDescription } from '../Alert/Alert.js';

/**
 * Register form props
 */
export interface RegisterFormProps {
  /**
   * Callback when registration is successful
   */
  onSuccess?: () => void;
  /**
   * Callback when registration is cancelled
   */
  onCancel?: () => void;
  /**
   * Whether to show the cancel button
   * @default false
   */
  showCancel?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Register form component
 * @param props Register form props
 * @returns Register form component
 * 
 * @example
 * // Basic usage
 * <RegisterForm onSuccess={() => navigate('/dashboard')} />
 * 
 * // With cancel button
 * <RegisterForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/')}
 *   showCancel
 * />
 */
export function RegisterForm({
  onSuccess,
  onCancel,
  showCancel = false,
  className,
}: RegisterFormProps): JSX.Element {
  const { register, isLoading } = useAuthContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError(null);
      await register(name, email, password);
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message || 'Failed to register');
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to create a new account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="error">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
            disabled={isLoading}
          />
          
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
          
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            disabled={isLoading}
          />
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
