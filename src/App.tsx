import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import HomePage from './pages/HomePage';
import WinnersPage from './pages/WinnersPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ParticipantsList from './pages/admin/ParticipantsList';
import RequestsPage from './pages/admin/RequestsPage';
import DrawPage from './pages/admin/DrawPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminGamesPage from './pages/admin/AdminGamesPage';
import GamesPage from './pages/GamesPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/ganhadores" element={<WinnersPage />} />
          <Route path="/brincadeiras" element={<GamesPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/participants"
            element={
              <ProtectedRoute>
                <ParticipantsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/draw"
            element={
              <ProtectedRoute>
                <DrawPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/games"
            element={
              <ProtectedRoute>
                <AdminGamesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;