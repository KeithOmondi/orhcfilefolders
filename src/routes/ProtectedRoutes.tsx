import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshAccessToken } from '../store/slices/authSlice';

interface ProtectedRoutesProps {
  allowedRoles?: Array<'admin' | 'dr'>;
}

const ProtectedRoutes = ({ allowedRoles }: ProtectedRoutesProps) => {
  const { isAuthenticated, user, accessToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(!accessToken);

  useEffect(() => {
    // If user refreshes page, attempt to silently restore access token using HTTP-only cookie
    const initializeAuth = async () => {
      if (!accessToken) {
        try {
          await dispatch(refreshAccessToken()).unwrap();
        } catch {
          // Refresh thunk handles logout cleanup if token is invalid/expired
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [accessToken, dispatch]);

  // Screen loader while verifying session on page refresh
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated users -> Redirect to Login & keep track of previous page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Authorization check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to their default authorized landing page
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  // 3. Render nested protected child routes
  return <Outlet />;
};

export default ProtectedRoutes;