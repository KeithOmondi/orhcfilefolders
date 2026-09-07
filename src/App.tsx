// App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { checkAuth } from './store/slices/authSlice';

// Auth Components & Guards
import Login from './components/auth/Login';
import ProtectedRoutes from './routes/ProtectedRoutes';

// Layouts
import DrLayout from './components/layouts/dr/DrLayout';
import AdminLayout from './components/layouts/admin/AdminLayout';

// DR Pages
import DrDashboard from './pages/dr/DrDashboard';
import DrForm from './pages/dr/DrForm';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPendingP from './pages/admin/AdminPndingP';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import DrRequirementsForm from './pages/dr/DrRequirementsForm';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isInitializing, isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Initialize and restore auth session on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Global loading state during initial session check
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Initializing session...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected DR Routes */}
        <Route element={<ProtectedRoutes allowedRoles={['dr']} />}>
          <Route element={<DrLayout />}>
            <Route path="/dashboard" element={<DrDashboard />} />
            <Route path="/equirements-form" element={<DrRequirementsForm />} />
            <Route path="/pending-proceedings" element={<DrForm />} />
          </Route>
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoutes allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/pending-proceedings" element={<AdminPendingP />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Root Route Handler */}
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              <Navigate
                to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
              <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
              <p className="text-slate-600 mt-2">The page you are looking for does not exist.</p>
              <Link
                to="/"
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;