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
 * Login form props
 */
export interface LoginFormProps {
  /**
   * Callback when login is successful
   */
  onSuccess?: () => void;
  /**
   * Callback when login is cancelled
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
 * Login form component
 * @param props Login form props
 * @returns Login form component
 * 
 * @example
 * // Basic usage
 * <LoginForm onSuccess={() => navigate('/dashboard')} />
 * 
 * // With cancel button
 * <LoginForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/')}
 *   showCancel
 * />
 */
export function LoginForm({
  onSuccess,
  onCancel,
  showCancel = false,
  className,
}: LoginFormProps): JSX.Element {
  const { login, isLoading } = useAuthContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError(null);
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message || 'Failed to login');
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to sign in to your account</CardDescription>
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
            Sign In
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
