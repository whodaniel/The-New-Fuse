import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import ProtectedRoute from '@/components/core/ProtectedRoute';
import PublicRoute from '@/components/core/PublicRoute';
import { Center, Spinner } from '@chakra-ui/react';

// Lazy load components
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Landing = React.lazy(() => import('@/pages/Landing'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Register = React.lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Additional routes that are missing
const Agents = React.lazy(() => import('@/pages/Agents').catch(() => ({ default: () => <div>Agents page coming soon</div> })));
const Workflows = React.lazy(() => import('@/pages/Workflows').catch(() => ({ default: () => <div>Workflows page coming soon</div> })));
const Analytics = React.lazy(() => import('@/pages/Analytics').catch(() => ({ default: () => <div>Analytics page coming soon</div> })));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <PublicRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Landing />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <PublicRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Login />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Register />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <ForgotPassword />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <PublicRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <ResetPassword />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/*',
        element: (
          <ProtectedRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'agents',
        element: (
          <ProtectedRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Agents />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'workflows',
        element: (
          <ProtectedRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Workflows />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute>
            <Suspense fallback={
              <Center h="100vh">
                <Spinner
                  size="xl"
                  color="brand.500"
                />
              </Center>
            }>
              <Analytics />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={
            <Center h="100vh">
              <Spinner
                size="xl"
                color="brand.500"
              />
            </Center>
          }>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
];