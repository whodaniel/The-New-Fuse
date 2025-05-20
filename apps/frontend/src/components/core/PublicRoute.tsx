import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider.js';
import Loading from '../Loading.js';

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  // Check if there's a redirect path in the location state
  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    // Redirect authenticated users to the dashboard or the page they were trying to access
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
