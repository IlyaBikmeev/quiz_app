import { Navigate } from 'react-router-dom';
import { LoadingState } from '../components/PageState';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { valid, validUnknown } = useAuth();
  if (validUnknown) return <LoadingState label="Проверка входа…" />;
  return <Navigate to={valid ? '/quizzes' : '/login'} replace />;
}
