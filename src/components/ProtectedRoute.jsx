// src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  // Handle redirects and toasts in effects to avoid side-effects in render
  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (message) show(message);
      navigate('/login', { replace: true, state: { from: location } });
    } else if (requireAdmin && role !== 'admin') {
      show(message || 'You do not have permission to access this page.');
      navigate('/', { replace: true });
    }
  }, [loading, user, role, requireAdmin, message, show, navigate, location]);

  // Do not render content while redirecting or auth is loading
  if (loading || !user || (requireAdmin && role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
