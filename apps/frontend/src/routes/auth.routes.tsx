/**
 * Auth Routes Module
 *
 * Contains all authentication-related routes:
 * - Login, Register, Logout
 * - Password reset flow
 * - OAuth callbacks
 */

import { lazy, type ReactElement } from 'react';
import { Route } from 'react-router-dom';

// Lazy load components
const LazyComponent = <T extends React.ComponentType<unknown>>(loader: () => Promise<{ default: T }>) =>
  lazy(loader);

const LoginPage = LazyComponent(() => import('../pages/auth/Login'));
const RegisterPage = LazyComponent(() => import('../pages/auth/Register'));
const AuthIndexPage = LazyComponent(() => import('../pages/auth/Index'));
const ForgotPasswordPage = LazyComponent(() => import('../pages/auth/ForgotPassword'));
const ResetPasswordPage = LazyComponent(() => import('../pages/auth/ResetPassword'));
const SSOPage = LazyComponent(() => import('../pages/auth/SSO'));
const GoogleCallbackPage = LazyComponent(() => import('../pages/auth/GoogleCallback'));
const OAuthCallbackPage = LazyComponent(() => import('../pages/auth/OAuthCallback'));

/**
 * Auth route definitions
 */
export const authRoutes: ReactElement[] = [
  // Auth index
  <Route key="auth-index" path="/auth" element={<AuthIndexPage />} />,

  // Login/Register
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="register" path="/register" element={<RegisterPage />} />,
  <Route key="auth-login" path="/auth/login" element={<LoginPage />} />,
  <Route key="auth-register" path="/auth/register" element={<RegisterPage />} />,

  // Password management
  <Route key="auth-forgot-password" path="/auth/forgot-password" element={<ForgotPasswordPage />} />,
  <Route key="auth-reset-password" path="/auth/reset-password" element={<ResetPasswordPage />} />,

  // SSO
  <Route key="auth-sso" path="/auth/sso" element={<SSOPage />} />,

  // OAuth callbacks
  <Route key="auth-google-callback" path="/auth/google-callback" element={<GoogleCallbackPage />} />,
  <Route key="auth-google-callback-alt" path="/auth/google/callback" element={<GoogleCallbackPage />} />,
  <Route key="auth-callback" path="/auth/callback" element={<OAuthCallbackPage />} />,
  <Route key="auth-oauth-callback" path="/auth/oauth-callback" element={<OAuthCallbackPage />} />,
];

/**
 * Auth-related route paths
 */
export const AUTH_ROUTES = [
  '/auth',
  '/login',
  '/register',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/sso',
  '/auth/google-callback',
  '/auth/google/callback',
  '/auth/callback',
  '/auth/oauth-callback',
];
