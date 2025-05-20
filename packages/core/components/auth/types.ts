export interface AuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectUrl?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  terms: boolean;
}

export interface TwoFactorAuthData {
  code: string;
  method: app' | 'sms' | 'email';
}

export interface ResetPasswordData {
  email?: string;
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface EmailVerificationData {
  email: string;
  code: string;
}
