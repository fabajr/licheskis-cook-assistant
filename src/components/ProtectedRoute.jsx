// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute checks authentication and role, rendering children or navigating.
 * Displays alerts before redirecting to provide clear feedback.
 * Usage:
 * <ProtectedRoute requireAdmin>
 *   <Component />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ requireAdmin, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // While auth state is loading
  if (loading) return null;

  // If not logged in, alert and redirect to login
  if (!user) {
    //alert('You must be logged in to view this page.');
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // If admin role is required and user is not admin, alert and redirect to home
  if (requireAdmin && role !== 'admin') {
    alert('You do not have permission to access this page.');
    return <Navigate to="/" replace />;
  }

  // Authorized
  return <>{children}</>;
}
