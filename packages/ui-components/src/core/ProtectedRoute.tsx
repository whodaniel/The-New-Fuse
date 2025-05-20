import React, { useEffect } from 'react';
import { useAuth } from '@the-new-fuse/hooks'; // Assuming useAuth hook handles auth logic

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Add any other props needed, e.g., required roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth(); // Use your auth hook

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect logic should be handled by the application using this component,
      // or potentially by the useAuth hook itself.
      // Example using window.location (not ideal for SPA):
      // window.location.href = '/login';
      // Or trigger login action from hook:
      // login(); // If your hook provides a login function to redirect
      console.warn("ProtectedRoute: User not authenticated. Redirect logic needed.");
    }
  }, [isAuthenticated, isLoading /*, login */]); // Removed router

  if (isLoading) {
    // Optional: Render a loading indicator
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    // Optional: Render null or a message while redirecting
    return null;
  }

  return <>{children}</>;
};

export { ProtectedRoute };