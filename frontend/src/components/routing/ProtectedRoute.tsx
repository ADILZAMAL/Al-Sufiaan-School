import { Navigate, Outlet } from 'react-router-dom'; // Navigate used for sign-in redirect
import { useAppContext } from '../../providers/AppContext';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | 'TEACHER';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute component that guards routes requiring authentication
 *
 * - Shows loading state while checking authentication
 * - Redirects to /sign-in if user is not authenticated
 * - If allowedRoles is provided, redirects to /dashboard if role is not allowed
 * - Renders children/Outlet if user is authenticated (and authorized)
 */
const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const { isLoggedIn, isAuthLoading, userRole } = useAppContext();

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

  // Show unauthorized message if user's role is not allowed
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole as UserRole))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">403</h1>
          <p className="mt-2 text-lg text-gray-600">You are not authorized to view this page.</p>
        </div>
      </div>
    );
  }

  // User is authenticated (and authorized), render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
