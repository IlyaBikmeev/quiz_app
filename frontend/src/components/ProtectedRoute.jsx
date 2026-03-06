import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { token, valid, validUnknown } = useAuth();
  const location = useLocation();

  if (validUnknown) {
    return <div className="container mt-5 text-center">Проверка авторизации...</div>;
  }
  if (!token || !valid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
