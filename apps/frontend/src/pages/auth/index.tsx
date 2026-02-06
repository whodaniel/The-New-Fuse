import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Login = React.lazy(() => import('./Login'));
const Register = React.lazy(() => import('./Register'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const ResetPassword = React.lazy(() => import('./ResetPassword'));
const SSO = React.lazy(() => import('./SSO'));

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold">Welcome to The New Fuse</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
};

const Auth = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="sso/:provider" element={<SSO />} />
      </Route>
    </Routes>
  );
};

export default Auth;
