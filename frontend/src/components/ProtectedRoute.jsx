import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from './PageState';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { token, valid, validUnknown } = useAuth();
  const location = useLocation();
  if (validUnknown) return <LoadingState label="Проверка входа…" />;
  if (!token || !valid) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
