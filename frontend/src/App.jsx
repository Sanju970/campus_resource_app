import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import AnnouncementsPage from './components/AnnouncementsPage';
import MaterialsPage from './components/MaterialsPage';
import ResourcesPage from './components/ResourcesPage';
import SchedulePage from './components/SchedulePage';
import ProfilePage from './components/ProfilePage';
import NotificationsPage from './components/NotificationsPage';
import FavoritesPage from './components/FavoritesPage';
import AdminPage from './components/AdminPage';
import AIChat from './components/AIChat';
import { Toaster } from './components/ui/sonner';
import { useEffect, useState as useReactState } from 'react';
import ForgotPasswordPage from './components/ForgotPasswordPage';

function AppContent() {
  const { user, setUser } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [loading, setLoading] = useReactState(true);

  // Restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && !user) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
      }
    }
    setLoading(false);
  }, [user, setUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* If not logged in, redirect everything else to login */}
      {!user ? (
        <Route path="*" element={<Navigate to="/login" replace />} />
      ) : (
        /* PRIVATE ROUTES */
        <Route
          path="*"
          element={
            <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
              <Routes>
                <Route path="/" element={<HomePage onNavigate={setCurrentPage} />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />

                <Route
                  path="/admin"
                  element={
                    user.role === 3 || user.role === "3" || user.role === "admin" ? (
                      <AdminPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
              </Routes>
              <AIChat />
            </Layout>
          }
        />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
