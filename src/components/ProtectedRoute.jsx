//src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute bloqueia acesso a rotas para usuários não autenticados
 * ou sem papel de admin, se requireAdmin=true.
 */
export function ProtectedRoute({ component: Component, requireAdmin, ...rest }) {
  const { user, role, loading } = useAuth();

  // enquanto carrega o estado de auth, não renderiza nada
  if (loading) return null;

  return (
    <Route
      {...rest}
      render={props => {
        if (!user) {
          // não logado → redireciona p/ login
          return <Navigate to="/login" />;
        }
        if (requireAdmin && role !== 'admin') {
          // logado mas não é admin → tela inicial
          return <Navigate to="/" />;
        }
        // autorizado → renderiza o componente
        return <Component {...props} />;
      }}
    />
  );
}
