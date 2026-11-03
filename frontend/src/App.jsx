import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyPage } from './pages/VerifyPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { QuizDetailPage } from './pages/QuizDetailPage';
import { QuizCreateManualPage } from './pages/QuizCreateManualPage';
import { QuizImportPage } from './pages/QuizImportPage';
import { QuizPlayPage } from './pages/QuizPlayPage';
import { QuizEditPage } from './pages/QuizEditPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="card-sets/*" element={<Navigate to="/quizzes" replace />} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="settings" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
