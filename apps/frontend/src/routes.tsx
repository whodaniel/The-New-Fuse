import { Route, Routes } from 'react-router-dom';
// import MainLayout from './components/layout/MainLayout';
import { LandingRedesigned } from './pages/LandingRedesigned';
// import { useAuth } from './providers/AuthProvider';

// Lazy-loaded components commented out
/*
const Dashboard = lazy(() => import('./pages/dashboard/index'));
...
*/

// Loading component
/*
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);
*/

// ProtectedRoute and PublicRoute removed for debug

export function AppRoutes() {
  // const { isLoading } = useAuth();

  // if (isLoading) {
  //   return <Loading />;
  // }

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingRedesigned />} />

      {/* Auth routes commented out for debug
      <Route path="/auth">
        ...
      </Route>
      */}

      {/* Protected routes commented out for debug
      <Route element={<MainLayout />}>
        ...
      </Route>
      */}

      {/* 404 page commented out for debug
      <Route
        path="*"
        element={
           <Suspense fallback={<Loading />}>
            <NotFound />
          </Suspense>
        }
      />
      */}
    </Routes>
  );
}
