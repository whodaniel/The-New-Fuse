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

const LoginPage = lazy(() => import('../pages/auth/Login'));
const RegisterPage = lazy(() => import('../pages/auth/Register'));
const AuthIndexPage = lazy(() => import('../pages/auth'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPassword'));
const SSOPage = lazy(() => import('../pages/auth/SSO'));
const GoogleCallbackPage = lazy(() => import('../pages/auth/GoogleCallback'));
const OAuthCallbackPage = lazy(() => import('../pages/auth/OAuthCallback'));

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
  <Route
    key="auth-forgot-password"
    path="/auth/forgot-password"
    element={<ForgotPasswordPage />}
  />,
  <Route key="auth-reset-password" path="/auth/reset-password" element={<ResetPasswordPage />} />,

  // SSO
  <Route key="auth-sso" path="/auth/sso" element={<SSOPage />} />,

  // OAuth callbacks
  <Route
    key="auth-google-callback"
    path="/auth/google-callback"
    element={<GoogleCallbackPage />}
  />,
  <Route
    key="auth-google-callback-alt"
    path="/auth/google/callback"
    element={<GoogleCallbackPage />}
  />,
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
