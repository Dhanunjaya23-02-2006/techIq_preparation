import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useCallback } from 'react';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import Analytics from './pages/Dashboard/Analytics';
import AdminDashboard from './pages/Admin/AdminDashboard';
import QuestionManager from './pages/Admin/QuestionManager';
import PDFUpload from './pages/Admin/PDFUpload';
import TestList from './pages/Tests/TestList';
import TestEngine from './pages/Tests/TestEngine';
import TestResult from './pages/Tests/TestResult';
import TestHistory from './pages/Tests/TestHistory';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import TestCreator from './pages/Admin/TestCreator';
import StudyMaterialManager from './pages/Admin/StudyMaterialManager';
import UserManager from './pages/Admin/UserManager';
import PYQManager from './pages/Admin/PYQManager';
import PlanManager from './pages/Admin/PlanManager';
import Plans from './pages/Pricing/Plans';
import Landing from './pages/Landing/Landing';
import Profile from './pages/Auth/Profile';
import Settings from './pages/Auth/Settings';
import ForgotPassword from './pages/Auth/ForgotPassword';
import CurrentAffairs from './pages/Dashboard/CurrentAffairs';
import StudyMaterial from './pages/Dashboard/StudyMaterial';
import { logVisit } from './services/analyticsService';

// Inner component that has access to useNavigate (must be inside BrowserRouter)
function AppRoutes() {
  const { isAuthenticated, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  // Listen for auth:logout events from API interceptor to redirect via React Router
  useEffect(() => {
    const handleAuthLogout = (e) => {
      const redirect = e.detail?.redirect || '/login';
      navigate(redirect, { replace: true });
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
    
    if (!sessionStorage.getItem('has_visited')) {
      logVisit(); // Track when the app is opened
      sessionStorage.setItem('has_visited', 'true');
    }

    // Heartbeat to keep user "live" in the admin dashboard
    let heartbeatInterval;
    if (isAuthenticated) {
      heartbeatInterval = setInterval(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
          const url = (import.meta.env.VITE_API_URL || '/api/v1') + '/accounts/heartbeat';
          fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => {});
        }
      }, 60000); // Every 1 minute
    }

    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        const token = localStorage.getItem('access_token');
        if (token) {
          // Use relative URL so it goes through the Vite proxy during dev
          const url = (import.meta.env.VITE_API_URL || '/api/v1') + '/accounts/offline';
          
          fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated, fetchProfile]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
      }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Test Engine (no sidebar) */}
        <Route path="/test-engine" element={<ProtectedRoute><TestEngine /></ProtectedRoute>} />
        <Route path="/test-result" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />

        {/* Protected with Layout */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
        <Route path="/tests" element={<ProtectedRoute><Layout><TestList /></Layout></ProtectedRoute>} />
        <Route path="/grand-test" element={<ProtectedRoute><Layout><TestList /></Layout></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
        <Route path="/test-history" element={<ProtectedRoute><Layout><TestHistory /></Layout></ProtectedRoute>} />
        <Route path="/pyq" element={<ProtectedRoute><Layout><TestList /></Layout></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><Layout><Plans /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/study-material" element={<ProtectedRoute><Layout><StudyMaterial /></Layout></ProtectedRoute>} />
        <Route path="/current-affairs" element={<ProtectedRoute><Layout><CurrentAffairs /></Layout></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/questions" element={<ProtectedRoute adminOnly><Layout><QuestionManager /></Layout></ProtectedRoute>} />
        <Route path="/admin/pdf-upload" element={<ProtectedRoute adminOnly><Layout><PDFUpload /></Layout></ProtectedRoute>} />
        <Route path="/admin/tests" element={<ProtectedRoute adminOnly><Layout><TestCreator /></Layout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><Layout><UserManager /></Layout></ProtectedRoute>} />
        <Route path="/admin/pyqs" element={<ProtectedRoute adminOnly><Layout><PYQManager /></Layout></ProtectedRoute>} />
        <Route path="/admin/plans" element={<ProtectedRoute adminOnly><Layout><PlanManager /></Layout></ProtectedRoute>} />
        <Route path="/admin/study-material" element={<ProtectedRoute adminOnly><Layout><StudyMaterialManager /></Layout></ProtectedRoute>} />

        {/* Default / Public View */}
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

// Wrapper component that provides BrowserRouter context
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
