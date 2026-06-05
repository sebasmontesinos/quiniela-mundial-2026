import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import SimulationBanner from './components/SimulationBanner';
import Login from './pages/Login';
import Home from './pages/Home';
import FixturePage from './pages/FixturePage';
import StandingsPage from './pages/StandingsPage';
import PendingScreen from './pages/PendingScreen';
import BlockedScreen from './pages/BlockedScreen';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, profileLoading } = useAuth();

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/fixture" replace />;
  }

  return children;
}

function ActivePlayerRoute({ children }) {
  const { isAdmin, status, profileLoading } = useAuth();

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin && status !== 'active') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function StatusGate({ children }) {
  const { status, isAdmin, profileLoading } = useAuth();

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    if (status === 'pending') {
      return <PendingScreen />;
    }
    if (status === 'blocked') {
      return <BlockedScreen />;
    }
  }

  return children;
}

function AuthenticatedRoutes() {
  return (
    <StatusGate>
      <SimulationBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/fixture"
          element={
            <ActivePlayerRoute>
              <FixturePage />
            </ActivePlayerRoute>
          }
        />
        <Route
          path="/standings"
          element={
            <ActivePlayerRoute>
              <StandingsPage />
            </ActivePlayerRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ActivePlayerRoute>
              <ProfilePage />
            </ActivePlayerRoute>
          }
        />
        <Route path="*" element={<Navigate to="/fixture" replace />} />
      </Routes>
    </StatusGate>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AuthenticatedRoutes />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
