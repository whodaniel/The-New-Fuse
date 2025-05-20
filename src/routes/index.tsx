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