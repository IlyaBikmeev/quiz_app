import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingState } from './components/PageState';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const VerifyPage = lazy(() => import('./pages/VerifyPage').then((module) => ({ default: module.VerifyPage })));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage').then((module) => ({ default: module.QuizzesPage })));
const QuizDetailPage = lazy(() => import('./pages/QuizDetailPage').then((module) => ({ default: module.QuizDetailPage })));
const QuizCreateManualPage = lazy(() => import('./pages/QuizCreateManualPage').then((module) => ({ default: module.QuizCreateManualPage })));
const QuizImportPage = lazy(() => import('./pages/QuizImportPage').then((module) => ({ default: module.QuizImportPage })));
const QuizPlayPage = lazy(() => import('./pages/QuizPlayPage').then((module) => ({ default: module.QuizPlayPage })));
const QuizEditPage = lazy(() => import('./pages/QuizEditPage').then((module) => ({ default: module.QuizEditPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const AttemptsPage = lazy(() => import('./pages/AttemptsPage').then((module) => ({ default: module.AttemptsPage })));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingState label="Загрузка страницы…" />}>
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
            <Route path="quizzes/new" element={<ProtectedRoute><QuizCreateManualPage /></ProtectedRoute>} />
            <Route path="quizzes/import" element={<ProtectedRoute><QuizImportPage /></ProtectedRoute>} />
            <Route path="quizzes/new/manual" element={<Navigate to="/quizzes/new" replace />} />
            <Route path="quizzes/new/import" element={<Navigate to="/quizzes/import" replace />} />
            <Route path="quizzes/:id" element={<ProtectedRoute><QuizDetailPage /></ProtectedRoute>} />
            <Route path="quizzes/:id/edit" element={<ProtectedRoute><QuizEditPage /></ProtectedRoute>} />
            <Route path="quizzes/:quizId/play" element={<ProtectedRoute><QuizPlayPage /></ProtectedRoute>} />
            <Route path="attempts" element={<ProtectedRoute><AttemptsPage /></ProtectedRoute>} />
            <Route path="card-sets/*" element={<Navigate to="/quizzes" replace />} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="settings" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
