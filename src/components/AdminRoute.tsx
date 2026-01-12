import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute wrapper component that blocks rendering until admin status is verified.
 * This prevents UI flash of admin content before redirect happens.
 * Note: Database operations are still protected by RLS policies - this is defense in depth.
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, loading } = useAdmin();
  const hasShownError = useRef(false);

  useEffect(() => {
    // Show error toast only once when user is authenticated but not admin
    if (!loading && user && !isAdmin && !hasShownError.current) {
      toast.error('Você não tem permissão para acessar esta área');
      hasShownError.current = true;
    }
  }, [loading, user, isAdmin]);

  // Show loading state while checking authentication and admin status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to home if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // User is authenticated and is admin - render the protected content
  return <>{children}</>;
};

export default AdminRoute;
