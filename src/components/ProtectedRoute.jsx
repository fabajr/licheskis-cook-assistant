// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * ProtectedRoute checks authentication and role, rendering children or navigating.
 * Displays alerts before redirecting to provide clear feedback.
 * Usage:
 * <ProtectedRoute requireAdmin>
 *   <Component />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ requireAdmin, message, children }) {
  const { user, role, loading } = useAuth();
  const { show } = useToast();
  const location = useLocation();

  // While auth state is loading
  if (loading) return null;

  // If not logged in, show toast (if provided) and redirect to login
  if (!user) {
    if (message) show(message);
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // If admin role is required and user is not admin, show toast and redirect
  if (requireAdmin && role !== 'admin') {
    show(message || 'You do not have permission to access this page.');
    return <Navigate to="/" replace />;
  }

  // Authorized
  return <>{children}</>;
}
