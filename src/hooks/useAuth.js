import { useAuth as useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const { user, role, logout } = useAuthContext();
  const isAdmin = role === 'admin';
  const hasHormonalCycle = Boolean(user && user.hasHormonalCycle);
  return { user, isAdmin, hasHormonalCycle, logout };
}
