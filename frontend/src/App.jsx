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

function AppContent() {
  const { user, setUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useReactState(true);

  // Restore user session from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    setLoading(false);
  }, [user, setUser]);

  // Wait until AuthContext finishes loading user
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If not logged in → show login page
  if (!user) return <LoginPage />;

  // Logged in → render dashboard layout
  return (
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

        {/* Admin-only route */}
        <Route
          path="/admin"
          element={
            user.role === 3 || user.role === '3' || user.role === 'admin'
              ? <AdminPage />
              : <Navigate to="/" replace />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChat />
    </Layout>
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
