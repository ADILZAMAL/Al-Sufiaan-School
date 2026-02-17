import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../../providers/AppContext';

/**
 * ProtectedRoute component that guards routes requiring authentication
 * 
 * - Shows loading state while checking authentication
 * - Redirects to /sign-in if user is not authenticated
 * - Renders children/Outlet if user is authenticated
 */
const ProtectedRoute = () => {
  const { isLoggedIn, isAuthLoading } = useAppContext();

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
