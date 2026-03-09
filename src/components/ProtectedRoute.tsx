import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CircleNotch } from '@phosphor-icons/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: ('player' | 'organizer' | 'admin')[];
  /** When set, show this instead of redirecting to login (e.g. preview + sign-up CTA) */
  unauthenticatedFallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  unauthenticatedFallback,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // When unauthenticated: show fallback (e.g. preview + CTA) or redirect to login
  if (requireAuth && !isAuthenticated) {
    if (unauthenticatedFallback) {
      return <>{unauthenticatedFallback}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requireRole && user && !requireRole.includes(user.role)) {
    return <Navigate to="/tournaments" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
